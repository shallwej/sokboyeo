import { preflight, json, fail, requireUser, serviceClient, isAdmin, logEvent, triggerGenerate } from '../_shared/http.ts';
import { cancelPayment } from '../_shared/toss.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const user = await requireUser(req);
  if (!user || !isAdmin(user.email)) return fail('권한이 없어', 403);
  const body = await req.json().catch(() => ({}));
  const db = serviceClient();

  if (body.action === 'list') {
    const { data } = await db.from('reports')
      .select('id,status,question_key,amount,content,review_note,self_report,compat,created_at,paid_at,published_at,subjects(nickname)')
      .in('status', ['paid', 'generating', 'review', 'failed', 'published', 'viewed'])
      .order('created_at', { ascending: false }).limit(100);
    return json({ reports: data ?? [] });
  }

  const reportId = body.reportId;
  if (typeof reportId !== 'string') return fail('reportId가 필요해');
  const { data: report } = await db.from('reports').select('id,status,payment_key,content').eq('id', reportId).maybeSingle();
  if (!report) return fail('리포트를 찾을 수 없어', 404);

  if (body.action === 'publish') {
    if (!['review', 'failed', 'generating', 'paid'].includes(report.status)) return fail('발행할 수 없는 상태야', 409);
    const content = body.content ?? report.content;
    if (!content) return fail('본문이 없어', 409);
    await db.from('reports').update({ status: 'published', content, review_note: body.reviewNote ?? null, published_at: new Date().toISOString() }).eq('id', report.id);
    await logEvent(db, report.id, 'published', { by: user.email, edited: Boolean(body.content) });
    return json({ status: 'published' });
  }
  if (body.action === 'regenerate') {
    await db.from('reports').update({ status: 'paid' }).eq('id', report.id);
    await triggerGenerate(report.id);
    return json({ status: 'generating' });
  }
  if (body.action === 'refund') {
    if (!report.payment_key) return fail('결제 정보가 없어', 409);
    await cancelPayment(report.payment_key, '운영자 환불');
    await db.from('reports').update({ status: 'refunded' }).eq('id', report.id);
    await logEvent(db, report.id, 'admin_refund', { by: user.email });
    return json({ status: 'refunded' });
  }
  return fail('알 수 없는 action');
});
