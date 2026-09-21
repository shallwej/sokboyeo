// 만세력 계산 검증 — 연사리 공개 샘플(양력 1999-03-11 06:30)의 원국과 대조
import pkg from 'lunar-javascript';
const { Solar, Lunar } = pkg;

const cases = [
  { label: '연사리 샘플', y: 1999, m: 3, d: 11, h: 6, mi: 30, expect: ['己卯', '丁卯', '壬戌', '癸卯'] },
];

let ok = true;
for (const c of cases) {
  const ec = Solar.fromYmdHms(c.y, c.m, c.d, c.h, c.mi, 0).getLunar().getEightChar();
  const got = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()];
  const pass = got.join() === c.expect.join();
  ok = ok && pass;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${c.label}: got ${got.join(' ')} / expect ${c.expect.join(' ')}`);
}

// 입춘 경계: 2000-02-03 (입춘 전) → 연주 己卯, 2000-02-05 → 庚辰
const before = Solar.fromYmdHms(2000, 2, 3, 12, 0, 0).getLunar().getEightChar().getYear();
const after = Solar.fromYmdHms(2000, 2, 5, 12, 0, 0).getLunar().getEightChar().getYear();
console.log(`입춘 경계: 2000-02-03 → ${before} (expect 己卯), 2000-02-05 → ${after} (expect 庚辰)`);
ok = ok && before === '己卯' && after === '庚辰';

// 음력 → 양력 변환 API 확인 (음력 1999-01-24 → 양력 1999-03-11)
const solar = Lunar.fromYmd(1999, 1, 24).getSolar();
console.log(`음력 1999-01-24 → 양력 ${solar.toYmd()} (expect 1999-03-11)`);
ok = ok && solar.toYmd() === '1999-03-11';

// 시간 미입력(정오 대체) 시 일주가 흔들리지 않는지
const noon = Solar.fromYmdHms(1999, 3, 11, 12, 0, 0).getLunar().getEightChar().getDay();
console.log(`정오 대체 일주: ${noon} (expect 壬戌)`);
ok = ok && noon === '壬戌';

console.log(ok ? '\nALL PASS' : '\nSOME FAILED');
process.exit(ok ? 0 : 1);
