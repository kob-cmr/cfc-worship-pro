import { createClient } from '@supabase/supabase-js';

// ── Put your Supabase credentials directly here ───────────────────────────────
// Get these from your Supabase project: Settings → API
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://igmumzfkemgcdbhbbusb.supabase.co";
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_WYLbrexWy6jW-usKkIMF7A_jRv6JpKN";

const isConfigured = SUPABASE_URL !== "https://igmumzfkemgcdbhbbusb.supabase.co" && SUPABASE_KEY !== "sb_publishable_WYLbrexWy6jW-usKkIMF7A_jRv6JpKN";

export const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ── Load data from Supabase ───────────────────────────────────────────────────
export async function dbLoad(table) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(table)
      .select("data")
      .eq("id", table)
      .maybeSingle();
    if (error || !data) return null;
    return data.data ?? null;
  } catch (e) {
    console.error("dbLoad error:", e);
    return null;
  }
}

// ── Save data to Supabase ─────────────────────────────────────────────────────
export async function dbSave(table, payload) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(table)
      .upsert({ id: table, data: payload }, { onConflict: "id" });
    if (error) {
      console.error("dbSave error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("dbSave exception:", e);
    return false;
  }
}
