import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface FriendSession {
  id: string;
  game_type: string;
  score: number;
  xp_earned: number;
  duration_seconds: number;
  created_at?: string;
}

interface FriendProfileStats {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  favorite_snack: string;
  level: number;
  xp: number;
  streak_days: number;
  total_seconds: number;
  games_played: number;
  top_score: number;
  recent_sessions: FriendSession[];
}

function getErrorMessage(err: unknown): string {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  const e = err as { message?: string };
  return e.message || 'Could not complete request.';
}

function formatTimeSpent(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function FriendsPage() {
  const user = useAuthStore((s) => s.user);
  const [searchUsername, setSearchUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendProfileStats[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfileStats | null>(null);

  const loadFriendsWithStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const friendIdsSet = new Set<string>();

      const { data: f1 } = await supabase
        .from('friends' as never)
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      (f1 || []).forEach((row: Record<string, unknown>) => {
        const uid = String(row.user_id || '');
        const fid = String(row.friend_id || '');
        if (uid && uid !== user.id) friendIdsSet.add(uid);
        if (fid && fid !== user.id) friendIdsSet.add(fid);
      });

      const { data: f2 } = await supabase
        .from('friendships' as never)
        .select('*')
        .or(
          `user_id.eq.${user.id},friend_id.eq.${user.id},requester_id.eq.${user.id},addressee_id.eq.${user.id}`
        );

      (f2 || []).forEach((row: Record<string, unknown>) => {
        ['user_id', 'friend_id', 'requester_id', 'addressee_id'].forEach((col) => {
          const val = String(row[col] || '');
          if (val && val !== 'undefined' && val !== user.id) {
            friendIdsSet.add(val);
          }
        });
      });

      const friendIds = Array.from(friendIdsSet);
      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profErr) throw profErr;

      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .in('user_id', friendIds);

      const sessionsByUser = new Map<string, FriendSession[]>();
      (sessionsData || []).forEach((raw: Record<string, unknown>) => {
        const uid = String(raw.user_id || '');
        const list = sessionsByUser.get(uid) || [];
        list.push({
          id: String(raw.id || Math.random()),
          game_type: String(raw.game_type || 'snack_game'),
          score: Number(raw.score || 0),
          xp_earned: Number(raw.xp_earned || 0),
          duration_seconds: Number(raw.duration_seconds || 0),
          created_at:
            (raw.created_at as string) || (raw.completed_at as string) || undefined,
        });
        sessionsByUser.set(uid, list);
      });

      const enriched: FriendProfileStats[] = (profData || []).map(
        (p: Record<string, unknown>) => {
          const uid = String(p.id);
          const userSessions = sessionsByUser.get(uid) || [];
          const totalSeconds = userSessions.reduce(
            (acc, s) => acc + (s.duration_seconds || 0),
            0
          );
          const sessionXp = userSessions.reduce(
            (acc, s) => acc + (s.xp_earned || 0),
            0
          );
          const topScore = userSessions.reduce(
            (max, s) => Math.max(max, s.score || 0),
            0
          );

          const totalXp = Number(p.xp_points ?? p.xp ?? sessionXp ?? 0);
          const level = Number(p.level ?? Math.max(1, Math.floor(totalXp / 100) + 1));

          return {
            id: uid,
            username: String(p.username || 'player'),
            display_name: String(p.display_name || p.username || 'SnackVerse Friend'),
            bio: String(p.bio || 'Ready to Eat, Play, Puzzle, Repeat! 🍔'),
            favorite_snack: String(p.favorite_snack || '🍕 Pizza'),
            level,
            xp: totalXp,
            streak_days: Number(p.streak_days ?? 1),
            total_seconds: totalSeconds,
            games_played: userSessions.length,
            top_score: topScore,
            recent_sessions: userSessions.slice(0, 5),
          };
        }
      );

      enriched.sort((a, b) => b.xp - a.xp);
      setFriends(enriched);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFriendsWithStats();
  }, [loadFriendsWithStats]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || adding) return;

    const cleanUsername = searchUsername.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) {
      toast.error('Please enter a username.');
      return;
    }

    setAdding(true);
    try {
      const { data: targetProfile, error: findErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!targetProfile) {
        toast.error(`No player found with username "@${cleanUsername}".`);
        return;
      }

      const targetId = String((targetProfile as Record<string, unknown>).id);
      if (targetId === user.id) {
        toast.error("You can't add yourself as a friend!");
        return;
      }

      const { error: insertErr } = await supabase.from('friends' as never).insert({
        user_id: user.id,
        friend_id: targetId,
        status: 'accepted',
      } as never);

      if (insertErr) {
        await supabase.from('friendships' as never).insert({
          user_id: user.id,
          friend_id: targetId,
          status: 'accepted',
        } as never);
      }

      toast.success(`Added @${cleanUsername} to your friends! 🎉`);
      setSearchUsername('');
      await loadFriendsWithStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Friends | Prince's SnackVerse">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <h1 className="text-3xl font-extrabold text-purple-900 flex items-center gap-3">
            <span>👥</span> Friends
          </h1>

          <div className="clay-card p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Find a player</h2>
            <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter exact username"
                className="flex-1 p-3.5 rounded-xl border border-purple-100 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              <ClayButton type="submit" variant="primary" loading={adding}>
                Add friend
              </ClayButton>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-900">
              My Friends ({friends.length}){' '}
              <span className="text-sm font-normal text-slate-500">
                (Click any friend to view full profile, level & time spent)
              </span>
            </h2>

            {loading ? (
              <div className="clay-card p-8 text-center text-slate-500">
                Loading your friends and their live stats...
              </div>
            ) : friends.length === 0 ? (
              <div className="clay-card p-8 text-center text-slate-500">
                No friends yet. Search for a username above to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {friends.map((friend) => {
                  const isSelected = selectedFriend?.id === friend.id;
                  return (
                    <div
                      key={friend.id}
                      onClick={() =>
                        setSelectedFriend(isSelected ? null : friend)
                      }
                      className={`clay-card p-6 cursor-pointer transition-all hover:scale-[1.01] border-2 ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-300'
                          : 'border-transparent hover:border-purple-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow">
                            🧑
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-extrabold text-purple-900">
                                {friend.display_name}
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-xs font-black">
                                Level {friend.level}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-500">
                              @{friend.username} • {friend.favorite_snack}
                            </p>
                          </div>
                        </div>

                        {/* Always-visible Stats Bar on Friend Card */}
                        <div className="grid grid-cols-4 gap-3 text-center bg-white/90 px-4 py-2.5 rounded-2xl border border-purple-100 shadow-sm">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Level
                            </p>
                            <p className="text-sm font-black text-purple-900">
                              Lv. {friend.level}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Total XP
                            </p>
                            <p className="text-sm font-black text-amber-600">
                              ⭐ {friend.xp}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Time Spent
                            </p>
                            <p className="text-sm font-black text-emerald-600">
                              ⏱️ {formatTimeSpent(friend.total_seconds)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Games
                            </p>
                            <p className="text-sm font-black text-indigo-600">
                              🎮 {friend.games_played}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-purple-50">
                        <span>{friend.bio}</span>
                        <span className="font-bold text-purple-800">
                          {isSelected ? 'Hide Full Profile ▲' : 'Inspect Full Profile ▼'}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-5 pt-5 border-t-2 border-amber-200 space-y-5">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                              <p className="text-xs font-bold text-purple-700">Player Level</p>
                              <p className="text-xl font-black text-purple-900 mt-1">
                                Level {friend.level}
                              </p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                              <p className="text-xs font-bold text-amber-700">Total XP</p>
                              <p className="text-xl font-black text-amber-700 mt-1">
                                ⭐ {friend.xp} XP
                              </p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-700">
                                Time Spent Playing
                              </p>
                              <p className="text-xl font-black text-emerald-700 mt-1">
                                ⏱️ {formatTimeSpent(friend.total_seconds)}
                              </p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                              <p className="text-xs font-bold text-indigo-700">Games Played</p>
                              <p className="text-xl font-black text-indigo-700 mt-1">
                                🎮 {friend.games_played}
                              </p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 col-span-2 sm:col-span-1">
                              <p className="text-xs font-bold text-rose-700">Best Score / Streak</p>
                              <p className="text-lg font-black text-rose-700 mt-1">
                                {friend.top_score} pts • 🔥{friend.streak_days}d
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/80 p-4 rounded-2xl border border-purple-100">
                            <h4 className="text-sm font-extrabold text-purple-900 mb-3">
                              Recent Game Activity ({friend.display_name})
                            </h4>
                            {friend.recent_sessions.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                No recorded game sessions yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {friend.recent_sessions.map((sess) => (
                                  <div
                                    key={sess.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-purple-900 capitalize">
                                        🎮 {sess.game_type.replace('_', ' ')}
                                      </span>
                                      <span className="text-slate-500 ml-2">
                                        Score: <strong>{sess.score}</strong> • Time:{' '}
                                        <strong>{formatTimeSpent(sess.duration_seconds)}</strong>
                                      </span>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
                                      +{sess.xp_earned} XP
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}