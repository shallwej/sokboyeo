import { computeChart, type BirthInput } from './saju/manse.ts';
import { computeCompat } from './saju/compat.ts';
import { ARCHETYPES } from './saju/archetypes.ts';
import { scoreSelfReport, estimateStage, type SelfAnswers, SELF_QUESTIONS } from './report/selfreport.ts';
import { QUESTIONS, type QuestionKey } from './report/questions.ts';

export interface OrderInput {
  nickname: string;
  myBirth: BirthInput;
  subjectBirth: BirthInput;
  questionKey: QuestionKey;
  selfAnswers: SelfAnswers;
}

function isBirth(x: unknown): x is BirthInput {
  if (!x || typeof x !== 'object') return false;
  const b = x as Record<string, unknown>;
  const int = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
  return int(b.year, 1900, 2030) && int(b.month, 1, 12) && int(b.day, 1, 31)
    && (b.hour === null || b.hour === undefined || int(b.hour, 0, 23))
    && (b.calendar === 'solar' || b.calendar === 'lunar');
}

/** 클라이언트 입력을 신뢰하지 않는다 — 형태·범위·키를 전부 검사하고 서버에서 다시 계산한다. */
export function validateOrderInput(x: unknown): OrderInput {
  if (!x || typeof x !== 'object') throw new Error('잘못된 요청');
  const b = x as Record<string, unknown>;
  if (!isBirth(b.myBirth) || !isBirth(b.subjectBirth)) throw new Error('생년월일 형식이 잘못됐어');
  const q = QUESTIONS.find((it) => it.key === b.questionKey);
  if (!q) throw new Error('질문이 잘못됐어');
  const answers = (b.selfAnswers ?? {}) as Record<string, unknown>;
  const clean: SelfAnswers = {};
  for (const sq of SELF_QUESTIONS) {
    const v = answers[sq.key];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= sq.options.length) throw new Error('셀프리포트 답변이 비어 있어');
    clean[sq.key] = v;
  }
  const nickname = typeof b.nickname === 'string' ? b.nickname.trim().slice(0, 12) : '';
  return {
    nickname: nickname || '걔',
    myBirth: { ...(b.myBirth as BirthInput), minute: Number((b.myBirth as BirthInput).minute) || 0 },
    subjectBirth: { ...(b.subjectBirth as BirthInput), minute: Number((b.subjectBirth as BirthInput).minute) || 0 },
    questionKey: q.key,
    selfAnswers: clean,
  };
}

export function buildFacts(input: OrderInput) {
  const myChart = computeChart(input.myBirth);
  const theirChart = computeChart(input.subjectBirth);
  const compat = computeCompat(myChart, theirChart);
  const selfReport = scoreSelfReport(input.selfAnswers);
  const stage = estimateStage(selfReport, input.questionKey);
  return {
    myChart,
    theirChart,
    compat,
    selfReport,
    stage,
    myArchetype: ARCHETYPES[myChart.dayGan],
    theirArchetype: ARCHETYPES[theirChart.dayGan],
    question: QUESTIONS.find((q) => q.key === input.questionKey)!,
  };
}
