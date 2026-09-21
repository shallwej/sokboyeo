import type { Stage } from './selfreport';

export interface Experiment {
  title: string;
  how: string;
  days: number; // 2~7
  ifA: string; // 이 반응이 오면 → 어느 해석이 확인되는지
  ifB: string; // 안 오면 → 어느 해석으로 이동하는지
}

export interface TimingDay {
  date: string;
  label: string;
  reason: string;
  score: number;
}

export type ExperimentResult = 'A' | 'B' | 'C'; // A 반응 옴 · B 안 옴 · C 애매

export interface ReportContent {
  headline: string;
  lede: string;
  stage: { current: Stage; note: string };
  facts: { title: string; detail: string; source: 'selfreport' | 'saju' }[];
  interpretations: { title: string; detail: string; likelihood: '높음' | '중간' | '낮음' }[];
  experiment: Experiment;
  action: { do: string; dont: string; timing: string };
  /** 보내도 되는 문장 / 보내면 안 되는 문장 / 이유 — 2026-09-21 추가. 이전 발행분엔 없을 수 있다 */
  messages?: { ok: string; not: string; why: string };
  correctionPolicy: string;
}

/** 샘플 리포트 — 결제 연동 전 walkthrough용이자 LLM 프롬프트 예시. 壬(늦게 터지는 특종형) × 己, 질문 '나한테 관심 있는 걸까?' */
export const SAMPLE_REPORT: ReportContent = {
  headline: '관심은 있다. 다만 상대는 "확인된 뒤에 움직이는" 쪽이다',
  lede: '네 제보와 두 사람의 원국을 겹쳐 본 결과, 상대의 신호는 약하지 않아. 느린 게 아니라 조심스러운 유형이라는 게 이번 취재의 핵심이야.',
  stage: { current: '관계', note: '상대 쪽에서도 만남이 나오는 구간. 호감 탐색은 지났고, 다음 2주가 이름을 붙일지 정해.' },
  facts: [
    { title: '먼저 연락은 나 쪽으로 6:4, 그런데 답장은 1시간 안', detail: '시작은 네가 더 하지만 상대의 반응 속도는 빠른 편이야. 관심이 없으면 답장 텀이 먼저 늘어나는데, 그 신호는 없어.', source: 'selfreport' },
    { title: '최근 2주 안에 상대 제안으로 단둘이 만남', detail: '상대 쪽에서 만남을 만든 건 이 취재에서 가장 무거운 팩트야. 말보다 행동이 먼저 나온 장면.', source: 'selfreport' },
    { title: '일간 관계 · 나를 긴장시키는 기운(관성)', detail: '내 임수(壬)에게 상대의 기토(己)는 관성의 흐름. 끌림은 강한데 내가 눈치를 보게 되는 구조라, 네가 신호를 "작게" 읽고 있을 가능성이 있어.', source: 'saju' },
  ],
  interpretations: [
    { title: '관심은 있는데 확신이 생길 때까지 표현을 아끼는 중', detail: '상대 제안 만남 + 빠른 답장 + 먼저 연락은 적음 — 이 조합은 "마음은 있지만 확인 전엔 안 움직이는" 사람의 전형이야. 네가 늦게 터지는 특종형인 것처럼, 상대도 판이 깔려야 움직이는 쪽.', likelihood: '높음' },
    { title: '편한 친구 관계로 두고 있는 중', detail: '만남이 상대 제안이었어도 목적이 "편함"일 수 있어. 다만 그 경우 단둘이 보자는 제안은 드물어서, 이 해석의 가능성은 낮은 편.', likelihood: '낮음' },
  ],
  experiment: {
    title: '먼저 연락을 3일만 멈춰봐',
    how: '연락을 끊는 게 아니라 "먼저"만 멈추는 거야. 상대 메시지엔 평소처럼 답해. 3일 안에 상대가 먼저 오는지만 봐.',
    days: 3,
    ifA: '상대가 먼저 연락 오면 → 해석 1이 확인된 것. [속보]로 이어져.',
    ifB: '3일 넘게 조용하면 → 해석 2 쪽으로 이동. [정정]으로 판정을 고쳐.',
  },
  action: {
    do: '실험이 끝난 뒤, "다음엔 언제 볼까?"를 질문형으로 한 번만 던져.',
    dont: '답장이 빨랐다는 이유로 긴 감정 메시지를 먼저 보내지 마. 관성 구조에선 상대가 부담을 먼저 느껴.',
    timing: '실험 3일 + 확인 1주. 결과가 나오면 이 리포트는 [속보] 또는 [정정]으로 이어져.',
  },
  messages: {
    ok: '"저번에 말한 그 전시, 결국 갔어?" — 상대가 꺼냈던 화제를 되묻는 한 줄. 관심은 보이되 무게는 없어.',
    not: '"요즘 나한테 좀 무심한 것 같아." — 감정을 먼저 꺼내면 관성 구조에선 상대가 방어부터 해.',
    why: '지금은 상대가 자기 속도로 움직이는지 확인하는 구간이라, 네 쪽에서 감정의 크기를 먼저 보이면 실험 결과가 오염돼.',
  },
  correctionPolicy: '이 리포트는 네가 제보한 신호와 두 사람의 원국을 근거로 쓴 기사야. 실험 결과가 다르면 [정정]으로 바로잡아 — 틀린 걸 틀렸다고 쓰는 게 이 편집국의 원칙이야.',
};

/** 실험 결과 → 갱신 카드 (결정론 — LLM 호출 없음) */
export function experimentUpdate(exp: Experiment, result: ExperimentResult): { tag: string; text: string } {
  if (result === 'A') return { tag: '속보', text: exp.ifA };
  if (result === 'B') return { tag: '정정', text: exp.ifB };
  return { tag: '확인 중', text: '애매하면 3일만 더 보고 다시 입력해. 단서 하나로 기사 쓰지 않는 게 원칙이야.' };
}
