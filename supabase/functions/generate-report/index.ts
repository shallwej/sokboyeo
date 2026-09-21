// [단독] 리포트 생성 — "계산은 코드로, 해석만 AI로".
// 팩트(원국·궁합·셀프리포트)는 DB에 저장된 결정론 계산 결과를 그대로 쓰고, Claude는 그 팩트 위에서만 기사체 JSON을 쓴다.
import Anthropic from 'npm:@anthropic-ai/sdk';
import { z } from 'npm:zod';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod';
import { preflight, json, fail, requireUser, serviceClient, isServiceCall, isAdmin, logEvent } from '../_shared/http.ts';
import { ARCHETYPES } from '../_shared/saju/archetypes.ts';
import { QUESTIONS } from '../_shared/report/questions.ts';
import { SAMPLE_REPORT } from '../_shared/report/schema.ts';
import { THEIR_PROFILE, APPROACH, QUESTION_FOCUS, STAGE_ROADMAP, signalRows } from '../_shared/report/enrich.ts';

const MODEL = 'claude-opus-5';

const ReportSchema = z.object({
  headline: z.string(),
  lede: z.string(),
  stage: z.object({ current: z.enum(['관심', '만남', '관계', '결단', '정리']), note: z.string() }),
  facts: z.array(z.object({ title: z.string(), detail: z.string(), source: z.enum(['selfreport', 'saju']) })),
  interpretations: z.array(z.object({ title: z.string(), detail: z.string(), likelihood: z.enum(['높음', '중간', '낮음']) })),
  experiment: z.object({ title: z.string(), how: z.string(), days: z.number(), ifA: z.string(), ifB: z.string() }),
  action: z.object({ do: z.string(), dont: z.string(), timing: z.string() }),
  messages: z.object({ ok: z.string(), not: z.string(), why: z.string() }),
  correctionPolicy: z.string(),
});
type Report = z.infer<typeof ReportSchema>;

const SYSTEM = `너는 「속보여」 편집국의 연애 전담 기자다. 독자(제보자)가 한 사람(상대)에 대해 제보한 신호와, 두 사람의 사주 원국을 겹쳐 계산한 팩트를 받아 [단독] 관계 리포트를 기사체 JSON으로 쓴다.

원칙
1. 팩트 밖의 사건을 만들지 않는다. 입력에 없는 대화·행동·사건을 언급하면 실패다. 팩트 항목의 detail은 입력된 팩트를 풀어 쓰는 것이지 새 사실이 아니다.
2. 단정하지 않는다. "확실히", "틀림없이", "좋아한다/안 좋아한다"의 단정, 그리고 "확률 83%" 같은 숫자 확률은 금지. 대신 신호·가능성·확인 방법으로 말한다.
3. 상대를 비하하거나 감시·추궁을 부추기지 않는다. 행동 제안은 독자 자신의 행동만 다룬다.
4. 화법: 반말 기사체. 리드 → 팩트 → 해석 → 확인 취재 → 전망. 사주 용어는 쓰되 바로 일상어로 번역한다("임수(壬)는 바다처럼…"). 위로로 흐리지 말고 기준을 준다.
5. 상대는 항상 "상대"라고만 부른다(실명·닉네임 금지). 독자는 "너".
6. facts는 정확히 3개(제보 팩트 2 + 원국 팩트 1)이고 source를 정확히 표시한다. interpretations는 정확히 2개이고 서로 다른 가능성이어야 하며 likelihood는 팩트에 근거해 다르게 매긴다. experiment는 정확히 1개: 독자가 2~7일(days) 동안 자기 행동 하나만 바꾸는 안전한 실험이며, ifA는 상대의 반응이 오면 어느 해석이 확인되는지, ifB는 안 오면 어느 해석으로 이동하는지를 적는다. 허용되는 실험 유형은 '먼저 연락 멈추기', '만남 제안을 상대에게 넘기기', '답장 속도를 평소대로 두기', '가벼운 질문 하나 던지기'뿐이며 거짓말·질투 유발·잠수·상대를 시험하는 말·제3자 동원은 금지다. action.do는 실험 이후의 행동 하나, action.dont는 하지 말 것 하나, timing은 실험 기간과 확인 기한.
7. 보호 모드: 입력의 protectiveMode가 true면(식음 질문 + 낮은 신호) 존댓말로 쓰고, 행동 제안은 거리 두기·정리·자기 회복 계열만 제안하며 재접근을 부추기지 않는다.
8. stage.current는 입력의 stageEstimate를 기본으로 하되 팩트가 명백히 다르면 조정하고 note에 이유를 쓴다.
9. correctionPolicy에는 확인 취재 결과가 다르면 [정정]으로 바로잡는다는 편집국 원칙을 한두 문장으로 쓴다.
10. messages.ok는 독자가 지금 실제로 보낼 수 있는 문장 하나를 따옴표로 감싸고 짧은 이유를 붙인다. messages.not은 지금 보내면 안 되는 문장 하나를 따옴표로 감싸고 이유를 붙인다. messages.why는 왜 지금 그 구분인지 한두 문장. ok 문장은 experiment와 충돌하면 안 된다(예: '먼저 연락 멈추기' 실험이면 ok는 상대 메시지에 답할 때 쓰는 문장이거나 실험이 끝난 뒤 보내는 문장). 감정 고백·추궁·시험하는 말은 not에만 둔다.
11. 입력의 deterministic(상대의 결·판독 기준·신호 읽기·단계 로드맵)은 리포트에 별도 섹션으로 그대로 실린다. 본문에서 그 문장을 반복하지 말고 그 위에서 판정·해석·실험을 쓰되, 그 읽기와 모순되면 안 된다.

아래는 톤과 구조의 예시다. 내용을 베끼지 말고 형식과 온도만 참고한다.
${JSON.stringify(SAMPLE_REPORT)}`;

