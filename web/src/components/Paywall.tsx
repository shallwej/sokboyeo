import { useEffect } from 'react';
import type { Brand } from '../brand';
import type { Compat } from '../saju/compat';
import type { SelfReport, Stage } from '../report/selfreport';
import { QUESTIONS, QuestionKey } from '../report/questions';
import { REPORT_SECTIONS } from '../report/sections';
import { SKUS, PROMO, REFUND_POLICY, DELIVERY_POLICY, formatWon, isPaymentConfigured } from '../payment';
import { track } from '../track';

interface Props {
  brand: Brand;
  nickname: string;
  question: QuestionKey;
  compat: Compat;
  selfReport: SelfReport;
  stage: { current: Stage; note: string };
  myArchetype: string;
  theirArchetype: string;
  onPurchase: () => void;
  onSkip?: () => void;
  onLegal: (page: 'terms' | 'privacy' | 'refund') => void;
}

export default function Paywall({ brand, nickname, question, compat, selfReport, stage, myArchetype, theirArchetype, onPurchase, onSkip, onLegal }: Props) {
  const q = QUESTIONS.find((x) => x.key === question)!;
  const sku = SKUS.basic;

  useEffect(() => {
    track('paywall_view', { compat: compat.index, signal: selfReport.signalIndex, stage: stage.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buy() {
    track('purchase_click', { sku: sku.id, amount: sku.price, configured: isPaymentConfigured() });
    onPurchase();
  }

  return (
    <section className="paywall">
      <span className="newsbar">무료 결과</span>
      <h2 className="serif">"{q.label}"<br />— {nickname}에 대한 판독</h2>
      <p className="step-desc">숫자와 확인된 팩트는 무료야. 해석·이번 주 실험·지금 할 행동은 리포트에서.</p>

      <div className="numbers">
        <div className="num"><span>궁합 흐름</span><b>{compat.index}</b></div>
        <div className="num"><span>신호 지수</span><b>{selfReport.signalIndex}</b></div>
        <div className="num"><span>관계 단계</span><b className="stage">{stage.current}</b></div>
      </div>
      <p className="numbers-caption">{myArchetype} × {theirArchetype} · {selfReport.flags.length ? selfReport.flags.join(' · ') : '특이 플래그 없음'} · 단계는 관심 → 만남 → 관계 → 결단 순</p>

      <div className="preview">
        <b>확인된 팩트</b>
        <ul>
          {compat.facts.slice(0, 2).map((f) => <li key={f.key}>{f.title}<span className="lock">해석 잠김</span></li>)}
          {selfReport.facts.slice(0, 2).map((f) => <li key={f}>{f}<span className="lock">해석 잠김</span></li>)}
        </ul>
      </div>

      <div className="offer">
        <div className="offer-head">
          <span className="offer-name">{sku.name}</span>
          <span className="offer-price">{sku.list && <s>{formatWon(sku.list)}</s>}<b>{formatWon(sku.price)}</b><em>{PROMO.label}</em></span>
        </div>
        <p className="offer-blurb">{sku.blurb}</p>
        <ul className="offer-includes">
          {REPORT_SECTIONS.map((s) => (
            <li key={s.key}>
              {s.key === 'profile' ? <><b>{nickname}의 결 · {theirArchetype}</b> — {s.sub}</> : <><b>{s.title}</b> — {s.sub}</>}
            </li>
          ))}
          <li><b>영구 소장</b> — 발행함에서 언제든 다시 봐. 발행 후 24시간 환불 보장</li>
        </ul>
      </div>

      <ul className="policy">
        <li>{PROMO.label} — {PROMO.until}까지 · 이후 정가 {formatWon(sku.list ?? sku.price)} · 부가세 포함</li>
        <li>{DELIVERY_POLICY}</li>
        <li>{REFUND_POLICY} · 발행 전엔 전액 취소</li>
        <li>디지털 콘텐츠 특성상 발행 후 24시간이 지나면 청약철회가 제한돼 — <button className="link-btn" onClick={() => onLegal('refund')}>환불·청약철회 안내</button></li>
      </ul>
      <button className="btn-primary" onClick={buy}>전체 리포트 보기 · {formatWon(sku.price)}</button>
      {!isPaymentConfigured() && <p className="form-privacy">결제 연동 전 — 지금은 샘플 리포트로 구성을 먼저 보여줄게.</p>}
      {onSkip && <button className="btn-ghost center" onClick={() => { track('paywall_skip_to_card'); onSkip(); }}>리포트는 나중에 · 내 연애 스타일 카드만 무료로 받기</button>}
      <p className="form-privacy">{brand.masthead}는 확인된 것만 쓰고, 틀리면 [정정]으로 바로잡아.</p>
    </section>
  );
}
