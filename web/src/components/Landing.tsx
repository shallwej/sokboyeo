import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Brand } from '../brand';
import type { BirthInput, Gan } from '../saju/manse';
import { ARCHETYPES, MBTI_TYPES } from '../saju/archetypes';
import { QUESTIONS, type QuestionKey } from '../report/questions';
import { sampleContext } from '../report/enrich';
import { scoreSelfReport } from '../report/selfreport';
import { REPORT_SECTIONS, type SectionKey } from '../report/sections';
import { SKUS, formatWon } from '../payment';
import { track } from '../track';
import BirthFields, { BirthState, DEFAULT_BIRTH, toBirthInput } from './BirthFields';

interface Props {
  brand: Brand;
  issueDate: string;
  error: string | null;
  onSubmit: (input: BirthInput, mbti: string) => void;
  /** 걔 마음 확인 — 질문 선택부터 */
  onStartSku: () => void;
  /** 걔 마음 확인 — 질문 프리셋으로 바로 */
  onStartQuestion: (q: QuestionKey) => void;
  /** 샘플 리포트 (섹션으로 바로 스크롤) */
  onOpenSample: (anchor?: SectionKey) => void;
}

const GANS: Gan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const HL: Record<QuestionKey, { short: string; label: string }> = {
  interest: { short: '관심?', label: '관심 있나' },
  contact: { short: '연락?', label: '연락해도' },
  status: { short: '사이?', label: '무슨 사이' },
  cooling: { short: '식음?', label: '왜 식었지' },
  confess: { short: '고백?', label: '고백해도' },
};

/** 그리드 색 배치 — 핑크는 서로 닿지 않게, 초록은 이 그리드에 없음 */
const TILE_CLS = ['tile-pink', 'tile-ink', 'tile-paper', 'tile-ink', 'tile-paper', 'tile-pink', 'tile-paper', 'tile-pink', 'tile-ink'];

/**
 * 랜딩 = 사용자가 순서대로 품는 질문에 한 블록씩 답한다.
 * 이게 뭐야 → 내 고민이 있나 → 뭘 넣어야 돼 → 무료는 뭘 주지 → 유료는 뭐가 다르지 → 믿을 만해 → 덤은 뭐지
 * 한 블록에 행동 하나. 주 버튼은 히어로와 하단 고정 바 둘뿐.
 */
