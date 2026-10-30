import React, { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { supabase, withRequestTimeout } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

const typedDb = supabase as unknown as SupabaseClient;

interface FriendRow {
  id: string;
  friend_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface RequestRow {
  id: string;
  from_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function FriendsPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadFriends = useCallback(async () => {
    const { data, error } = await withRequestTimeout(typedDb.rpc('get_my_friends'), 15000, 'Friends request timed out');
    if (error) throw error;
    setFriends((data || []) as FriendRow[]);
  }, []);

  const loadRequests = useCallback(async () => {
    const { data, error } = await withRequestTimeout(typedDb.rpc('get_pending_friend_requests'), 15000, 'Friend requests timed out');
    if (error) throw error;
    setRequests((data || []) as RequestRow[]);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setPageLoading(true);
    try {
      await Promise.all([loadFriends(), loadRequests()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load your friends. Apply the latest database migration.');
    } finally {
      setPageLoading(false);
    }
  }, [user, loadFriends, loadRequests]);

  useEffect(() => { void refresh(); }, [refresh]);

  const sendRequest = async () => {
    if (!search.trim() || !user || loading) return;
    setLoading(true);
    try {
      const { data: matches, error: searchError } = await withRequestTimeout(typedDb.rpc('find_profile_by_username', {
        search_username: search.trim().toLowerCase(),
      }), 12000, 'Player search timed out');
      if (searchError) throw searchError;
      const matchRows = (matches ?? []) as Array<{ id: string; username: string }>;
      const target = matchRows[0];
      if (!target) throw new Error('No player found with that username.');
      if (target.id === user.id) throw new Error('You cannot add yourself as a friend.');

      const { error: requestError } = await withRequestTimeout(typedDb.rpc('send_snackverse_friend_request', {
        to_user_id: target.id,
      }), 15000, 'Friend request timed out');
      if (requestError) throw requestError;

      toast.success(`Friend request sent to @${target.username}.`);
      setSearch('');
      await loadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send friend request.');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await withRequestTimeout(typedDb.rpc('accept_friend_request', { request_id: requestId }), 15000, 'Accept request timed out');
      if (error) throw error;
      toast.success('Friend request accepted!');
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not accept the friend request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Friends">
        <div className="mx-auto max-w-3xl py-6">
          <h1 className="mb-6 text-3xl font-poppins font-bold text-pv-plum">👥 Friends</h1>
          <div className="glass-panel mb-8">
            <h2 className="mb-3 text-xl font-bold text-pv-plum">Find a player</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Enter exact username" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-pv-pink" />
              <ClayButton type="button" variant="primary" onClick={sendRequest} loading={loading} disabled={!search.trim() || loading}>Add friend</ClayButton>
            </div>
          </div>

          {requests.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xl font-bold text-pv-plum">Pending Requests</h2>
              {requests.map((request) => (
                <div key={request.id} className="clay-card mb-3 flex items-center justify-between gap-3">
                  <div><p className="font-medium text-pv-plum">{request.display_name}</p><p className="text-xs text-gray-500">@{request.username}</p></div>
                  <ClayButton type="button" variant="secondary" size="sm" onClick={() => acceptRequest(request.id)} loading={loading} disabled={loading}>Accept</ClayButton>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-3 text-xl font-bold text-pv-plum">My Friends</h2>
          {pageLoading ? (
            <div className="py-8 text-center text-pv-plum/70">Loading friends…</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {friends.map((friend) => (
                <motion.div key={friend.id} whileHover={{ scale: 1.02 }} className="clay-card flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pv-sky text-lg">🧑</div>
                  <div><p className="font-semibold text-pv-plum">{friend.display_name}</p><p className="text-xs text-gray-500">@{friend.username}</p></div>
                </motion.div>
              ))}
              {friends.length === 0 && <div className="col-span-2 py-6 text-center text-gray-500">No friends yet. Search for a username to get started.</div>}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
