/** 실험 라이브러리 — 허용 유형만(먼저 연락 멈추기 · 만남 제안 넘기기 · 답장 속도 평소대로 · 가벼운 질문 · 계기 메시지 · 작은 부탁). 랜딩 '이번 주 실험' 타일이 주 단위로 돌려 쓴다. */
export interface ExperimentSeed {
  key: string;
  title: string;
  days: number;
  how: string;
}

export const EXPERIMENT_LIBRARY: ExperimentSeed[] = [
  { key: 'pause', title: '먼저 연락 3일 멈추기', days: 3, how: '연락을 끊는 게 아니라 "먼저"만 멈춰. 상대 메시지엔 평소처럼 답해.' },
  { key: 'handoff', title: '만남 제안 넘기기', days: 7, how: '이번 주엔 네가 먼저 "언제 볼까"를 꺼내지 않아. 상대 쪽에서 날짜가 나오는지 봐.' },
  { key: 'pace', title: '답장 속도 평소대로', days: 5, how: '빨리 답하려고 기다리지 않아. 네 리듬대로 답하고, 상대 리듬이 따라오는지 봐.' },
  { key: 'question', title: '가벼운 질문 하나', days: 2, how: '상대가 꺼냈던 화제를 되묻는 질문 하나만 던져. 답의 길이와 되묻기가 신호야.' },
  { key: 'trigger', title: '계기 메시지 한 번', days: 3, how: '상대가 말했던 일정을 기억했다가 그날 한 줄만 보내. 반응의 온도를 봐.' },
  { key: 'favor', title: '작은 부탁 하나', days: 4, how: '5분이면 되는 부탁 하나를 해. 들어주는 속도와 태도가 신호야.' },
];

/** 이번 주 실험 — 연초 기준 주차로 로테이션 (운영 손이 안 가는 자동 타일) */
export function weeklyExperiment(date = new Date()): ExperimentSeed {
  const jan1 = Date.UTC(date.getFullYear(), 0, 1);
  const week = Math.floor((date.getTime() - jan1) / (7 * 86400000));
  return EXPERIMENT_LIBRARY[((week % EXPERIMENT_LIBRARY.length) + EXPERIMENT_LIBRARY.length) % EXPERIMENT_LIBRARY.length];
}
