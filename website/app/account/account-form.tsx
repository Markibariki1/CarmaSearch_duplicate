'use client';
import { useState, useEffect } from 'react';
import { createBrowserSupabase } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createBrowserSupabase();

export default function AccountForm({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, website')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setWebsite(data.website || '');
      }
      setLoading(false);
    }
    loadProfile();
  }, [user.id]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      username,
      website,
      updated_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) alert(error.message);
    else alert('Profile updated');
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-medium">Your account</h2>
      <form onSubmit={updateProfile} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm">Email</label>
          <input className="w-full border rounded px-3 py-2" value={user.email} disabled />
        </div>

        <div>
          <label className="block text-sm">Full name</label>
          <input className="w-full border rounded px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm">Username</label>
          <input className="w-full border rounded px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm">Website</label>
          <input className="w-full border rounded px-3 py-2" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>

          <form action="/auth/signout" method="post">
            <button className="px-4 py-2 border rounded" type="submit">Sign out</button>
          </form>
        </div>
      </form>
    </div>
  );
}
