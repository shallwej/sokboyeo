import type { Variant } from './track';

export interface Brand {
  masthead: string;
  sub: string;
  domain: string;
  desk: string;
}

/** 이름 A/B — ?v=b 로 B안 노출. 락업 규칙: 제호는 부제 없이 노출하지 않는다. */
export const BRAND: Record<Variant, Brand> = {
  a: { masthead: '속보여', sub: '연애속마음 전문지', domain: 'sokboyeo.com', desk: '속보여 편집국' },
  b: { masthead: '연애속보', sub: '속마음 전문 취재', domain: 'sokboyeo.com', desk: '연애속보 편집국' },
};

/** 다음 호(SKU 1) 발행 알림 채널 — 카카오 채널 개설 후 교체 */
export const NOTIFY_URL = 'https://pf.kakao.com/';
