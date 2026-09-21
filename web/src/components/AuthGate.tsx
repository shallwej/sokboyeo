import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';
import { track } from '../track';

interface Props {
  reason: string;
  onDone: () => void;
  onCancel: () => void;
  onLegal: (page: 'terms' | 'privacy' | 'refund') => void;
}

/** 이메일 OTP 로그인 — 결제·영구 소장·발행 알림에 필요한 최소 인증. 카카오 로그인은 후속. */
export default function AuthGate({ reason, onDone, onCancel, onLegal }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !consent) return;
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSent(true);
    track('auth_code_sent');
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) { setError('코드가 맞지 않아. 메일을 다시 확인해줘.'); return; }
    track('auth_done');
    onDone();
  }

  return (
    <section className="step-block auth">
      <span className="newsbar">구독자 확인</span>
      <h2 className="serif">이메일 하나만</h2>
      <p className="step-desc">{reason} 리포트는 이 이메일로 영구 소장되고, 발행되면 알려줄게.</p>
      {!sent ? (
        <form onSubmit={send}>
          <input className="text" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              [필수] 개인정보 수집·이용에 동의해 — 이메일(계정·발행 안내), 생년월일과 관계 신호(리포트 생성), 상대방 호칭·생년월일(리포트 생성). 리포트 생성을 위해 계산 결과가 국외 처리자(Anthropic)에 전송돼.
              {' '}<button type="button" className="link-btn" onClick={() => onLegal('privacy')}>개인정보처리방침</button> · <button type="button" className="link-btn" onClick={() => onLegal('terms')}>이용약관</button>
            </span>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" disabled={busy || !consent}>인증 코드 받기</button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="form-privacy">{email}로 코드를 보냈어. 메일의 6자리 코드를 넣거나 링크를 눌러줘.</p>
          <input className="text" inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6자리 코드" />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" disabled={busy}>확인</button>
        </form>
      )}
      <button className="btn-ghost" onClick={onCancel}>돌아가기</button>
    </section>
  );
}
