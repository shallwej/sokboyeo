import { useEffect, useState } from 'react';
import type { Brand } from '../brand';
import { api, AdminReport, nicknameOf } from '../api';
import type { ReportContent } from '../report/schema';
import ReportView from './ReportView';

interface Props {
  brand: Brand;
  issueDate: string;
  onBack: () => void;
}

/** 데스크(검수) 화면 — ADMIN_EMAILS에 있는 계정만 서버가 허용한다. */
export default function Admin({ brand, issueDate, onBack }: Props) {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [open, setOpen] = useState<AdminReport | null>(null);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try { const r = await api.admin.list(); setItems(r.reports); } catch (e) { setMsg((e as Error).message); }
  }
  useEffect(() => { load(); }, []);

  function select(r: AdminReport) {
    setOpen(r);
    setDraft(r.content ? JSON.stringify(r.content, null, 2) : '');
    setMsg(null);
  }

  async function publish() {
    if (!open) return;
    let content: ReportContent | undefined;
    try { content = draft ? (JSON.parse(draft) as ReportContent) : undefined; } catch { setMsg('본문 JSON이 깨졌어'); return; }
    try { await api.admin.publish(open.id, content); setMsg('발행했어'); setOpen(null); load(); } catch (e) { setMsg((e as Error).message); }
  }
  async function regenerate() { if (!open) return; try { await api.admin.regenerate(open.id); setMsg('다시 취재 중'); load(); } catch (e) { setMsg((e as Error).message); } }
  async function refund() { if (!open || !window.confirm('환불할까?')) return; try { await api.admin.refund(open.id); setMsg('환불했어'); setOpen(null); load(); } catch (e) { setMsg((e as Error).message); } }

  let parsed: ReportContent | null = null;
  try { parsed = draft ? (JSON.parse(draft) as ReportContent) : null; } catch { parsed = null; }

  return (
    <section className="step-block admin">
      <span className="newsbar">데스크</span>
      <h2 className="serif">검수 큐</h2>
      {msg && <p className="status">{msg}</p>}
      {!open && (
        <div className="options">
          {items.map((r) => (
            <button key={r.id} className="option" onClick={() => select(r)}>
              <b>[{r.status}] {nicknameOf(r.subjects)} · {r.question_key}</b>
              <span>궁합 {r.compat?.index} · 신호 {r.self_report?.signalIndex} · {new Date(r.created_at).toLocaleString('ko-KR')}</span>
            </button>
          ))}
          {items.length === 0 && <p className="status">큐가 비었어.</p>}
        </div>
      )}
      {open && (
        <div>
          <p className="step-desc">제보 팩트: {open.self_report?.facts?.join(' / ')}</p>
          <p className="step-desc">원국 팩트: {open.compat?.facts?.map((f) => f.title).join(' / ')}</p>
          <textarea className="text json" rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="생성된 본문 JSON (수정 가능)" />
          <div className="actions">
            <button className="btn-primary" onClick={publish}>발행</button>
            <button className="btn-secondary" onClick={regenerate}>다시 취재</button>
            <button className="btn-secondary" onClick={refund}>환불</button>
            <button className="btn-ghost" onClick={() => setOpen(null)}>목록</button>
          </div>
          {parsed && <ReportView brand={brand} content={parsed} context={null} nickname={nicknameOf(open.subjects)} issueDate={issueDate} demo={false} experimentResult={null} onExperimentResult={() => undefined} onBack={() => setOpen(null)} />}
        </div>
      )}
      <button className="btn-ghost" onClick={onBack}>편집국으로</button>
    </section>
  );
}
