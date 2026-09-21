import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function preflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: CORS }) : null;
}

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

/** Authorization 헤더의 사용자 JWT를 검증한다. */
export async function requireUser(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** 내부 호출(confirm-payment → generate-report)은 service role 키로 인증한다. */
export function isServiceCall(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? '';
  return auth === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;
}

export function isAdmin(email?: string | null): boolean {
  const list = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return Boolean(email) && list.includes(String(email).toLowerCase());
}

export async function logEvent(db: SupabaseClient, reportId: string, event: string, meta?: unknown) {
  await db.from('report_events').insert({ report_id: reportId, event, meta: meta ?? null });
}

export async function triggerGenerate(reportId: string): Promise<void> {
  const run = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({ reportId }),
  }).catch(() => undefined);
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(run); else await run;
}
