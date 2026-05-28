import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://igmumzfkemgcdbhbbusb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbXVtemZrZW1nY2RiaGJidXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDI4NTIsImV4cCI6MjA5NTQ3ODg1Mn0.eor8jOw_1wtS3EEhWa-jdU72Fh_wKA9MqOK1uUF2YB8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function dbLoad(table) {
  try {
    const { data, error } = await supabase.from(table).select("data").eq("id", table).maybeSingle();
    if (error || !data) return null;
    return data.data ?? null;
  } catch (e) { return null; }
}

export async function dbSave(table, payload) {
  try {
    const { error } = await supabase.from(table).upsert({ id: table, data: payload }, { onConflict: "id" });
    return !error;
  } catch (e) { return false; }
}
