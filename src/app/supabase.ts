import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase = isSupabaseConfigured ? createClient(url, publishableKey) : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Cloud accounts are not configured. Set the Supabase URL and publishable key.");
  }
  return supabase;
}
