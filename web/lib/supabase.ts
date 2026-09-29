// lib/supabase.ts - Supabase client & Realtime broadcast helper
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export const SIM_CHANNEL_NAME = process.env.NEXT_PUBLIC_SIM_CHANNEL || "vajranet-sim";

export interface SimBroadcastPayload {
  type: "sim_start" | "sim_stop" | "test_alert";
  scenario_id: string;
  t0_epoch_ms: number;
}
