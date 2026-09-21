import lunar from 'lunar-javascript';
const { Solar, Lunar } = lunar;

export type Element = '木' | '火' | '土' | '金' | '水';
export type Gan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  /** 0-23. null이면 시간을 모르는 것으로 보고 삼주로 계산 */
  hour: number | null;
  minute: number;
  calendar: 'solar' | 'lunar';
  leapMonth?: boolean;
}

export interface Pillar {
  gan: string;
  zhi: string;
}

export interface Chart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  time: Pillar | null;
  dayGan: Gan;
  elements: Record<Element, number>;
  total: number;
  solar: { year: number; month: number; day: number };
  hasTime: boolean;
}

export const GAN_ELEMENT: Record<string, Element> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

export const ZHI_ELEMENT: Record<string, Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export const GAN_KO: Record<string, string> = {
  甲: '갑목', 乙: '을목', 丙: '병화', 丁: '정화', 戊: '무토', 己: '기토', 庚: '경금', 辛: '신금', 壬: '임수', 癸: '계수',
};

export const ZHI_KO: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

export const ELEMENT_KO: Record<Element, string> = { 木: '목', 火: '화', 土: '토', 金: '금', 水: '수' };
export const ELEMENT_ORDER: Element[] = ['木', '火', '土', '金', '水'];

function splitPillar(s: string): Pillar {
  return { gan: s.charAt(0), zhi: s.charAt(1) };
}

/**
 * 생년월일(시)로 사주 원국을 계산한다. 계산은 전부 브라우저 안에서 끝난다.
 * 절기 기준 월주, 입춘 기준 연주는 lunar-javascript가 처리한다.
 * 시간을 모르면 정오로 두고 시주는 비운다(삼주). 야자시·조자시, 서머타임, 진태양시 보정은 v0에서 다루지 않는다.
 */
export function computeChart(input: BirthInput): Chart {
  let y = input.year;
  let m = input.month;
  let d = input.day;

  if (input.calendar === 'lunar') {
    const lunar = Lunar.fromYmd(y, input.leapMonth ? -m : m, d);
    const solar = lunar.getSolar();
    y = solar.getYear();
    m = solar.getMonth();
    d = solar.getDay();
  }

  const hasTime = input.hour !== null && input.hour !== undefined;
  const hour = hasTime ? (input.hour as number) : 12;
  const minute = hasTime ? input.minute : 0;

  const solar = Solar.fromYmdHms(y, m, d, hour, minute, 0);
  const ec = solar.getLunar().getEightChar();

  const year = splitPillar(ec.getYear());
  const month = splitPillar(ec.getMonth());
  const day = splitPillar(ec.getDay());
  const time = hasTime ? splitPillar(ec.getTime()) : null;

  const elements: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = [year, month, day, ...(time ? [time] : [])];
  for (const p of pillars) {
    elements[GAN_ELEMENT[p.gan]] += 1;
    elements[ZHI_ELEMENT[p.zhi]] += 1;
  }

  return {
    year,
    month,
    day,
    time,
    dayGan: day.gan as Gan,
    elements,
    total: pillars.length * 2,
    solar: { year: y, month: m, day: d },
    hasTime,
  };
}

export function pillarKo(p: Pillar): string {
  return `${GAN_KO[p.gan]?.charAt(0) ?? p.gan}${ZHI_KO[p.zhi] ?? p.zhi}`;
}

/** 특정 날짜의 일주(日柱) — 연락 타이밍 달력용 */
export function dayPillarOf(y: number, m: number, d: number): Pillar {
  const ec = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar();
  return splitPillar(ec.getDay());
}
