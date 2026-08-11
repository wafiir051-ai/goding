import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, Users } from 'lucide-react';

export default function VisitorStats() {
  const [totalVisits, setTotalVisits] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const getSessionId = () => {
    let id = sessionStorage.getItem('visitor_session_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('visitor_session_id', id);
    }
    return id;
  };

  const updateTotalVisits = async () => {
    const alreadyCounted = sessionStorage.getItem('visit_counted');
    if (alreadyCounted) {
      const { data } = await supabase.from('site_stats').select('total_visits').eq('id', 1).single();
      setTotalVisits(data?.total_visits || 0);
      return;
    }

    const { data, error } = await supabase.rpc('increment_total_visits');
    if (!error && typeof data === 'number') {
      setTotalVisits(data);
      sessionStorage.setItem('visit_counted', '1');
    } else {
      const { data: fallback } = await supabase.from('site_stats').select('total_visits').eq('id', 1).single();
      setTotalVisits(fallback?.total_visits || 0);
    }
  };

  const updateActiveSession = async () => {
    const sessionId = getSessionId();
    await supabase.from('active_sessions').upsert({
      session_id: sessionId,
      last_active: new Date().toISOString(),
      user_agent: navigator.userAgent,
      page_url: window.location.pathname
    });
  };

  const fetchActiveUsers = async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', fiveMinutesAgo);
    if (!error) setActiveUsers(count || 0);
  };

  useEffect(() => {
    updateTotalVisits();
    updateActiveSession();
    fetchActiveUsers();

    const subscription = supabase
      .channel('active_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => {
        fetchActiveUsers();
      })
      .subscribe();

    const interval = setInterval(() => {
      updateActiveSession();
      fetchActiveUsers();
    }, 30000);

    setLoading(false);
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (loading) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs md:text-sm text-zinc-500 mt-4 pt-4 border-t border-white/10">
      <span className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
        {totalVisits.toLocaleString()} total kunjungan
      </span>
      <span className="hidden sm:inline">•</span>
      <span className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
        <span className="text-green-400">{activeUsers}</span> pengunjung aktif
      </span>
    </div>
  );
}