export default function Landing({ brand, issueDate, error, onSubmit, onStartSku, onStartQuestion, onOpenSample }: Props) {
  const formRef = useRef<HTMLDivElement>(null);
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const [birth, setBirth] = useState<BirthState>(DEFAULT_BIRTH);
  const [mbti, setMbti] = useState('');
  const [touched, setTouched] = useState(false);
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const today = ARCHETYPES[GANS[dayOfYear % GANS.length]];

  // 무료 결과 예시 — 샘플 리포트와 같은 시나리오(壬 × 己)를 실제 계산으로
  const sample = useMemo(() => {
    const ctx = sampleContext();
    const sr = scoreSelfReport(ctx.selfAnswers);
    return { compat: ctx.compat.index, signal: ctx.signalIndex, stage: ctx.stage, facts: [ctx.compat.facts[0]?.title ?? '', sr.facts[0] ?? '', sr.facts[2] ?? ''].filter(Boolean) };
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observers: IntersectionObserver[] = [];
    if (heroCtaRef.current) {
      const io = new IntersectionObserver(([e]) => setHeroCtaVisible(e.isIntersecting), { threshold: 0.4 });
      io.observe(heroCtaRef.current); observers.push(io);
    }
    if (formRef.current) {
      const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.12 });
      io.observe(formRef.current); observers.push(io);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function goForm(from: string) {
    track('cta_hero_click', { from });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function tile(name: string, action: () => void) {
    track('tile_click', { tile: name });
    action();
  }

  function onFocusForm() {
    if (!touched) { setTouched(true); track('form_start'); }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    track('form_submit', { calendar: birth.calendar, has_time: birth.knowsTime, mbti: Boolean(mbti) });
    onSubmit(toBirthInput(birth), mbti);
  }

  const showSticky = !heroCtaVisible && !formVisible;
  const price = formatWon(SKUS.basic.price);

  return (
    <div className="landing">
      {/* 1. 이게 뭐야 */}
      <header className="mast">
        <div className="mast-row">
          <span className="badge">{brand.masthead[0]}</span>
          <h1 className="wordmark wm">
            {brand.masthead}
            {/* 돋보기 — 로고 위를 훑으며 글자를 확대. 움직임 줄이기 설정이면 정지 */}
            <span className="lens" aria-hidden="true">
              <span className="lens-glass"><span className="lens-text">{brand.masthead}</span></span>
              <span className="lens-handle" />
            </span>
          </h1>
          <span className="mast-sub">{brand.sub}</span>
        </div>
        <div className="mast-meta"><span>걔 마음 판정 리포트</span><span>{issueDate}</span><span>오늘의 결 · {today.name}</span></div>
      </header>

      <section className="hero">
        <div className="cover cover-hero">
          <span className="cover-brand"><i>{brand.masthead[0]}</i>{brand.masthead}</span>
          <span className="cover-kicker">Free · 무료</span>
          <h2 className="cover-title">걔, 요즘<br />왜 그래?</h2>
        </div>
        <p className="hero-lead2">걔 생일이랑 요즘 상황 5개만 고르면, 지금 걔 마음이 어디쯤인지 판정해 줘. 카톡은 안 올려도 돼.</p>
        <div className="hero-ctas">
          <button ref={heroCtaRef} className="btn-primary" onClick={() => tile('hero_primary', onStartSku)}>걔 마음 무료로 확인하기</button>
        </div>
        <p className="hero-benefit">가입 없음 · 1분 · 걔 생일만 알면 돼</p>
      </section>

      {/* 2. 내 고민이 여기 있나 — 질문으로 바로 시작 */}
      <section className="hl-block">
        <div className="grid-head"><b>또는, 질문으로 바로 시작</b><span>고르면 그 질문에 맞춰 판정해</span></div>
        <div className="hl-row">
          {QUESTIONS.map((q) => (
            <button key={q.key} type="button" className="hl" onClick={() => tile(`hl_${q.key}`, () => onStartQuestion(q.key))}>
              <span className="hl-ring"><i>{HL[q.key].short}</i></span>
              <span className="hl-label">{HL[q.key].label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. 뭘 넣어야 돼 · 4. 무료는 뭘 주지 — 한 카드로 */}
      <section className="preview-block">
        <div className="grid-head"><b>1분 넣으면, 무료로 이만큼</b><span>실제 계산 예시</span></div>
        <div className="free-preview">
          <div className="fp-input">
            <span className="fp-in">걔 생일</span><span className="fp-plus">+</span><span className="fp-in">내 생일</span><span className="fp-plus">+</span><span className="fp-in">요즘 상황 5개</span>
            <span className="fp-arrow">→</span>
          </div>
          <div className="numbers">
            <div className="num"><span>궁합 흐름</span><b>{sample.compat}</b></div>
            <div className="num"><span>신호 지수</span><b>{sample.signal}</b></div>
            <div className="num"><span>관계 단계</span><b className="stage">{sample.stage}</b></div>
          </div>
          <ul className="fp-locked">
            {sample.facts.map((f) => <li key={f}><span>{f}</span><span className="lock">해석은 리포트에서</span></li>)}
          </ul>
          <p className="fp-note2">숫자와 팩트까지 무료. 해석·실험·보낼 문장은 전체 리포트에 있어.</p>
        </div>
      </section>

      {/* 5. 유료는 뭐가 다르지 — 그리드 9칸 = 리포트에 들어있는 9가지 */}
      <section className="grid-block">
        <div className="grid-head"><b>전체 리포트에 들어있는 9가지</b><span>{price} · 1분 안에 발행</span></div>
        <div className="grid9">
          {REPORT_SECTIONS.map((s, i) => (
            <button key={s.key} type="button" className={`tile ${TILE_CLS[i]}`} onClick={() => tile(`section_${s.key}`, () => onOpenSample(s.key))}>
              <span className="tile-k">{String(i + 1).padStart(2, '0')}</span><b>{s.title}</b>
            </button>
          ))}
        </div>
        <p className="grid-foot">타일을 누르면 샘플 리포트의 그 부분이 열려. <button type="button" className="link-btn" onClick={() => tile('sample_full', () => onOpenSample())}>샘플 통째로 보기 →</button></p>
      </section>

      {/* 6. 믿을 만해 */}
      <section className="trust">
        <div className="trust-row"><b>틀리면 [정정]</b><span>확인된 것만 싣고, 실험 결과가 다르면 판정을 고쳐서 다시 실어.</span></div>
        <div className="trust-row"><b>카톡 원문 없음</b><span>생일과 답 5개만 써. 대화 내용은 받지도, 저장하지도 않아.</span></div>
        <div className="trust-row"><b>24시간 환불</b><span>발행 후 하루 안에 근거가 부족했다고 느끼면 전액 돌려줘.</span></div>
      </section>

      {/* 7. 덤 — 내 연애 스타일 카드 (무료, 내 생일만) */}
      <section className="form-block" ref={formRef}>
        <span className="newsbar">덤 · 무료 · 내 생일만</span>
        <h3 className="serif">내 연애 스타일 카드</h3>
        <p className="step-desc">타고난 연애 기질을 사주로 계산해 카드로 만들어 줘. 저장하고 친구한테 보내.</p>
        <form onSubmit={submit} onFocus={onFocusForm}>
          <BirthFields value={birth} onChange={setBirth} />
          <div className="field">
            <label>MBTI <span className="optional">안 써도 돼</span></label>
            <select value={mbti} onChange={(e) => setMbti(e.target.value)} aria-label="MBTI">
              <option value="">몰라요 / 안 써요</option>
              {MBTI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className="field-help">넣으면 네가 고른 너(MBTI)와 타고난 결(사주)이 어디서 겹치고 갈리는지 카드에 같이 실어.</p>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary">내 연애 스타일 보기</button>
          <p className="form-privacy">생년월일은 저장하지 않아. 이 화면에서 계산하고 끝.</p>
        </form>
      </section>

      {/* 8. 다음에 열리는 것 */}
      <section className="soon">
        <div className="grid-head"><b>리포트 다음에 열려</b><span>곧</span></div>
        <div className="soon-row">
          <button type="button" className="soon-chip" onClick={() => setNotice('카톡 업로드 분석은 곧 열려. 열리면 발행함에서 알려줄게.')}>카톡 올리면 관심도 측정 · {formatWon(SKUS.deep.price)}</button>
          <button type="button" className="soon-chip" onClick={() => setNotice('질문권은 곧 열려. 리포트를 읽은 편집국이 1문 1답으로 답해.')}>편집국에 질문 · {formatWon(SKUS.question.price)}</button>
          <button type="button" className="soon-chip" onClick={() => setNotice('타로 한 장은 곧 열려. 리포트 문맥 위에서 오늘 할 행동 하나를 뽑아줘.')}>걔 마음 한 장 · {formatWon(SKUS.tarot.price)}</button>
        </div>
        {notice && <p className="status">{notice}</p>}
      </section>

      {showSticky && (
        <div className="sticky-cta">
          <div className="sticky-inner">
            <button className="btn-primary" onClick={() => tile('sticky', onStartSku)}>걔 마음 무료로 확인하기</button>
            <span className="sticky-note">가입 없음<br />1분</span>
          </div>
        </div>
      )}
    </div>
  );
}
