import { useEffect, useMemo, useRef, useState } from 'react';
import { BRAND } from './brand';
import { getVariant, track } from './track';
import { BirthInput, Chart, computeChart } from './saju/manse';
import { buildFrontPage, FrontPage } from './saju/archetypes';
import { ExperimentResult, SAMPLE_REPORT } from './report/schema';
import { QUESTIONS, QuestionKey } from './report/questions';
import { buildContext, sampleContext, ReportContext } from './report/enrich';
import { estimateStage } from './report/selfreport';
import { isPaymentConfigured } from './payment';
import { supabase, isBackendConfigured } from './lib/supabase';
import { api, OrderInput, ReportRow, setFeedback, setExperimentResult } from './api';
import { BUSINESS, LegalPageKey, show } from './legal';
import Landing from './components/Landing';
import FrontPageCard from './components/FrontPageCard';
import NextIssue from './components/NextIssue';
import SkuFlow, { SkuResult } from './components/SkuFlow';
import ReportView from './components/ReportView';
import AuthGate from './components/AuthGate';
import Checkout from './components/Checkout';
import Pending from './components/Pending';
import MyReports from './components/MyReports';
import Admin from './components/Admin';
import LegalPage from './components/LegalPage';

type View = 'landing' | 'card' | 'sku' | 'auth' | 'checkout' | 'pending' | 'report' | 'myreports' | 'admin' | 'legal';
type AfterAuth = 'checkout' | 'myreports' | 'admin';

const LIVE = isBackendConfigured() && isPaymentConfigured();
/** 결제 키만 있고 서버(Supabase)가 아직 없을 때 — PG 심사용: 결제창까지 실제로 열리고, 승인·발행은 서버 연동 후 */
const PAY_ONLY = !isBackendConfigured() && isPaymentConfigured();
const PENDING_KEY = 'sokboyeo.pendingOrder';
const LAST_REPORT_KEY = 'sokboyeo.lastReport';

function formatIssueDate(d = new Date()): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function parseSharedInput(q: URLSearchParams): BirthInput | null {
  const b = q.get('b');
  if (!b || !/^\d{8}$/.test(b)) return null;
  const h = q.get('h');
  return {
    year: Number(b.slice(0, 4)), month: Number(b.slice(4, 6)), day: Number(b.slice(6, 8)),
    hour: h && h !== '-' && /^\d{1,2}$/.test(h) ? Number(h) : null, minute: 0,
    calendar: q.get('c') === 'l' ? 'lunar' : 'solar', leapMonth: q.get('l') === '1',
  };
}

function presetQuestionFrom(q: URLSearchParams): QuestionKey | null {
  const k = q.get('q');
  return QUESTIONS.some((x) => x.key === k) ? (k as QuestionKey) : null;
}

function legalPageFrom(q: URLSearchParams): LegalPageKey | null {
  const p = q.get('page');
  return p === 'terms' || p === 'privacy' || p === 'refund' ? p : null;
}

