const BASE = 'https://api.tosspayments.com/v1';

function authHeader(): string {
  const key = Deno.env.get('TOSS_SECRET_KEY');
  if (!key) throw new Error('TOSS_SECRET_KEY 미설정');
  return 'Basic ' + btoa(`${key}:`);
}

export async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
  const res = await fetch(`${BASE}/payments/confirm`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.message ?? `toss confirm ${res.status}`);
  return body;
}

export async function cancelPayment(paymentKey: string, cancelReason: string) {
  const res = await fetch(`${BASE}/payments/${encodeURIComponent(paymentKey)}/cancel`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelReason }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.message ?? `toss cancel ${res.status}`);
  return body;
}
