import { Chart, dayPillarOf, GAN_ELEMENT } from '../saju/manse';
import { GAN_HAP, GAN_CHUNG, ZHI_HAP, ZHI_CHUNG, SAMHAP, relationOf } from '../saju/compat';
import type { TimingDay } from './schema';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 앞으로 `horizon`일 중 연락하기 좋은 날 `pick`개. 일진(日辰)과 내 일간·일지의 합·충, 상대 일간과의 합으로 점수. 계산만 하고 단정하지 않는다. */
export function computeTiming(me: Chart, them: Chart | null, start = new Date(), horizon = 28, pick = 3): TimingDay[] {
  const days: TimingDay[] = [];
  for (let i = 1; i <= horizon; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const dd = d.getDate();
    const p = dayPillarOf(y, mo, dd);
    let score = 0;
    const reasons: string[] = [];
    if (GAN_HAP[me.dayGan] === p.gan) { score += 3; reasons.push('네 일간과 합이 드는 날 — 말이 잘 통해'); }
    else if (GAN_CHUNG[me.dayGan] === p.gan) { score -= 2; reasons.push('네 일간과 충'); }
    if (ZHI_HAP[me.day.zhi] === p.zhi) { score += 2; reasons.push('일지 육합 — 대화가 부드러운 날'); }
    else if (ZHI_CHUNG[me.day.zhi] === p.zhi) { score -= 3; reasons.push('일지 충 — 어긋나기 쉬운 날'); }
    else if (SAMHAP[me.day.zhi] === SAMHAP[p.zhi]) { score += 1; reasons.push('삼합 — 흐름이 같은 날'); }
    const rel = relationOf(GAN_ELEMENT[me.dayGan], GAN_ELEMENT[p.gan]);
    if (rel === '인성') { score += 1; reasons.push('네가 받아들여지는 기운'); }
    if (rel === '관성') { score += 1; reasons.push('상대가 움직이는 기운'); }
    if (them) {
      if (GAN_HAP[them.dayGan] === p.gan) { score += 1; reasons.push('상대 일간과도 합'); }
      else if (GAN_CHUNG[them.dayGan] === p.gan) { score -= 1; }
    }
    days.push({
      date: `${y}-${String(mo).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
      label: `${mo}/${dd} (${WEEK[d.getDay()]})`,
      reason: reasons[0] ?? '무난한 날',
      score,
    });
  }
  return days
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
    .slice(0, pick)
    .sort((a, b) => a.date.localeCompare(b.date));
}
