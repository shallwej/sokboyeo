import { preflight, json, fail, requireUser, serviceClient, logEvent } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const user = await requireUser(req);
  if (!user) return fail('로그인이 필요해', 401);
  const { reportId } = await req.json().catch(() => ({}));
  if (typeof reportId !== 'string') return fail('잘못된 요청');

  const db = serviceClient();
  const { data: r } = await db.from('reports')
    .select('id,status,question_key,content,feedback,sku,experiment_result,created_at,paid_at,published_at,viewed_at,user_id,my_chart,subject_chart,compat,self_report,subjects(nickname)')
    .eq('id', reportId).maybeSingle();
  if (!r || r.user_id !== user.id) return fail('리포트를 찾을 수 없어', 404);

  let status = r.status as string;
  if (status === 'published') {
    await db.from('reports').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', r.id);
    await logEvent(db, r.id, 'report_viewed', null);
    status = 'viewed';
  }
  const visible = status === 'viewed';
  // deno-lint-ignore no-explicit-any
  const nickname = (r as any).subjects?.nickname ?? '걔';
  return json({
    id: r.id, status, questionKey: r.question_key, nickname, feedback: r.feedback, sku: r.sku, experimentResult: r.experiment_result,
    createdAt: r.created_at, publishedAt: r.published_at,
    content: visible ? r.content : null,
    // 결정론 섹션(상대의 결·원국 대조·신호 분석표) 렌더용 — 본문과 같은 조건에서만 내려준다
    myChart: visible ? { dayGan: r.my_chart.dayGan } : null,
    subjectChart: visible ? { dayGan: r.subject_chart.dayGan } : null,
    compat: visible ? r.compat : null,
    selfReport: visible ? r.self_report : null,
  });
});