interface Facts {
  question: { key: string; label: string };
  myArchetype: { name: string; tagline: string; lede: string; criterion: string };
  theirArchetype: { name: string; tagline: string; lede: string; criterion: string };
  compat: { index: number; relation: string; facts: { title: string; detail: string }[] };
  selfReport: { facts: string[]; signalIndex: number; flags: string[] };
  stageEstimate: { current: string; note: string };
  protectiveMode: boolean;
  /** 리포트에 별도로 실리는 결정론 섹션 — LLM은 이와 모순되지 않게 쓴다 */
  deterministic: {
    theirProfile: { whenInterested: string; whenNot: string; approach: string };
    questionRule: string;
    signalReadings: { question: string; answer: string; reading: string; keyEvidence: boolean }[];
    stageRoadmap: { desc: string; next: string; condition: string };
  };
}

function validate(r: Report): string[] {
  const p: string[] = [];
  if (r.facts.length !== 3) p.push('facts는 정확히 3개여야 한다');
  if (r.interpretations.length !== 2) p.push('interpretations는 정확히 2개여야 한다');
  if (!(r.experiment.days >= 2 && r.experiment.days <= 7)) p.push('experiment.days는 2~7이어야 한다');
  if (/질투|거짓말|잠수|시험해|떠보는 말|친구를 시켜/.test(JSON.stringify(r.experiment))) p.push('금지된 실험 유형이다');
  const text = JSON.stringify(r);
  if (/\d+\s*%/.test(text)) p.push('숫자 확률(%) 표현을 쓰지 않는다');
  if (/확실히|틀림없|100\s*%/.test(text)) p.push('단정 표현을 쓰지 않는다');
  if (!r.messages.ok.trim() || !r.messages.not.trim() || !r.messages.why.trim()) p.push('messages의 ok·not·why를 모두 채운다');
  if (!/["“”']/.test(r.messages.ok) || !/["“”']/.test(r.messages.not)) p.push('messages.ok와 messages.not에는 실제 문장을 따옴표로 넣는다');
  return p;
}

async function generate(client: Anthropic, facts: Facts, fixNotes: string[] = []): Promise<{ report: Report; usage: unknown }> {
  const userText = `입력 팩트(JSON):\n${JSON.stringify(facts)}` + (fixNotes.length ? `\n\n이전 출력의 문제를 고쳐서 다시 써라: ${fixNotes.join('; ')}` : '');
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userText }],
    output_config: { format: zodOutputFormat(ReportSchema) },
  });
  if (res.stop_reason === 'refusal') throw new Error(`refusal: ${res.stop_details?.category ?? 'unknown'}`);
  if (!res.parsed_output) throw new Error('구조화 출력 파싱 실패');
  return { report: res.parsed_output, usage: res.usage };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (!isServiceCall(req)) {
    const user = await requireUser(req);
    if (!user || !isAdmin(user.email)) return fail('권한이 없어', 403);
  }
  const { reportId } = await req.json().catch(() => ({}));
  if (typeof reportId !== 'string') return fail('reportId가 필요해');

  const db = serviceClient();
  const { data: r } = await db.from('reports').select('*').eq('id', reportId).maybeSingle();
  if (!r) return fail('리포트를 찾을 수 없어', 404);
  if (!['paid', 'failed', 'generating'].includes(r.status)) return fail(`생성할 수 없는 상태: ${r.status}`, 409);
  await db.from('reports').update({ status: 'generating' }).eq('id', r.id);

  const q = QUESTIONS.find((x) => x.key === r.question_key)!;
  const mine = ARCHETYPES[r.my_chart.dayGan as keyof typeof ARCHETYPES];
  const theirs = ARCHETYPES[r.subject_chart.dayGan as keyof typeof ARCHETYPES];
  const facts: Facts = {
    question: { key: q.key, label: q.label },
    myArchetype: { name: mine.name, tagline: mine.tagline, lede: mine.lede, criterion: mine.criterion },
    theirArchetype: { name: theirs.name, tagline: theirs.tagline, lede: theirs.lede, criterion: theirs.criterion },
    compat: { index: r.compat.index, relation: r.compat.relation, facts: r.compat.facts.map((f: { title: string; detail: string }) => ({ title: f.title, detail: f.detail })) },
    selfReport: { facts: r.self_report.facts, signalIndex: r.self_report.signalIndex, flags: r.self_report.flags },
    stageEstimate: r.self_report.stage ?? { current: '만남', note: '' },
    protectiveMode: q.key === 'cooling' && r.self_report.signalIndex < 30,
    deterministic: {
      theirProfile: { whenInterested: THEIR_PROFILE[theirs.gan].on, whenNot: THEIR_PROFILE[theirs.gan].off, approach: APPROACH[theirs.gan] },
      questionRule: QUESTION_FOCUS[q.key].rule,
      signalReadings: signalRows(r.self_report.answers ?? {}, q.key).map((row) => ({ question: row.label, answer: row.answer, reading: row.reading, keyEvidence: row.focus })),
      stageRoadmap: STAGE_ROADMAP[(r.self_report.stage?.current ?? '만남') as keyof typeof STAGE_ROADMAP],
    },
  };

  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  try {
    let { report, usage } = await generate(client, facts);
    let problems = validate(report);
    if (problems.length) {
      await logEvent(db, r.id, 'generate_retry', { problems });
      ({ report, usage } = await generate(client, facts, problems));
      problems = validate(report);
      if (problems.length) throw new Error(`검증 실패: ${problems.join('; ')}`);
    }
    const autoPublish = Deno.env.get('AUTO_PUBLISH') !== 'false'; // 기본 즉시 발행(직접전환), 표본 검수는 사후
    const content: Record<string, unknown> = { ...report };
    await db.from('reports').update({
      content,
      status: autoPublish ? 'published' : 'review',
      published_at: autoPublish ? new Date().toISOString() : null,
    }).eq('id', r.id);
    await logEvent(db, r.id, 'generated', { model: MODEL, usage, autoPublish });
    return json({ status: autoPublish ? 'published' : 'review' });
  } catch (e) {
    await db.from('reports').update({ status: 'failed' }).eq('id', r.id);
    await logEvent(db, r.id, 'generate_fail', { message: (e as Error).message });
    return fail(`생성 실패: ${(e as Error).message}`, 500);
  }
});
