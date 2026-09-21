import { useMemo, useState } from 'react';
import type { Brand } from '../brand';
import { BirthInput, Chart, computeChart } from '../saju/manse';
import { computeCompat, Compat } from '../saju/compat';
import { ARCHETYPES } from '../saju/archetypes';
import { QUESTIONS, QuestionKey } from '../report/questions';
import { SELF_QUESTIONS, SelfAnswers, SelfQuestion, scoreSelfReport, estimateStage, SelfReport } from '../report/selfreport';
import { track } from '../track';
import BirthFields, { BirthState, DEFAULT_BIRTH, toBirthInput } from './BirthFields';
import Paywall from './Paywall';

export interface SkuResult {
  question: QuestionKey;
  nickname: string;
  myChart: Chart;
  theirChart: Chart;
  compat: Compat;
  selfReport: SelfReport;
  myBirth: BirthInput;
  subjectBirth: BirthInput;
  selfAnswers: SelfAnswers;
}

interface Props {
  brand: Brand;
  myChart: Chart | null;
  myInput: BirthInput | null;
  /** 광고 랜딩: 소재의 질문을 미리 선택 → 질문 단계 생략, 상대 생일부터 */
  presetQuestion: QuestionKey | null;
  onMyChart: (chart: Chart, input: BirthInput) => void;
  onPurchase: (result: SkuResult) => void;
  onSkipToCard: () => void;
  onExit: () => void;
  /** 첫 단계의 '처음으로' — 항상 홈(랜딩). 없으면 onExit */
  onHome?: () => void;
  onLegal: (page: 'terms' | 'privacy' | 'refund') => void;
}

type Step = 'me' | 'question' | 'subject' | 'self' | 'teaser';