export default function App() {
  const variant = getVariant();
  const brand = BRAND[variant];
  const [view, setView] = useState<View>('landing');
  const [returnView, setReturnView] = useState<View>('landing');
  const [legalPage, setLegalPage] = useState<LegalPageKey>('terms');
  const [afterAuth, setAfterAuth] = useState<AfterAuth>('checkout');
  const [input, setInput] = useState<BirthInput | null>(null);
  const [chart, setChart] = useState<Chart | null>(null);
  const [page, setPage] = useState<FrontPage | null>(null);
  const [mbti, setMbti] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sku, setSku] = useState<SkuResult | null>(null);
  const [presetQ, setPresetQ] = useState<QuestionKey | null>(null);
  const [pendingOrder, setPendingOrder] = useState<OrderInput | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [reportRow, setReportRow] = useState<ReportRow | null>(null);
  /** 랜딩 타일에서 샘플 리포트의 특정 섹션으로 바로 스크롤 */
  const [reportAnchor, setReportAnchor] = useState<string | null>(null);
  const [experimentResult, setExpResult] = useState<ExperimentResult | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmParams, setConfirmParams] = useState<{ paymentKey: string; orderId: string; amount: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const issueDate = useMemo(() => formatIssueDate(), []);

  function go(v: View) { setView(v); window.scrollTo({ top: 0 }); }

  function openLegal(p: LegalPageKey) {
    setLegalPage(p);
    setReturnView(view === 'legal' ? returnView : view);
    track('legal_view', { page: p });
    go('legal');
  }

  function issue(next: BirthInput, shared = false, m = ''): boolean {
    try {
      const c = computeChart(next);
      setInput(next); setChart(c); setPage(buildFrontPage(c, m)); setMbti(m);
      setError(null); setIsShared(shared); go('card');
      track(shared ? 'shared_view' : 'card_issued', { archetype: c.dayGan, has_time: c.hasTime, calendar: next.calendar, mbti: m || '-' });
      return true;
    } catch {
      setError('날짜를 다시 확인해줘. 음력이면 윤달 여부도 같이 봐줘.');
      return false;
    }
  }

  useEffect(() => {
    track('page_view', { live: LIVE });
    const q = new URLSearchParams(window.location.search);
    setPresetQ(presetQuestionFrom(q));
    const legal = legalPageFrom(q);
    if (legal) { setLegalPage(legal); setView('legal'); }

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        const u = data.session?.user;
        setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
      });
      const pay = q.get('pay');
      if (pay === 'success') {
        const paymentKey = q.get('paymentKey'); const orderId = q.get('orderId'); const amount = Number(q.get('amount'));
        const reportId = sessionStorage.getItem(LAST_REPORT_KEY);
        if (paymentKey && orderId && amount && reportId) {
          setConfirmParams({ paymentKey, orderId, amount }); setPendingId(reportId); setView('pending');
          sessionStorage.removeItem(PENDING_KEY);
          window.history.replaceState(null, '', `${window.location.pathname}?v=${variant}`);
          return () => sub.subscription.unsubscribe();
        }
      }
      if (pay === 'fail') { setNotice('결제가 완료되지 않았어. 다시 시도할 수 있어.'); track('payment_fail'); }
      if (q.get('admin') === '1') { setAfterAuth('admin'); setView('admin'); return () => sub.subscription.unsubscribe(); }
      if (q.get('box') === '1') { setAfterAuth('myreports'); setView('myreports'); return () => sub.subscription.unsubscribe(); }
      if (legal) return () => sub.subscription.unsubscribe();
      const shared = parseSharedInput(q);
      if (shared) issue(shared, true, q.get('m') ?? '');
      else if (q.get('flow') === 'sku') startSku();
      else if (q.get('demo') === 'report') { setView('report'); track('report_view', { demo: true }); }
      return () => sub.subscription.unsubscribe();
    }

    if (legal) return;
    if (PAY_ONLY && q.get('pay') === 'success') {
      track('payment_success', { mode: 'pay_only' });
      setNotice('결제 요청이 접수됐어(테스트). 리포트 생성 서버 연동이 끝나면 여기서 바로 발행돼.');
      window.history.replaceState(null, '', `${window.location.pathname}?v=${variant}`);
      return;
    }
    if (PAY_ONLY && q.get('pay') === 'fail') { setNotice('결제가 완료되지 않았어. 다시 시도할 수 있어.'); track('payment_fail'); }
    const shared = parseSharedInput(q);
    if (shared) issue(shared, true, q.get('m') ?? '');
    else if (q.get('flow') === 'sku') startSku();
    else if (q.get('demo') === 'report') { setView('report'); track('report_view', { demo: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function backToLanding() {
    setIsShared(false);
    window.history.replaceState(null, '', `${window.location.pathname}?v=${variant}`);
    go('landing');
    track('reissue_click');
  }

  function startSku() {
    track('sku_start', { from: view, preset: Boolean(presetQuestionFrom(new URLSearchParams(window.location.search))) });
    go('sku');
  }

  function skipToCard() {
    if (chart && !page) setPage(buildFrontPage(chart, mbti));
    if (chart) go('card'); else backToLanding();
  }

  function onPurchase(result: SkuResult) {
    setSku(result);
    setExpResult(null);
    const order: OrderInput = {
      nickname: result.nickname, myBirth: result.myBirth, subjectBirth: result.subjectBirth,
      questionKey: result.question, selfAnswers: result.selfAnswers, sku: 'basic',
    };
    if (PAY_ONLY) {
      // 서버 연동 전: 결제창까지 실제로 연다 (심사·결제 UX 확인용). 승인·발행은 서버 연동 후.
      setPendingOrder(order);
      go('checkout');
      return;
    }
    if (!LIVE) {
      go('report');
      track('report_view', { demo: true, question: result.question });
      return;
    }
    setPendingOrder(order);
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(order));
    if (user) go('checkout'); else { setAfterAuth('checkout'); go('auth'); }
  }

  async function refreshUserThen(target: AfterAuth) {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
    if (target === 'checkout') {
      const saved = pendingOrder ?? (JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null') as OrderInput | null);
      if (saved) { setPendingOrder(saved); go('checkout'); } else go('landing');
    } else go(target);
  }

  async function openReport(id: string) {
    try {
      const r = await api.getReport(id);
      if (r.status === 'viewed' && r.content) { setReportRow(r); setExpResult(r.experimentResult); go('report'); track('report_view', { demo: false, sku: r.sku }); }
      else { setPendingId(id); setConfirmParams(null); go('pending'); }
    } catch (e) { setNotice((e as Error).message); }
  }

  async function onExperimentResult(r: ExperimentResult) {
    setExpResult(r);
    if (reportRow) {
      try { await setExperimentResult(reportRow.id, r); } catch (e) { setNotice((e as Error).message); }
    }
  }

  async function onRefund() {
    if (!reportRow || !window.confirm('근거가 부족했다면 환불할게. 리포트는 닫혀. 진행할까?')) return;
    try { await api.cancelOrder(reportRow.id); track('order_refunded_24h'); setNotice('환불 처리했어. 결제 수단으로 돌아가.'); go('myreports'); }
    catch (e) { setNotice((e as Error).message); }
  }

  const requireUser = (target: AfterAuth) => (user ? null : <AuthGate reason={target === 'admin' ? '데스크 접근에 필요해.' : '발행함을 보려면 필요해.'} onDone={() => refreshUserThen(target)} onCancel={backToLanding} onLegal={openLegal} />);

  /** 리포트의 결정론 섹션 문맥 — 실제 발행분은 서버 저장값, 샘플은 방금 입력한 값, 딥링크 데모는 고정 시나리오 */
  const reportContext = useMemo<ReportContext | null>(() => {
    if (reportRow?.myChart && reportRow.subjectChart && reportRow.compat && reportRow.selfReport) {
      const sr = reportRow.selfReport;
      return buildContext({
        question: reportRow.questionKey, nickname: reportRow.nickname, myChart: reportRow.myChart, theirChart: reportRow.subjectChart, compat: reportRow.compat,
        selfAnswers: sr.answers, signalIndex: sr.signalIndex, flags: sr.flags, stage: reportRow.content?.stage.current ?? sr.stage?.current ?? '만남',
      });
    }
    if (sku) {
      return buildContext({
        question: sku.question, nickname: sku.nickname, myChart: sku.myChart, theirChart: sku.theirChart, compat: sku.compat,
        selfAnswers: sku.selfAnswers, signalIndex: sku.selfReport.signalIndex, flags: sku.selfReport.flags, stage: estimateStage(sku.selfReport, sku.question).current,
      });
    }
    return sampleContext();
  }, [reportRow, sku]);

  return (
    <div className="app">
      {notice && <div className="shared-banner">{notice} <button className="link-btn" onClick={() => setNotice(null)}>닫기</button></div>}

      {view === 'landing' && (
        <Landing
          brand={brand} issueDate={issueDate} error={error}
          onSubmit={(i, m) => issue(i, false, m)}
          onStartSku={() => { setPresetQ(null); startSku(); }}
          onStartQuestion={(q) => { setPresetQ(q); track('sku_start', { from: 'landing', preset: true, question: q }); go('sku'); }}
          onOpenSample={(anchor) => { setReportRow(null); setExpResult(null); setReportAnchor(anchor ?? null); track('report_view', { demo: true, from: 'landing', anchor: anchor ?? '' }); go('report'); }}
        />
      )}

      {view === 'card' && chart && page && input && (
        <div className="card-view">
          <header className="topbar">
            <span className="lockup serif"><span className="bracket">「</span>{brand.masthead}<span className="bracket">」</span></span>
            <span className="lockup-sub">{brand.sub}</span>
          </header>
          {isShared && <div className="shared-banner">친구의 연애 스타일 카드야. <button className="link-btn" onClick={backToLanding}>내 것도 무료로 보기 →</button></div>}
          <FrontPageCard ref={cardRef} brand={brand} chart={chart} page={page} issueDate={issueDate} />
          <NextIssue brand={brand} input={input} mbti={mbti} archetype={chart.dayGan} cardRef={cardRef} onReissue={backToLanding} onStartSku={startSku} />
        </div>
      )}

      {view === 'sku' && (
        <SkuFlow
          brand={brand}
          myChart={chart}
          myInput={input}
          presetQuestion={presetQ}
          onMyChart={(c, i) => { setChart(c); setInput(i); setPage(buildFrontPage(c, mbti)); }}
          onPurchase={onPurchase}
          onSkipToCard={skipToCard}
          onExit={() => (chart ? go('card') : backToLanding())}
          onHome={backToLanding}
          onLegal={openLegal}
        />
      )}

      {view === 'auth' && <AuthGate reason="결제와 영구 소장에 필요해." onDone={() => refreshUserThen('checkout')} onCancel={() => go('sku')} onLegal={openLegal} />}

      {view === 'checkout' && (PAY_ONLY && pendingOrder
        ? <Checkout brand={brand} order={pendingOrder} customerKey={`guest-${Math.random().toString(36).slice(2, 12)}`} onBack={() => go('sku')} onLegal={openLegal} />
        : user && pendingOrder
          ? <Checkout brand={brand} order={pendingOrder} customerKey={user.id} customerEmail={user.email} onBack={() => go('sku')} onLegal={openLegal} />
          : requireUser('checkout'))}

      {view === 'pending' && pendingId && (user
        ? <Pending brand={brand} reportId={pendingId} confirm={confirmParams} onReady={(r) => { setReportRow(r); setExpResult(r.experimentResult); go('report'); track('report_view', { demo: false, sku: r.sku }); }} onBack={backToLanding} />
        : requireUser('myreports'))}

      {view === 'report' && (
        <ReportView
          brand={brand}
          content={reportRow?.content ?? SAMPLE_REPORT}
          context={reportContext}
          anchor={reportAnchor}
          nickname={reportRow?.nickname ?? sku?.nickname ?? '걔'}
          issueDate={issueDate}
          demo={!reportRow}
          experimentResult={experimentResult}
          onExperimentResult={onExperimentResult}
          onFeedback={reportRow ? (v) => setFeedback(reportRow.id, v) : undefined}
          onRefund={reportRow ? onRefund : undefined}
          onBack={() => (chart ? go('card') : backToLanding())}
        />
      )}

      {view === 'myreports' && (user ? <MyReports brand={brand} onOpen={openReport} onBack={backToLanding} /> : requireUser('myreports'))}
      {view === 'admin' && (user ? <Admin brand={brand} issueDate={issueDate} onBack={backToLanding} /> : requireUser('admin'))}
      {view === 'legal' && <LegalPage brand={brand} page={legalPage} onBack={() => go(returnView === 'legal' ? 'landing' : returnView)} />}

      <footer className="footer">
        <p>{brand.masthead}의 1면과 리포트는 참고용 콘텐츠이며, 관계에 대한 판단과 책임은 이용자 본인에게 있어요.</p>
        <div className="footer-links">
          <button className="link-btn" onClick={() => openLegal('terms')}>이용약관</button>
          <button className="link-btn" onClick={() => openLegal('privacy')}>개인정보처리방침</button>
          <button className="link-btn" onClick={() => openLegal('refund')}>환불·청약철회 안내</button>
          {isBackendConfigured() && <button className="link-btn" onClick={() => { setAfterAuth('myreports'); go('myreports'); }}>발행함</button>}
        </div>
        <div className="footer-biz">
          <p>상호 {show(BUSINESS.company)} · 대표 {show(BUSINESS.ceo)}</p>
          <p>사업자등록번호 {show(BUSINESS.bizNo)}</p>
          <p>통신판매업 신고 {show(BUSINESS.mailOrderNo)}</p>
          <p>{show(BUSINESS.address)}</p>
          <p>고객센터 {show(BUSINESS.phone)} · {show(BUSINESS.email)}</p>
          <p>호스팅 {BUSINESS.hosting}</p>
        </div>
        <p className="footer-copy">© 2026 {brand.desk}{LIVE && user ? ` · ${user.email}` : ''}</p>
      </footer>
    </div>
  );
}
