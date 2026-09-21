import { useEffect, useState } from 'react';
import type { Brand } from '../brand';
import { listMyReports, nicknameOf, ReportListItem } from '../api';
import { QUESTIONS } from '../report/questions';

interface Props {
  brand: Brand;
  onOpen: (reportId: string) => void;
  onBack: () => void;
}

const STATUS_KO: Record<string, string> = {
  draft: '결제 대기', paid: '취재 대기', generating: '취재 중', review: '검수 중', published: '발행됨', viewed: '열람',
  cancelled: '취소', refunded: '환불', failed: '오류',
};

export default function MyReports({ brand, onOpen, onBack }: Props) {
  const [items, setItems] = useState<ReportListItem[] | null>(null);
  useEffect(() => { listMyReports().then(setItems); }, []);
  return (
    <section className="step-block">
      <span className="newsbar">발행함</span>
      <h2 className="serif">{brand.masthead} 아카이브</h2>
      <p className="step-desc">관계는 연재야. 발행된 리포트는 여기서 영구 소장.</p>
      {items === null && <p className="status">불러오는 중…</p>}
      {items && items.length === 0 && <p className="status">아직 발행된 리포트가 없어.</p>}
      <div className="options">
        {items?.map((r) => (
          <button key={r.id} className="option" onClick={() => onOpen(r.id)}>
            <b>{nicknameOf(r.subjects)} — {QUESTIONS.find((q) => q.key === r.question_key)?.label ?? r.question_key}</b>
            <span>{STATUS_KO[r.status] ?? r.status} · {new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
          </button>
        ))}
      </div>
      <button className="btn-ghost" onClick={onBack}>편집국으로</button>
    </section>
  );
}
