// ── Supabase client ───────────────────────────────────────────────────────────
// Replace VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with your project values
// after following the setup steps in README.
import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = URL && KEY ? createClient(URL, KEY) : null;

// ── Generic helpers ───────────────────────────────────────────────────────────
// Each table stores one JSON blob per key (key = "songs" | "programs" | "events")
// Row shape: { id: key, data: JSON }

export async function dbLoad(table) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(table).select("data").eq("id", table).single();
    if (error) return null;
    return data?.data ?? null;
  } catch { return null; }
}

export async function dbSave(table, payload) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(table).upsert({ id: table, data: payload }, { onConflict: "id" });
    return !error;
  } catch { return false; }
}
