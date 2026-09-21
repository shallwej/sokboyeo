import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 환경변수가 없으면 null — 앱은 샘플 리포트 walkthrough 모드로 동작한다. */
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;

export function isBackendConfigured(): boolean {
  return supabase !== null;
}
