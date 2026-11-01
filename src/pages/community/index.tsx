import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { supabase, formatSupabaseError } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface CommunityItem {
  id: string;
  name: string;
  description: string | null;
  invite_code?: string | null;
  code?: string | null;
  icon?: string | null;
  creator_id?: string | null;
  member_count?: number;
  created_at?: string;
}

interface MemberStat {
  user_id: string;
  role: string;
  joined_at: string;
  username: string;
  display_name: string;
  level: number;
  xp: number;
  bio: string | null;
  total_seconds: number;
  games_played: number;
  top_score: number;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function CommunitiesPage() {
  const user = useAuthStore((s) => s.user);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Selected Community Modal
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);
  const [members, setMembers] = useState<MemberStat[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberStat | null>(null);

  const loadCommunities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: memberships, error: memErr } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      if (memErr) throw memErr;

      const ids = (memberships || []).map((m: { community_id: string }) => m.community_id);

      if (ids.length === 0) {
        setCommunities([]);
        return;
      }

      const { data: commData, error: commErr } = await supabase
        .from('communities')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (commErr) throw commErr;
      setCommunities((commData as CommunityItem[]) || []);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  const openCommunityDetails = async (comm: CommunityItem) => {
    setSelectedCommunity(comm);
    setSelectedMember(null);
    setLoadingMembers(true);
    try {
      const { data: memRows, error: memErr } = await supabase
        .from('community_members')
        .select('user_id, role, joined_at')
        .eq('community_id', comm.id);

      if (memErr) throw memErr;

      const userIds = (memRows || []).map((r: { user_id: string }) => r.user_id);
      if (userIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profRows } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const { data: sessionRows } = await supabase
        .from('game_sessions')
        .select('user_id, duration_seconds, score, xp_earned')
        .in('user_id', userIds);

      const profileMap = new Map<string, Record<string, unknown>>();
      (profRows || []).forEach((p: Record<string, unknown>) => {
        profileMap.set(String(p.id), p);
      });

      const statsMap = new Map<
        string,
        { total_seconds: number; games_played: number; top_score: number; session_xp: number }
      >();

      (sessionRows || []).forEach((s: Record<string, unknown>) => {
        const uid = String(s.user_id);
        const cur = statsMap.get(uid) || {
          total_seconds: 0,
          games_played: 0,
          top_score: 0,
          session_xp: 0,
        };
        cur.total_seconds += Number(s.duration_seconds || 0);
        cur.games_played += 1;
        cur.top_score = Math.max(cur.top_score, Number(s.score || 0));
        cur.session_xp += Number(s.xp_earned || 0);
        statsMap.set(uid, cur);
      });

      const combined: MemberStat[] = (memRows || []).map(
        (m: { user_id: string; role: string; joined_at: string }) => {
          const p = profileMap.get(m.user_id) || {};
          const st = statsMap.get(m.user_id) || {
            total_seconds: 0,
            games_played: 0,
            top_score: 0,
            session_xp: 0,
          };
          const rawXp = Number(p.xp_points ?? p.xp ?? st.session_xp ?? 0);
          const rawLevel = Number(p.level ?? Math.max(1, Math.floor(rawXp / 100) + 1));

          return {
            user_id: m.user_id,
            role: m.role || 'member',
            joined_at: m.joined_at,
            username: String(p.username || 'player'),
            display_name: String(p.display_name || p.username || 'SnackVerse Player'),
            level: rawLevel,
            xp: rawXp,
            bio: (p.bio as string) || 'Eating, Playing & Puzzling in SnackVerse!',
            total_seconds: st.total_seconds,
            games_played: st.games_played,
            top_score: st.top_score,
          };
        }
      );

      combined.sort((a, b) => b.xp - a.xp);
      setMembers(combined);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || creating) return;
    const cleanName = newName.trim();
    if (cleanName.length < 2) {
      toast.error('Please enter a community name (at least 2 characters).');
      return;
    }

    setCreating(true);
    try {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: created, error: createErr } = await supabase
        .from('communities')
        .insert({
          name: cleanName,
          description: newDesc.trim() || null,
          invite_code: generatedCode,
          creator_id: user.id,
          member_count: 1,
        } as never)
        .select('*')
        .single();

      if (createErr) throw createErr;

      const comm = created as CommunityItem;

      await supabase.from('community_members').upsert(
        {
          community_id: comm.id,
          user_id: user.id,
          role: 'admin',
        } as never,
        { onConflict: 'community_id,user_id' }
      );

      toast.success(`Community "${cleanName}" created!`);
      setNewName('');
      setNewDesc('');
      await loadCommunities();
      await openCommunityDetails(comm);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || joining) return;
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter an invite code.');
      return;
    }

    setJoining(true);
    try {
      const { data: found, error: findErr } = await supabase
        .from('communities')
        .select('*')
        .ilike('invite_code', code)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!found) {
        toast.error('No community found with that invite code.');
        return;
      }

      const comm = found as CommunityItem;

      const { error: joinErr } = await supabase.from('community_members').upsert(
        {
          community_id: comm.id,
          user_id: user.id,
          role: 'member',
        } as never,
        { onConflict: 'community_id,user_id' }
      );

      if (joinErr) throw joinErr;

      toast.success(`Joined ${comm.name}! 🎉`);
      setInviteCodeInput('');
      await loadCommunities();
      await openCommunityDetails(comm);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setJoining(false);
    }
  };

  const copyInviteCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(`Invite code ${code} copied!`);
  };

  return (
    <ProtectedRoute>
      <Layout title="Communities | Prince's SnackVerse">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-purple-900 flex items-center gap-3">
              <span>🏛️</span> Communities
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="clay-card p-6">
              <h2 className="text-xl font-bold text-purple-900 mb-4">Join with Code</h2>
              <form onSubmit={handleJoinWithCode} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter invite code (e.g. AB12CD)"
                  className="flex-1 p-3 rounded-xl border border-purple-100 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                />
                <ClayButton type="submit" variant="primary" loading={joining}>
                  Join
                </ClayButton>
              </form>
            </div>

            <div className="clay-card p-6">
              <h2 className="text-xl font-bold text-purple-900 mb-4">Create Community</h2>
              <form onSubmit={handleCreateCommunity} className="space-y-3">
                <input
                  type="text"
                  placeholder="Community Name"
                  required
                  className="w-full p-3 rounded-xl border border-purple-100 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  className="w-full p-3 rounded-xl border border-purple-100 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <ClayButton type="submit" variant="success" loading={creating} className="w-full">
                  Create
                </ClayButton>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-900">
              My Communities{' '}
              <span className="text-sm font-normal text-slate-500">
                (Click any community card to open it)
              </span>
            </h2>

            {loading ? (
              <div className="clay-card p-8 text-center text-slate-500">
                Loading communities...
              </div>
            ) : communities.length === 0 ? (
              <div className="clay-card p-8 text-center text-slate-500">
                You haven&apos;t joined any communities yet. Create one or join with a code above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communities.map((comm) => {
                  const code = comm.invite_code || comm.code || 'SNACK1';
                  const isSelected = selectedCommunity?.id === comm.id;

                  return (
                    <div
                      key={comm.id}
                      onClick={() => void openCommunityDetails(comm)}
                      className={`clay-card p-6 cursor-pointer transition-all hover:scale-[1.01] border-2 ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-300'
                          : 'border-transparent hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black flex items-center justify-center shadow">
                              {comm.icon || '🏛️'}
                           </div>
                          <div>
                            <h3 className="text-xl font-extrabold text-purple-900">
                              {comm.name}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Code: {code}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-600 mt-4 text-sm">
                        {comm.description || 'SnackVerse Gaming Community'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-semibold text-purple-800">
                        <span className="text-slate-500">Created by {comm.creator_id === user?.id ? 'You' : 'Member'}</span>
                        <span className="font-bold text-purple-900 cursor-pointer hover:underline">
                          Open
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Community Modal / View */}
          {selectedCommunity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-purple-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-4 mb-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                        Community Hub & Leaderboard
                      </span>
                      <h2 className="text-2xl md:text-3xl font-black text-purple-900 mt-1">
                        {selectedCommunity.icon || '🏛️'} {selectedCommunity.name}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {selectedCommunity.description || 'Compete with members and climb the ranks!'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <ClayButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          copyInviteCode(
                            selectedCommunity.invite_code || selectedCommunity.code || 'SNACK1'
                          )
                        }
                      >
                        Copy Code: {selectedCommunity.invite_code || selectedCommunity.code || 'SNACK1'} 📋
                      </ClayButton>
                      <button
                        onClick={() => {
                          setSelectedCommunity(null);
                          setSelectedMember(null);
                        }}
                        className="p-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition"
                      >
                        Close ✕
                      </button>
                    </div>
                  </div>

                  {loadingMembers ? (
                    <p className="text-center py-10 text-slate-500 font-semibold animate-pulse">
                      Loading community members and game stats...
                    </p>
                  ) : members.length === 0 ? (
                    <p className="text-center py-10 text-slate-500">No members found.</p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Members ({members.length}) — Click any player to inspect their full stats
                      </p>
                      {members.map((m, idx) => (
                        <div
                          key={m.user_id}
                          onClick={() => setSelectedMember(selectedMember?.user_id === m.user_id ? null : m)}
                          className="p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 shadow-sm flex flex-col items-start gap-4 cursor-pointer transition"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black flex items-center justify-center shadow text-xl">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-purple-900 text-lg flex items-center gap-2">
                                    {m.display_name}
                                    {m.role === 'admin' && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase tracking-wide">
                                        👑 Admin
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-slate-500 font-medium">@{m.username}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-center sm:text-right bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm w-full sm:w-auto">
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-slate-400">Level</p>
                                  <p className="text-base font-black text-purple-900">Lv. {m.level}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-slate-400">Total XP</p>
                                  <p className="text-base font-black text-amber-600">{m.xp} XP</p>
                                </div>
                              </div>
                          </div>
                          
                          {/* Expanded Member Details */}
                          {selectedMember?.user_id === m.user_id && (
                             <div className="w-full mt-2 pt-4 border-t border-slate-200 animate-fadeIn">
                                 <p className="text-sm text-slate-600 italic mb-4">"{m.bio}"</p>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    <div className="p-3 rounded-xl bg-purple-50">
                                      <p className="text-xs text-purple-600 font-semibold">Player Level</p>
                                      <p className="text-lg font-black text-purple-900">Level {m.level}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-50">
                                      <p className="text-xs text-amber-600 font-semibold">Total XP</p>
                                      <p className="text-lg font-black text-amber-700">{m.xp} XP</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-50">
                                      <p className="text-xs text-emerald-600 font-semibold">Time Playing</p>
                                      <p className="text-lg font-black text-emerald-700">
                                        {formatDuration(m.total_seconds)}
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-indigo-50">
                                      <p className="text-xs text-indigo-600 font-semibold">Games & Best</p>
                                      <p className="text-lg font-black text-indigo-700">
                                        {m.games_played} ({m.top_score} pts)
                                      </p>
                                    </div>
                                  </div>
                             </div>
                          )}
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
