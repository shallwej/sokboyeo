export type SkuId = 'basic' | 'deep' | 'tarot' | 'question';

export interface Sku {
  id: SkuId;
  name: string;
  price: number;
  /** 정가 — 실제 향후 판매가일 때만 표기 (표시광고법) */
  list?: number;
  blurb: string;
  includes: string[];
  /** 미구현 상품은 '곧 열려요'로만 노출 */
  available: boolean;
}

/** 가격 확정 (2026-09-14): 1차 9,900 · 심층 19,800(질문권 2회 포함) · 타로 1,900 · 질문권 3,900 */
export const SKUS: Record<SkuId, Sku> = {
  basic: {
    id: 'basic',
    name: '[단독] 리포트',
    price: 9900,
    list: 12900,
    blurb: '판정 · 실험 · 지금 할 행동까지, 이 사람에 대한 단독 취재',
    includes: [
      '관계 단계 판정 + 다음 단계로 넘어가는 조건',
      '상대의 타고난 결 — 관심 있을 때·없을 때 움직임, 통하는 접근',
      '두 사람 원국 대조 전부 — 합·충·기운 보완',
      '신호 분석표 — 제보 5항목 각각의 읽기, 질문별 핵심 증거 표시',
      '확인된 팩트 3 · 가능한 해석 2 — 각각의 근거와 가능성',
      '이번 주 실험 1 — 결과 입력하면 [속보]/[정정]으로 판정 갱신',
      '지금 할 행동 · 하지 말 것 · 보내도 되는 문장 / 안 되는 문장',
      '영구 소장 · 발행 후 24시간 환불 보장',
    ],
    available: true,
  },
  deep: {
    id: 'deep',
    name: '심층 취재',
    price: 19800,
    blurb: '카톡을 올리면 관심도를 측정하고, 실험과 보낼 문장을 설계해',
    includes: ['관심도 측정 — 답장 텀·시작 비율·시간대·길이·질문 비율', '측정값으로 판정 갱신', '측정 기반 다음 실험 설계', '지금 보낼 문장 2안', '질문권 2회 포함'],
    available: false,
  },
  tarot: { id: 'tarot', name: '걔 마음 한 장', price: 1900, blurb: '리포트 문맥 위에서 카드 1장 + 오늘 할 행동', includes: [], available: false },
  question: { id: 'question', name: '편집국에 질문', price: 3900, blurb: '리포트를 읽은 편집국에 1문 1답', includes: [], available: false },
};

export const PROMO = { label: '창간가', until: '2026.10.31' };
export const REFUND_POLICY = '근거가 없으면 발행 후 24시간 안에 환불';
export const DELIVERY_POLICY = '결제 즉시 취재 시작 — 보통 1분 안에 발행';

export function priceOf(sku: SkuId): number {
  return SKUS[sku].price;
}

/** 토스페이먼츠 클라이언트 키가 설정되면 실제 결제 플로우, 없으면 샘플 리포트로 walkthrough */
export function isPaymentConfigured(): boolean {
  return Boolean(import.meta.env.VITE_TOSS_CLIENT_KEY);
}

export function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
