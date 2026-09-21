import { useEffect, useRef, useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { Brand } from '../brand';
import { api, OrderInput } from '../api';
import { isBackendConfigured } from '../lib/supabase';
import { SKUS, priceOf, formatWon, REFUND_POLICY } from '../payment';
import { getVariant, track } from '../track';

interface Props {
  brand: Brand;
  order: OrderInput;
  customerKey: string;
  customerEmail?: string;
  onBack: () => void;
  onLegal: (page: 'terms' | 'privacy' | 'refund') => void;
}

interface Widgets {
  setAmount: (a: { currency: 'KRW'; value: number }) => Promise<void>;
  renderPaymentMethods: (o: { selector: string; variantKey?: string }) => Promise<unknown>;
  renderAgreement: (o: { selector: string; variantKey?: string }) => Promise<unknown>;
  requestPayment: (o: Record<string, unknown>) => Promise<void>;
}

/** 토스페이먼츠 결제위젯 v2. 주문은 서버(create-order)가 만들고 금액도 서버가 확정한다. */
export default function Checkout({ brand, order, customerKey, customerEmail, onBack, onLegal }: Props) {
  const sku = SKUS[order.sku];
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(priceOf(order.sku));
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<Widgets | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 서버(Supabase)가 없으면 로컬 주문번호로 결제창만 연다 — PG 심사·결제 UX 확인용. 승인(confirm)은 서버 연동 후.
        const created = isBackendConfigured()
          ? await api.createOrder(order)
          : { orderId: `sb_local_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, amount: priceOf(order.sku), reportId: '' };
        if (cancelled) return;
        setOrderId(created.orderId);
        setAmount(created.amount);
        if (created.reportId) sessionStorage.setItem('sokboyeo.lastReport', created.reportId);
        const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string;
        const toss = await loadTossPayments(clientKey);
        const widgets = toss.widgets({ customerKey }) as unknown as Widgets;
        await widgets.setAmount({ currency: 'KRW', value: created.amount });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
        ]);
        widgetsRef.current = widgets;
        setReady(true);
        track('checkout_ready', { amount: created.amount, sku: order.sku });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pay() {
    if (!widgetsRef.current || !orderId || !agreed) return;
    track('payment_request', { amount, sku: order.sku });
    const base = `${window.location.origin}${window.location.pathname}?v=${getVariant()}`;
    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName: `${sku.name} — ${brand.masthead}`,
        successUrl: `${base}&pay=success`,
        failUrl: `${base}&pay=fail`,
        customerEmail,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="step-block checkout">
      <span className="newsbar">결제</span>
      <h2 className="serif">{sku.name}</h2>
      <div className="order-summary">
        <div><span>상품</span><b>{sku.name}</b></div>
        <div><span>구성</span><b>{sku.includes.slice(0, 3).join(' · ')}</b></div>
        <div><span>결제 금액</span><b>{formatWon(amount)} <small>(부가세 포함)</small></b></div>
        <div><span>제공 시점</span><b>결제 즉시 생성, 보통 1분 안에 발행</b></div>
      </div>
      <div id="payment-method" />
      <div id="agreement" />
      <label className="consent">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          구매 조건을 확인했고, 리포트는 결제 즉시 제공되는 디지털 콘텐츠라 제공 개시 후 청약철회가 제한된다는 점에 동의해. ({REFUND_POLICY})
          {' '}<button type="button" className="link-btn" onClick={() => onLegal('refund')}>환불·청약철회 안내</button> · <button type="button" className="link-btn" onClick={() => onLegal('terms')}>이용약관</button>
        </span>
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn-primary" disabled={!ready || !agreed} onClick={pay}>{ready ? `${formatWon(amount)} 결제하기` : '결제창 준비 중…'}</button>
      <button className="btn-ghost" onClick={onBack}>돌아가기</button>
    </section>
  );
}
