import { preflight, json, fail, requireUser, serviceClient, logEvent, triggerGenerate } from '../_shared/http.ts';
import { confirmPayment } from '../_shared/toss.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const user = await requireUser(req);
  if (!user) return fail('로그인이 필요해', 401);

  const { paymentKey, orderId, amount } = await req.json().catch(() => ({}));
  if (typeof paymentKey !== 'string' || typeof orderId !== 'string' || typeof amount !== 'number') return fail('잘못된 요청');

  const db = serviceClient();
  const { data: report } = await db.from('reports').select('id,status,amount,user_id').eq('order_id', orderId).maybeSingle();
  if (!report || report.user_id !== user.id) return fail('주문을 찾을 수 없어', 404);
  if (['paid', 'generating', 'review', 'published', 'viewed'].includes(report.status)) return json({ status: report.status, reportId: report.id }); // 멱등
  if (report.status !== 'draft') return fail('결제할 수 없는 상태야', 409);
  if (report.amount !== amount) return fail('금액이 일치하지 않아', 400);

  try {
    await confirmPayment(paymentKey, orderId, amount);
  } catch (e) {
    await logEvent(db, report.id, 'payment_fail', { message: (e as Error).message });
    return fail(`결제 승인 실패: ${(e as Error).message}`, 402);
  }

  await db.from('reports').update({ status: 'paid', payment_key: paymentKey, paid_at: new Date().toISOString() }).eq('id', report.id);
  await logEvent(db, report.id, 'payment_success', { amount });
  await triggerGenerate(report.id);
  return json({ status: 'paid', reportId: report.id });
});
