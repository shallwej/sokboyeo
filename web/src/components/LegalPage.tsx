import type { Brand } from '../brand';
import { BUSINESS, LEGAL_TEXT, LEGAL_TITLES, LegalPageKey, show } from '../legal';

interface Props {
  brand: Brand;
  page: LegalPageKey;
  onBack: () => void;
}

export default function LegalPage({ brand, page, onBack }: Props) {
  const sections = LEGAL_TEXT[page];
  return (
    <article className="legal">
      <header className="topbar">
        <span className="lockup serif"><span className="bracket">「</span>{brand.masthead}<span className="bracket">」</span></span>
        <span className="lockup-sub">{brand.sub}</span>
        <button className="btn-ghost right" onClick={onBack}>돌아가기</button>
      </header>
      <h1 className="legal-title serif">{LEGAL_TITLES[page]}</h1>
      {sections.map((s) => (
        <section key={s.title} className="legal-section">
          <h2>{s.title}</h2>
          {s.paras.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      ))}
      <section className="legal-section biz">
        <h2>사업자 정보</h2>
        <dl>
          <dt>상호</dt><dd>{show(BUSINESS.company)}</dd>
          <dt>대표자</dt><dd>{show(BUSINESS.ceo)}</dd>
          <dt>사업자등록번호</dt><dd>{show(BUSINESS.bizNo)}</dd>
          <dt>통신판매업신고</dt><dd>{show(BUSINESS.mailOrderNo)}</dd>
          <dt>주소</dt><dd>{show(BUSINESS.address)}</dd>
          <dt>고객센터</dt><dd>{show(BUSINESS.phone)} · {show(BUSINESS.email)}</dd>
          <dt>개인정보 보호책임자</dt><dd>{show(BUSINESS.privacyOfficer)}</dd>
          <dt>결제대행</dt><dd>{BUSINESS.pg}</dd>
          <dt>호스팅</dt><dd>{BUSINESS.hosting}</dd>
        </dl>
      </section>
    </article>
  );
}
