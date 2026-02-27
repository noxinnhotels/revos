import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';

// Tek Supabase client — window üzerinde sakla
export function getSupabase() {
  const url = (SUPABASE_URL && SUPABASE_URL.trim()) || localStorage.getItem('sb_url');
  const key = (SUPABASE_KEY && SUPABASE_KEY.trim()) || localStorage.getItem('sb_key');
  if (!url || !key) return null;
  if (!window._sbClient || window._sbUrl !== url || window._sbKey !== key) {
    window._sbClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    window._sbUrl = url;
    window._sbKey = key;
    if (SUPABASE_URL && SUPABASE_URL.trim()) {
      localStorage.setItem('sb_url', url);
      localStorage.setItem('sb_key', key);
    }
  }
  return window._sbClient;
}

export function resetSupabaseClient() {
  window._sbClient = null;
  window._sbUrl = null;
  window._sbKey = null;
}
