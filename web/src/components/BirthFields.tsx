export interface BirthState {
  year: number;
  month: number;
  day: number;
  calendar: 'solar' | 'lunar';
  leap: boolean;
  knowsTime: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_BIRTH: BirthState = { year: 1998, month: 6, day: 15, calendar: 'solar', leap: false, knowsTime: false, hour: 12, minute: 0 };

const YEARS = Array.from({ length: 2011 - 1960 }, (_, i) => 2010 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

interface Props {
  value: BirthState;
  onChange: (next: BirthState) => void;
  timeLabel?: string;
  unknownLabel?: string;
}

export default function BirthFields({ value, onChange, timeLabel = '태어난 시간', unknownLabel = '몰라요 (삼주로 봐요)' }: Props) {
  const set = (patch: Partial<BirthState>) => onChange({ ...value, ...patch });
  return (
    <>
      <div className="field">
        <label>태어난 날</label>
        <div className="row">
          <select value={value.year} onChange={(e) => set({ year: Number(e.target.value) })} aria-label="년">
            {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={value.month} onChange={(e) => set({ month: Number(e.target.value) })} aria-label="월">
            {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
          <select value={value.day} onChange={(e) => set({ day: Number(e.target.value) })} aria-label="일">
            {DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
          </select>
        </div>
        <div className="row toggle-row">
          <label className={value.calendar === 'solar' ? 'chip on' : 'chip'}>
            <input type="radio" checked={value.calendar === 'solar'} onChange={() => set({ calendar: 'solar' })} /> 양력
          </label>
          <label className={value.calendar === 'lunar' ? 'chip on' : 'chip'}>
            <input type="radio" checked={value.calendar === 'lunar'} onChange={() => set({ calendar: 'lunar' })} /> 음력
          </label>
          {value.calendar === 'lunar' && (
            <label className={value.leap ? 'chip on' : 'chip'}>
              <input type="checkbox" checked={value.leap} onChange={(e) => set({ leap: e.target.checked })} /> 윤달
            </label>
          )}
        </div>
      </div>
      <div className="field">
        <label>{timeLabel} <span className="optional">선택</span></label>
        <div className="row toggle-row">
          <label className={!value.knowsTime ? 'chip on' : 'chip'}>
            <input type="radio" checked={!value.knowsTime} onChange={() => set({ knowsTime: false })} /> {unknownLabel}
          </label>
          <label className={value.knowsTime ? 'chip on' : 'chip'}>
            <input type="radio" checked={value.knowsTime} onChange={() => set({ knowsTime: true })} /> 알아요
          </label>
        </div>
        {value.knowsTime && (
          <div className="row">
            <select value={value.hour} onChange={(e) => set({ hour: Number(e.target.value) })} aria-label="시">
              {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}시</option>)}
            </select>
            <select value={value.minute} onChange={(e) => set({ minute: Number(e.target.value) })} aria-label="분">
              {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>)}
            </select>
          </div>
        )}
      </div>
    </>
  );
}

export function toBirthInput(b: BirthState) {
  return {
    year: b.year,
    month: b.month,
    day: b.day,
    hour: b.knowsTime ? b.hour : null,
    minute: b.knowsTime ? b.minute : 0,
    calendar: b.calendar,
    leapMonth: b.calendar === 'lunar' && b.leap,
  };
}
