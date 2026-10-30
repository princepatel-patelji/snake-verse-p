import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FriendsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) { loadFriends(); loadRequests(); } }, [user]);

  const loadFriends = async () => {
    const { data } = await supabase.from('friendships').select(`*, profiles!friend_id(display_name, avatar_url)`).eq('user_id', user!.id).eq('status', 'accepted');
    setFriends(data || []);
  };
  const loadRequests = async () => {
    const { data } = await supabase.from('friend_requests').select(`*, profiles!from_id(display_name)`).eq('to_id', user!.id).eq('status', 'pending');
    setRequests(data || []);
  };

  const sendRequest = async () => {
    if (!search.trim() || !user) return;
    setLoading(true);
    try {
      const { data: target } = await supabase.from('profiles').select('id').ilike('username', search.trim()).single();
      if (!target) throw new Error('User not found');
      if (target.id === user.id) throw new Error('Cannot add yourself');
      await supabase.from('friend_requests').insert({ from_id: user.id, to_id: target.id, status: 'pending' });
      toast.success('Friend request sent!');
      setSearch('');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const acceptRequest = async (reqId: string, fromId: string) => {
    await supabase.from('friend_requests').delete().eq('id', reqId);
    await supabase.from('friendships').insert([{ user_id: user!.id, friend_id: fromId, status: 'accepted' }, { user_id: fromId, friend_id: user!.id, status: 'accepted' }]);
    toast.success('Friend added!');
    await loadRequests(); await loadFriends();
  };

  return (
    <ProtectedRoute>
      <Layout title="Friends">
        <div className="max-w-3xl mx-auto py-6">
          <h1 className="text-3xl font-poppins font-bold text-pv-plum mb-6">👥 Friends</h1>
          <div className="glass-panel mb-8">
            <div className="flex gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" />
              <ClayButton variant="primary" onClick={sendRequest} loading={loading}>Add</ClayButton>
            </div>
          </div>

          {requests.length > 0 && (
            <div className="mb-8"><h2 className="text-xl font-bold text-pv-plum mb-3">Pending Requests</h2>
              {requests.map(r => (
                <div key={r.id} className="clay-card flex justify-between items-center mb-3">
                  <span className="font-medium">{r.profiles?.display_name}</span>
                  <ClayButton variant="secondary" size="sm" onClick={() => acceptRequest(r.id, r.from_id)}>Accept</ClayButton>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-bold text-pv-plum mb-3">My Friends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(f => (
              <motion.div key={f.id} whileHover={{ scale: 1.02 }} className="clay-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pv-sky flex items-center justify-center text-lg">🧑</div>
                <div><p className="font-semibold text-pv-plum">{f.profiles?.display_name}</p><p className="text-xs text-gray-500">@{f.profiles?.username}</p></div>
              </motion.div>
            ))}
            {friends.length === 0 && <div className="col-span-2 text-center py-6 text-gray-500">No friends yet. Start adding people!</div>}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}