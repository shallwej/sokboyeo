import { forwardRef } from 'react';
import type { Brand } from '../brand';
import type { Chart } from '../saju/manse';
import type { FrontPage } from '../saju/archetypes';

interface Props {
  brand: Brand;
  chart: Chart;
  page: FrontPage;
  issueDate: string;
}

/** 내 연애 1면 — 위는 인스타 썸네일 문법의 정사각 커버(오행 컬러 필드 + 아키타입 헤드라인), 아래는 기사 본문. 통째로 이미지 저장된다. */
const FrontPageCard = forwardRef<HTMLDivElement, Props>(function FrontPageCard({ brand, chart, page, issueDate }, ref) {
  const a = page.archetype;
  const dominant = [...page.elementRows].sort((x, y) => y.pct - x.pct)[0].el;
  return (
    <div className="card-wrap">
      <div className="fp-card" ref={ref}>
        <div className={`cover cover-card el-${dominant}`}>
          <span className="cover-brand"><i>{brand.masthead[0]}</i>{brand.masthead}</span>
          <span className="cover-kicker">내 연애 스타일 · {issueDate}</span>
          <h2 className="cover-title">{a.name}</h2>
          <p className="cover-sub">"{a.tagline}"</p>
        </div>
        <div className="fp-body">
          <p className="fp-basis">일간 {page.dayGanLabel} · {a.metaphor}의 기운 · {page.basis}</p>

          <p className="fp-lede">{a.lede}</p>
          {page.elementNote && <p className="fp-lede fp-note">{page.elementNote}</p>}

          <div className="fp-chips">
            {a.keywords.map((k) => <span key={k}># {k}</span>)}
            {page.mbti && <span className="fp-chip-mbti">MBTI {page.mbti}</span>}
          </div>
          {page.mbtiNote && <p className="fp-lede fp-note"><b>MBTI 대조</b> {page.mbtiNote}</p>}

          <div className="fp-box">
            <b>흔들리는 순간</b>
            <p>{a.shaky}</p>
          </div>
          <div className="fp-box fp-box-red">
            <b>확인 취재 기준</b>
            <p>{a.criterion}</p>
          </div>

          <div className="fp-elements">
            {page.elementRows.map((r) => (
              <div key={r.el} className="fp-el">
                <span className="fp-el-label">{r.label}</span>
                <span className="fp-el-bar"><i style={{ width: `${Math.max(6, r.pct * 100)}%` }} /></span>
                <span className="fp-el-count">{r.count}</span>
              </div>
            ))}
            <div className="fp-el-caption">
              원국 {[chart.year, chart.month, chart.day, ...(chart.time ? [chart.time] : [])].map((p) => p.gan + p.zhi).join(' · ')}
            </div>
          </div>

          <div className="fp-footer">
            <span>나도 해보기 → {brand.domain}</span>
            <span>생년월일 하나로 · {brand.desk}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FrontPageCard;