export default function SkuFlow({ brand, myChart, myInput, presetQuestion, onMyChart, onPurchase, onSkipToCard, onExit, onHome, onLegal }: Props) {
  const steps = useMemo<Step[]>(() => {
    const needMe = !myChart;
    return presetQuestion
      ? (['subject', ...(needMe ? ['me' as Step] : []), 'self', 'teaser'] as Step[])
      : ([...(needMe ? ['me' as Step] : []), 'question', 'subject', 'self', 'teaser'] as Step[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const next = () => { setIdx((i) => Math.min(i + 1, steps.length - 1)); window.scrollTo({ top: 0 }); };
  // 이전: 첫 단계에선 랜딩으로. 상단 '나가기'는 작아서 엄지로 누르기 어렵다는 피드백 반영
  const prev = () => {
    if (idx === 0) { (onHome ?? onExit)(); return; }
    setIdx((i) => Math.max(i - 1, 0)); window.scrollTo({ top: 0 });
  };
  const prevLabel = idx === 0 ? '처음으로' : '이전';

  const [me, setMe] = useState<BirthState>(DEFAULT_BIRTH);
  const [myChartLocal, setMyChartLocal] = useState<Chart | null>(myChart);
  const [myBirth, setMyBirth] = useState<BirthInput | null>(myInput);
  const [question, setQuestion] = useState<QuestionKey | null>(presetQuestion);
  const [nickname, setNickname] = useState('');
  const [them, setThem] = useState<BirthState>({ ...DEFAULT_BIRTH, year: 1996 });
  const [theirChart, setTheirChart] = useState<Chart | null>(null);
  const [answers, setAnswers] = useState<SelfAnswers>({});
  const [error, setError] = useState<string | null>(null);

  function submitMe() {
    try {
      const input = toBirthInput(me);
      const c = computeChart(input);
      setMyChartLocal(c); setMyBirth(input); onMyChart(c, input);
      setError(null); next();
    } catch { setError('날짜를 다시 확인해줘.'); }
  }

  function pickQuestion(k: QuestionKey) {
    setQuestion(k);
    track('sku_question', { key: k });
    next();
  }

  function submitSubject() {
    try {
      const c = computeChart(toBirthInput(them));
      setTheirChart(c); setError(null);
      track('sku_subject_entered', { has_time: them.knowsTime, preset: Boolean(presetQuestion) });
      next();
    } catch { setError('상대 생년월일을 다시 확인해줘.'); }
  }

  function answer(key: SelfQuestion['key'], i: number) { setAnswers((a) => ({ ...a, [key]: i })); }
  const answeredAll = SELF_QUESTIONS.every((q) => answers[q.key] !== undefined);

  function submitSelf() {
    const sr = scoreSelfReport(answers);
    track('sku_selfreport_done', { signal: sr.signalIndex, flags: sr.flags.join('|') });
    next();
  }

  const selfReport = step === 'teaser' ? scoreSelfReport(answers) : null;
  const compat = step === 'teaser' && myChartLocal && theirChart ? computeCompat(myChartLocal, theirChart) : null;
  const presetLabel = presetQuestion ? QUESTIONS.find((q) => q.key === presetQuestion)?.label : null;

  return (
    <div className="skuflow">
      <header className="topbar">
        <span className="lockup serif"><span className="bracket">「</span>{brand.masthead}<span className="bracket">」</span></span>
        <span className="lockup-sub">{brand.sub}</span>
        <button className="btn-ghost right" onClick={onExit}>나가기</button>
      </header>
      <div className="progress"><i style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>
      <p className="step-count">{presetLabel ? `무료 확인 · "${presetLabel}"` : '걔 마음 무료 확인'} {idx + 1} / {steps.length}</p>

      {step === 'me' && (
        <section className="step-block">
          <span className="newsbar">내 정보</span>
          <h2 className="serif">{presetQuestion ? '이제 네 생년월일' : '먼저 네 생년월일부터'}</h2>
          <p className="step-desc">내 원국이 있어야 상대와 겹쳐 볼 수 있어. 시간은 몰라도 돼.</p>
          <BirthFields value={me} onChange={setMe} />
          {error && <p className="error">{error}</p>}
          <div className="step-nav">
            <button type="button" className="btn-ghost" onClick={prev}>{prevLabel}</button>
            <button className="btn-primary" onClick={submitMe}>다음</button>
          </div>
        </section>
      )}

      {step === 'question' && (
        <section className="step-block">
          <span className="newsbar">궁금한 것</span>
          <h2 className="serif">지금 제일 궁금한 게 뭐야?</h2>
          <p className="step-desc">결과는 이 질문에 정면으로 답하게 맞출게.</p>
          <div className="options">
            {QUESTIONS.map((q) => (
              <button key={q.key} className="option" onClick={() => pickQuestion(q.key)}><b>{q.label}</b><span>{q.sub}</span></button>
            ))}
          </div>
          <div className="step-nav">
            <button type="button" className="btn-ghost" onClick={prev}>{prevLabel}</button>
          </div>
        </section>
      )}

      {step === 'subject' && (
        <section className="step-block">
          <span className="newsbar">걔 정보</span>
          <h2 className="serif">걔, 생일이 언제야?</h2>
          <p className="step-desc">카톡 프로필이나 톡캘린더 생일 알림에 떠 있을 때가 많아. 태어난 해는 나이로 계산하면 돼. 시간은 몰라도 돼.</p>
          <div className="field">
            <label>걔를 뭐라고 부를까 <span className="optional">닉네임 · 이니셜</span></label>
            <input className="text" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 12))} placeholder="예: J" />
          </div>
          <BirthFields value={them} onChange={setThem} timeLabel="걔 태어난 시간" unknownLabel="몰라요 (대부분 몰라)" />
          <p className="form-privacy">상대 정보는 이 리포트를 만드는 데만 쓰고, 발행함에서 언제든 지울 수 있어.</p>
          {error && <p className="error">{error}</p>}
          <div className="step-nav">
            <button type="button" className="btn-ghost" onClick={prev}>{prevLabel}</button>
            <button className="btn-primary" onClick={submitSubject}>다음</button>
          </div>
        </section>
      )}

      {step === 'self' && (
        <section className="step-block">
          <span className="newsbar">요즘 상황</span>
          <h2 className="serif">최근 2주, 어땠어?</h2>
          <p className="step-desc">카톡 안 올려도 돼. 다섯 개만 골라주면 숫자로 받을게.</p>
          {SELF_QUESTIONS.map((q) => (
            <div key={q.key} className="self-q">
              <b>{q.label}</b>
              <div className="self-opts">
                {q.options.map((o, i) => (
                  <button key={o.label} className={answers[q.key] === i ? 'self-opt on' : 'self-opt'} onClick={() => answer(q.key, i)}>{o.label}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="step-nav">
            <button type="button" className="btn-ghost" onClick={prev}>{prevLabel}</button>
            <button className="btn-primary" disabled={!answeredAll} onClick={submitSelf}>무료 결과 보기</button>
          </div>
        </section>
      )}

      {step === 'teaser' && compat && selfReport && myChartLocal && theirChart && question && (
        <Paywall
          brand={brand}
          nickname={nickname || '걔'}
          question={question}
          compat={compat}
          selfReport={selfReport}
          stage={estimateStage(selfReport, question)}
          myArchetype={ARCHETYPES[myChartLocal.dayGan].name}
          theirArchetype={ARCHETYPES[theirChart.dayGan].name}
          onPurchase={() => onPurchase({
            question, nickname: nickname || '걔', myChart: myChartLocal, theirChart, compat, selfReport,
            myBirth: myBirth ?? toBirthInput(me), subjectBirth: toBirthInput(them), selfAnswers: answers,
          })}
          onSkip={onSkipToCard}
          onLegal={onLegal}
        />
      )}
      {step === 'teaser' && (
        <div className="step-nav">
          <button type="button" className="btn-ghost" onClick={prev}>이전 · 제보 고치기</button>
        </div>
      )}
    </div>
  );
}
