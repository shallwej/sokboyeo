export type QuestionKey = 'interest' | 'contact' | 'status' | 'cooling' | 'confess';

export interface Question {
  key: QuestionKey;
  label: string;
  sub: string;
}

/** 질문 조준 — 리포트는 이 질문에 정면으로 답하도록 생성된다 (EX-Ray 차용) */
export const QUESTIONS: Question[] = [
  { key: 'interest', label: '나한테 관심 있는 걸까?', sub: '신호가 애매해서 헷갈릴 때' },
  { key: 'contact', label: '지금 연락해도 될까?', sub: '먼저 보내기 전에 타이밍부터' },
  { key: 'status', label: '우리, 무슨 사이야?', sub: '썸인지 친구인지 이름을 못 붙일 때' },
  { key: 'cooling', label: '왜 갑자기 식은 것 같지?', sub: '답장·만남이 줄어든 게 느껴질 때' },
  { key: 'confess', label: '고백해도 될까?', sub: '말 꺼내기 전 마지막 확인' },
];
