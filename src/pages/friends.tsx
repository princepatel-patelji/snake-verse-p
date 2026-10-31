import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { supabase, formatSupabaseError } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface FriendSession {
  id: string;
  game_type: string;
  score: number;
  xp_earned: number;
  duration_seconds: number;
  created_at?: string;
  completed_at?: string;
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
  last_active_at: string | null;
  total_seconds: number;
  games_played: number;
  top_score: number;
  recent_sessions: FriendSession[];
}

function formatTimeSpent(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 mins';
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

      // Check 'friends' table
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

      // Also check 'friendships' table if used
      const { data: f2 } = await supabase
        .from('friendships' as never)
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id},requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

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

      // Fetch full profiles for all friends
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profErr) throw profErr;

      // Fetch game sessions for all friends to compute Time Spent, Games Played & Recent Activity
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .in('user_id', friendIds)
        .order('created_at' as never, { ascending: false });

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
          created_at: (raw.created_at as string) || (raw.completed_at as string) || undefined,
        });
        sessionsByUser.set(uid, list);
      });

      const enriched: FriendProfileStats[] = (profData || []).map((p: Record<string, unknown>) => {
        const uid = String(p.id);
        const userSessions = sessionsByUser.get(uid) || [];
        const totalSeconds = userSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
        const sessionXp = userSessions.reduce((acc, s) => acc + (s.xp_earned || 0), 0);
        const topScore = userSessions.reduce((max, s) => Math.max(max, s.score || 0), 0);

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
          last_active_at: (p.last_active_at as string) || (p.updated_at as string) || null,
          total_seconds: totalSeconds,
          games_played: userSessions.length,
          top_score: topScore,
          recent_sessions: userSessions.slice(0, 5),
        };
      });

      enriched.sort((a, b) => b.xp - a.xp);
      setFriends(enriched);
    } catch (err) {
      toast.error(formatSupabaseError(err));
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

      // Insert into friends (and fallback to friendships if schema uses that)
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
      toast.error(formatSupabaseError(err));
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

          {/* Find a player */}
          <div className="clay-card p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Find a player</h2>
            <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter exact username (e.g. prince_patel)"
                className="flex-1 p-3.5 rounded-xl border border-purple-100 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              <ClayButton type="submit" variant="primary" loading={adding}>
                Add friend
              </ClayButton>
            </form>
          </div>

          {/* Friends List with Full Stats Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-900">
              My Friends ({friends.length}){' '}
              <span className="text-sm font-normal text-slate-500">
                (Click any friend to inspect full profile, time spent & game history)
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => {
                  const isSelected = selectedFriend?.id === friend.id;
                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend)}
                      className={`clay-card p-6 cursor-pointer transition-all hover:scale-[1.01] border-2 ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-300'
                          : 'border-transparent hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow">
                            {friend.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-extrabold text-purple-900">
                              {friend.display_name}
                            </h3>
                            <p className="text-xs font-semibold text-amber-700">
                              @{friend.username} • {friend.favorite_snack}
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black">
                          Level {friend.level}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 line-clamp-2">{friend.bio}</p>

                      {/* Quick Stats Bar on Card */}
                      <div className="mt-4 pt-3 border-t border-purple-100 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-amber-50/80 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Total XP</p>
                          <p className="text-sm font-black text-amber-600">⭐ {friend.xp}</p>
                        </div>
                        <div className="bg-emerald-50/80 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">
                            Time Spent
                          </p>
                          <p className="text-sm font-black text-emerald-700">
                            ⏱️ {formatTimeSpent(friend.total_seconds)}
                          </p>
                        </div>
                        <div className="bg-indigo-50/80 p-2 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Games</p>
                          <p className="text-sm font-black text-indigo-700">
                            🎮 {friend.games_played}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-right">
                        <span className="text-xs font-bold text-purple-700 hover:underline">
                          View Full Stats & Activity →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full Friend Profile & Time Spent Inspector Modal/Panel */}
          {selectedFriend && (
            <div className="clay-card p-6 md:p-8 border-2 border-amber-400 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                    {selectedFriend.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                      Friend Profile & Live Telemetry
                    </span>
                    <h2 className="text-2xl font-black text-purple-900">
                      {selectedFriend.display_name}{' '}
                      <span className="text-base font-semibold text-slate-500">
                        (@{selectedFriend.username})
                      </span>
                    </h2>
                    <p className="text-sm text-slate-600">{selectedFriend.bio}</p>
                  </div>
                </div>

                <ClayButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setSelectedFriend(null)}
                >
                  Close Profile ✕
                </ClayButton>
              </div>

              {/* Complete Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Current Level</p>
                  <p className="text-2xl font-black text-purple-900 mt-1">
                    Lv. {selectedFriend.level}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Total XP</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {selectedFriend.xp} XP
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Total Time Spent</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatTimeSpent(selectedFriend.total_seconds)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Games Played</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">
                    {selectedFriend.games_played}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-purple-100 shadow-sm col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-500">Best Score / Streak</p>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {selectedFriend.top_score} pts • 🔥{selectedFriend.streak_days}d
                  </p>
                </div>
              </div>

              {/* Recent Game History of Friend */}
              <div>
                <h3 className="text-lg font-bold text-purple-900 mb-3">
                  Recent Games Played by {selectedFriend.display_name}
                </h3>
                {selectedFriend.recent_sessions.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-white/60 p-4 rounded-xl">
                    {selectedFriend.display_name} hasn&apos;t completed any recorded game sessions yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedFriend.recent_sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-purple-100"
                      >
                        <div>
                          <p className="font-bold text-purple-900 capitalize">
                            🎮 {sess.game_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-slate-500">
                            Score: <strong>{sess.score}</strong> • Time Spent:{' '}
                            <strong>{formatTimeSpent(sess.duration_seconds)}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            +{sess.xp_earned} XP
                          </span>
                          {sess.created_at && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              {new Date(sess.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
