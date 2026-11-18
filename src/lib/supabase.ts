import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or user localStorage configuration
export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const customUrl = localStorage.getItem('supabase_custom_url');
  const customKey = localStorage.getItem('supabase_custom_key');

  const url = customUrl || envUrl || '';
  const key = customKey || envKey || '';

  return { url, key, isConfigured: Boolean(url && key && url.startsWith('http')) };
};

let cachedClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
};

// Reset client cache if credentials update in Settings
export const resetSupabaseClient = () => {
  cachedClient = null;
};
