import { preflight, json, fail, requireUser, serviceClient, logEvent } from '../_shared/http.ts';
import { validateOrderInput, buildFacts } from '../_shared/facts.ts';

// 가격 확정(2026-09-12). 금액은 서버가 확정한다 — 클라이언트 src/payment.ts와 같은 표
// 가격 확정(2026-09-14): 1차 9,900 · 심층 19,800 · 타로 1,900 · 질문권 3,900 — 이 함수는 1차 리포트 주문만 만든다
const PRICES: Record<'basic' | 'deep' | 'tarot' | 'question', number> = { basic: 9900, deep: 19800, tarot: 1900, question: 3900 };

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const user = await requireUser(req);
  if (!user) return fail('로그인이 필요해', 401);

  const raw = await req.json().catch(() => ({}));
  let input;
  try { input = validateOrderInput(raw); } catch (e) { return fail((e as Error).message); }
  const sku = 'basic' as const; // 심층·소액은 별도 주문 함수로 (미구현)
  const amount = PRICES[sku];
  let facts;
  try { facts = buildFacts(input); } catch { return fail('생년월일을 다시 확인해줘'); }

  const db = serviceClient();
  const sb = input.subjectBirth;
  const { data: subject, error: sErr } = await db.from('subjects').insert({
    user_id: user.id,
    nickname: input.nickname,
    birth_year: sb.year, birth_month: sb.month, birth_day: sb.day,
    birth_hour: sb.hour ?? null, calendar: sb.calendar, leap_month: Boolean(sb.leapMonth),
  }).select('id').single();
  if (sErr || !subject) return fail('상대 저장 실패', 500);

  const orderId = `sb_${crypto.randomUUID().replaceAll('-', '')}`;
  const { data: report, error: rErr } = await db.from('reports').insert({
    user_id: user.id,
    subject_id: subject.id,
    question_key: input.questionKey,
    self_report: { answers: input.selfAnswers, facts: facts.selfReport.facts, signalIndex: facts.selfReport.signalIndex, flags: facts.selfReport.flags, stage: facts.stage },
    my_chart: facts.myChart,
    subject_chart: facts.theirChart,
    compat: facts.compat,
    status: 'draft',
    order_id: orderId,
    amount,
    sku,
  }).select('id').single();
  if (rErr || !report) return fail('주문 생성 실패', 500);

  await logEvent(db, report.id, 'order_created', { question: input.questionKey, sku, amount, signal: facts.selfReport.signalIndex, compat: facts.compat.index });
  return json({ reportId: report.id, orderId, amount });
});
