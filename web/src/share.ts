import type { BirthInput } from './saju/manse';
import { getVariant } from './track';

export function buildShareUrl(input: BirthInput, mbti = ''): string {
  const q = new URLSearchParams();
  q.set('v', getVariant());
  q.set('b', `${input.year}${String(input.month).padStart(2, '0')}${String(input.day).padStart(2, '0')}`);
  q.set('h', input.hour === null ? '-' : String(input.hour));
  q.set('c', input.calendar === 'lunar' ? 'l' : 's');
  if (input.leapMonth) q.set('l', '1');
  if (mbti) q.set('m', mbti);
  return `${window.location.origin}${window.location.pathname}?${q.toString()}`;
}
