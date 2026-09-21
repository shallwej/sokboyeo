import { useEffect, useState } from 'react';
import type { Brand } from '../brand';
import { api, ReportRow } from '../api';
import { track } from '../track';

interface Props {
  brand: Brand;
  reportId: string;
  /** 결제 리다이렉트 직후라면 confirm 파라미터를 먼저 처리한다 */
  confirm?: { paymentKey: string; orderId: string; amount: number } | null;
  onReady: (report: ReportRow) => void;
  onBack: () => void;
}

const LABEL: Record<string, string> = {
  paid: '결제 확인 — 취재 시작',
  generating: '취재 중 — 보통 1분 안에 발행돼',
  review: '데스크 확인 중 — 곧 발행돼',
  failed: '생성에 문제가 생겼어 — 운영자가 확인 중이야',
  refunded: '취소·환불 완료',
  cancelled: '취소됨',
  draft: '결제 대기',
};

export default function Pending({ brand, reportId, confirm, onReady, onBack }: Props) {
  const [status, setStatus] = useState<string>(confirm ? 'confirming' : 'paid');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer: number | undefined;
    async function poll() {
      try {
        const r = await api.getReport(reportId);
        if (stop) return;
        setStatus(r.status);
        if (r.status === 'viewed' && r.content) { onReady(r); return; }
        if (['refunded', 'cancelled', 'failed'].includes(r.status)) return;
        timer = window.setTimeout(poll, 4000);
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
    }
    (async () => {
      if (confirm) {
        try {
          const res = await api.confirmPayment(confirm);
          track('payment_success', { amount: confirm.amount });
          setStatus(res.status);
        } catch (e) {
          track('payment_fail');
          setError((e as Error).message);
          return;
        }
      }
      poll();
    })();
    return () => { stop = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  async function cancel() {
    if (!window.confirm('열람 전 전액 취소할까? 취재는 중단돼.')) return;
    setBusy(true);
    try {
      await api.cancelOrder(reportId);
      track('order_cancelled');
      setStatus('refunded');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cancellable = ['paid', 'generating', 'review'].includes(status);
  return (
    <section className="step-block pending">
      <span className="newsbar">발행 대기</span>
      <h2 className="serif">{status === 'confirming' ? '결제 확인 중…' : '취재가 진행 중이야'}</h2>
      <p className="step-desc">{LABEL[status] ?? '확인 중…'}</p>
      <div className="progress"><i style={{ width: status === 'review' ? '80%' : status === 'generating' ? '55%' : '25%' }} /></div>
      <p className="form-privacy">이 화면을 닫아도 돼. 발행되면 {brand.masthead} 발행함에서 볼 수 있어. 발행 후 24시간 안에 근거가 부족하면 환불돼.</p>
      {error && <p className="error">{error}</p>}
      {cancellable && <button className="btn-secondary" disabled={busy} onClick={cancel}>열람 전 전액 취소</button>}
      <button className="btn-ghost" onClick={onBack}>편집국으로</button>
    </section>
  );
}
