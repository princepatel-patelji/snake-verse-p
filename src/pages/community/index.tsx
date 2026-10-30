import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClayButton from '@/components/ClayButton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import type { Community } from '@/types/database';

export default function CommunityPage() {
  const { user, profile } = useAuthStore();
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [newCommunity, setNewCommunity] = useState({ name: '', desc: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) loadMyCommunities(); }, [user]);

  const loadMyCommunities = async () => {
    if (!user) return;
    try {
      const { data: memberships } = await supabase.from('community_members').select('community_id').eq('user_id', user.id).eq('status', 'active');
      const ids = memberships?.map(m => m.community_id) || [];
      if (ids.length === 0) { setMyCommunities([]); return; }
      const { data } = await supabase.from('communities').select('*').in('id', ids);
      setMyCommunities(data || []);
    } catch (e) { console.error(e); }
  };

  const joinWithCode = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);
    try {
      const { data: comm, error: fetchErr } = await supabase.from('communities').select('*').eq('invite_code', inviteCode.trim()).single();
      if (fetchErr || !comm) throw new Error('Invalid invitation code');
      
      const { data: exists } = await supabase.from('community_members').select('id').eq('community_id', comm.id).eq('user_id', user.id).single();
      if (exists) throw new Error('You are already a member');

      const { error: insertErr } = await supabase.from('community_members').insert({ community_id: comm.id, user_id: user.id, role: 'member', status: 'active' });
      if (insertErr) throw insertErr;
      toast.success(`Joined ${comm.name}!`);
      setInviteCode('');
      await loadMyCommunities();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const createCommunity = async () => {
    if (!newCommunity.name.trim() || !user) return;
    setLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: comm, error: createErr } = await supabase.from('communities').insert({
        name: newCommunity.name, description: newCommunity.desc, creator_id: user.id, invite_code: code, requires_approval: false
      }).select().single();
      if (createErr) throw createErr;
      await supabase.from('community_members').insert({ community_id: comm.id, user_id: user.id, role: 'creator', status: 'active' });
      toast.success('Community created! Share code:' + code);
      setNewCommunity({ name: '', desc: '' });
      await loadMyCommunities();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <ProtectedRoute>
      <Layout title="Communities">
        <div className="max-w-4xl mx-auto py-6">
          <h1 className="text-3xl font-poppins font-bold text-pv-plum mb-6">🏛️ Communities</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-panel">
              <h2 className="text-xl font-bold text-pv-plum mb-3">Join with Code</h2>
              <div className="flex gap-3">
                <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Enter invite code" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pv-pink outline-none" />
                <ClayButton variant="primary" onClick={joinWithCode} loading={loading}>Join</ClayButton>
              </div>
            </div>
            <div className="glass-panel">
              <h2 className="text-xl font-bold text-pv-plum mb-3">Create Community</h2>
              <input value={newCommunity.name} onChange={e => setNewCommunity({...newCommunity, name: e.target.value})} placeholder="Community Name" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-2 focus:ring-2 focus:ring-pv-pink outline-none" />
              <input value={newCommunity.desc} onChange={e => setNewCommunity({...newCommunity, desc: e.target.value})} placeholder="Description (optional)" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3 focus:ring-2 focus:ring-pv-pink outline-none" />
              <ClayButton variant="secondary" onClick={createCommunity} loading={loading} className="w-full">Create</ClayButton>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-pv-plum mb-4">My Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myCommunities.map(c => (
              <motion.div key={c.id} whileHover={{ scale: 1.02 }} className="clay-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pv-peach flex items-center justify-center text-xl">🏰</div>
                  <div><h3 className="font-bold text-pv-plum">{c.name}</h3><p className="text-xs text-gray-500">Code: {c.invite_code}</p></div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{c.description || 'No description.'}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Created by Member</span>
                  <ClayButton variant="ghost" size="sm">Open</ClayButton>
                </div>
              </motion.div>
            ))}
            {myCommunities.length === 0 && <div className="col-span-2 text-center py-8 text-gray-500">You haven't joined any communities yet.</div>}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}