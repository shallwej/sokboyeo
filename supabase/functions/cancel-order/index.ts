import { preflight, json, fail, requireUser, serviceClient, logEvent } from '../_shared/http.ts';
import { cancelPayment } from '../_shared/toss.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const user = await requireUser(req);
  if (!user) return fail('로그인이 필요해', 401);
  const { reportId } = await req.json().catch(() => ({}));
  if (typeof reportId !== 'string') return fail('잘못된 요청');

  const db = serviceClient();
  const { data: report } = await db.from('reports').select('id,status,payment_key,user_id,viewed_at').eq('id', reportId).maybeSingle();
  if (!report || report.user_id !== user.id) return fail('리포트를 찾을 수 없어', 404);
  const within24h = (report.status === 'viewed' || report.status === 'published') && report.viewed_at && Date.now() - new Date(report.viewed_at).getTime() < 24 * 3600 * 1000;
  const beforeView = ['paid', 'generating', 'review', 'published'].includes(report.status);
  if (!beforeView && !within24h) return fail('환불 가능 기간(발행 후 24시간)이 지났어', 409);
  const reason = within24h ? '근거 부족 환불(발행 후 24시간 내)' : '열람 전 취소';
  if (!report.payment_key) return fail('결제 정보가 없어', 409);

  try {
    await cancelPayment(report.payment_key, reason);
  } catch (e) {
    await logEvent(db, report.id, 'refund_fail', { message: (e as Error).message });
    return fail(`취소 실패: ${(e as Error).message}`, 502);
  }
  await db.from('reports').update({ status: 'refunded' }).eq('id', report.id);
  await logEvent(db, report.id, 'order_cancelled', { reason });
  return json({ status: 'refunded' });
});
