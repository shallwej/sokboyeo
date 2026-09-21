import { useEffect, useState } from 'react';
import type { Brand } from '../brand';
import { ExperimentResult, ReportContent, experimentUpdate } from '../report/schema';
import { ReportContext, STAGE_ROADMAP, THEIR_PROFILE, APPROACH, QUESTION_FOCUS, signalRows } from '../report/enrich';
import { RELATION_KO } from '../saju/compat';
import { SKUS, formatWon } from '../payment';
import { track } from '../track';

interface Props {
  brand: Brand;
  content: ReportContent;
  /** 결정론 섹션(상대의 결·원국 대조·신호 분석표) 문맥. 없으면 기사 본문만 */
  context: ReportContext | null;
  /** 열릴 때 바로 스크롤할 섹션 (랜딩 타일 → 샘플의 해당 부분) */
  anchor?: string | null;
  nickname: string;
  issueDate: string;
  demo: boolean;
  experimentResult: ExperimentResult | null;
  onExperimentResult: (r: ExperimentResult) => void | Promise<void>;
  onFeedback?: (v: number) => void;
  onRefund?: () => void;
  onBack: () => void;
}

export default function ReportView({ brand, content, context, anchor, nickname, issueDate, demo, experimentResult, onExperimentResult, onFeedback, onRefund, onBack }: Props) {
  const [fb, setFb] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextNotice, setNextNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!anchor) return;
    const el = document.querySelector(`[data-sec="${anchor}"]`);
    if (!el) return;
    const t = window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => window.clearTimeout(t);
  }, [anchor]);

  function nextSku(id: 'deep' | 'tarot' | 'question') {
    track('next_sku_click', { sku: id, available: SKUS[id].available, demo });
    if (!SKUS[id].available) {
      const name = SKUS[id].name;
      const last = name.charCodeAt(name.length - 1);
      const particle = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? '은' : '는';
      setNextNotice(`${name}${particle} 곧 열려. 열리면 발행함에서 알려줄게.`);
    }
  }

  function feedback(v: number) {
    setFb(v);
    track('report_feedback', { value: v, demo });
    onFeedback?.(v);
  }

  async function result(r: ExperimentResult) {
    setBusy(true);
    track('experiment_result', { value: r, demo });
    try { await onExperimentResult(r); } finally { setBusy(false); }
  }

  const sub = (s: string) => (nickname === '걔' ? s : s.replaceAll('상대', nickname));
  const exp = content.experiment;
  const update = experimentResult ? experimentUpdate(exp, experimentResult) : null;
  const roadmap = STAGE_ROADMAP[content.stage.current];
  const rows = context ? signalRows(context.selfAnswers, context.question) : [];
  const focus = context ? QUESTION_FOCUS[context.question] : null;
  const them = context?.theirArchetype ?? null;

  return (
    <article className="report">
      <header className="topbar">
        <span className="lockup serif"><span className="bracket">「</span>{brand.masthead}<span className="bracket">」</span></span>
        <span className="lockup-sub">{brand.sub}</span>
        <button className="btn-ghost right" onClick={onBack}>편집국으로</button>
      </header>
      {demo && <div className="shared-banner">샘플 리포트야. {nickname}의 결·원국 대조·신호 분석표는 네 입력으로 계산했고, 기사 본문(판정·해석·실험)은 결제 후 네 제보로 새로 취재해.</div>}

      {/* 매거진 커버: 컬러 필드 + 브랜드 마크 + 헤드라인 → 바이라인 → 데크 */}
      <div className="cover cover-report">
        <span className="cover-brand"><i>{brand.masthead[0]}</i>{brand.masthead}</span>
        <span className="cover-kicker">Exclusive · 관계 리포트</span>
        <h1 className="cover-title">{sub(content.headline)}</h1>
      </div>
      <div className="r-byline"><span>{brand.desk}</span><span>{issueDate}</span><span>{nickname} 단독 취재</span></div>
      <p className="r-lede">{sub(content.lede)}</p>

      <section className="r-box r-stage" data-sec="stage">
        <b>관계 단계 판정</b>
        <div className="r-stage-row">
          {(['관심', '만남', '관계', '결단'] as const).map((s) => <span key={s} className={s === content.stage.current ? 'on' : ''}>{s}</span>)}
          {content.stage.current === '정리' && <span className="on">정리</span>}
        </div>
        <p>{sub(content.stage.note)}</p>
        <div className="r-roadmap">
          <div><span>지금</span> {roadmap.desc}</div>
          <div><span>다음 · {roadmap.next}</span> {sub(roadmap.condition)}</div>
        </div>
      </section>

      {context && them && (
        <>
          <h2 className="r-h2 serif" data-sec="profile">{nickname}의 결</h2>
          <section className="r-profile">
            <div>
              <div className="r-name serif">{them.name}</div>
              <div className="r-tag">일간 {them.gan} · {them.metaphor} — {them.tagline}</div>
            </div>
            <div className="r-chips">{them.keywords.map((k) => <span key={k}>{k}</span>)}</div>
            <div className="r-onoff">
              <div className="on"><span>관심 있으면</span>{sub(THEIR_PROFILE[them.gan].on)}</div>
              <div className="off"><span>관심 없으면</span>{sub(THEIR_PROFILE[them.gan].off)}</div>
            </div>
            <p className="r-approach"><b>통하는 접근</b> {APPROACH[them.gan]}</p>
            <p className="r-me">너는 {context.myArchetype.name}({context.myArchetype.gan}). {context.myArchetype.criterion}</p>
          </section>

          <h2 className="r-h2 serif" data-sec="compat">두 사람의 원국 대조</h2>
          <section className="r-box r-compat">
            <div className="r-compat-head">
              <b>{context.compat.index}</b>
              <span>궁합 흐름 지수 · {RELATION_KO[context.compat.relation].label}</span>
            </div>
            <ul>
              {context.compat.facts.map((f) => (
                <li key={f.key} className={f.delta < 0 ? 'minus' : ''}>
                  <b>{f.title}{f.delta < 0 ? ' · 주의' : ''}</b>
                  <p>{sub(f.detail)}</p>
                </li>
              ))}
            </ul>
            <p className="r-me">점수가 아니라 흐름의 방향이야. 아래 제보 신호가 이 흐름을 실제로 확인해 주는지 봐.</p>
          </section>

          <h2 className="r-h2 serif" data-sec="signals">신호 분석표</h2>
          <div className="r-compat-head">
            <b>{context.signalIndex}</b>
            <span>신호 지수 · {context.flags.length ? context.flags.join(' · ') : '특이 플래그 없음'}</span>
          </div>
          <div className="r-table">
            {rows.map((r) => (
              <div key={r.key} className={r.focus ? 'r-row focus' : 'r-row'}>
                <div className="r-row-head"><span>{r.label}</span>{r.focus && <em>이 질문의 핵심 증거</em>}</div>
                <b>{r.answer}</b>
                <p>{sub(r.reading)}</p>
              </div>
            ))}
          </div>
          {focus && <p className="r-rule">{sub(focus.rule)}</p>}
        </>
      )}

      <h2 className="r-h2 serif" data-sec="facts">확인된 팩트 {content.facts.length}</h2>
      {content.facts.map((f, i) => (
        <section key={i} className="r-fact">
          <span className={`src ${f.source}`}>{f.source === 'saju' ? '원국' : '제보'}</span>
          <b>{i + 1}. {sub(f.title)}</b>
          <p>{sub(f.detail)}</p>
        </section>
      ))}

      <h2 className="r-h2 serif" data-sec="interps">가능한 해석 {content.interpretations.length}</h2>
      {content.interpretations.map((it, i) => (
        <section key={i} className="r-fact">
          <span className={`lik ${it.likelihood}`}>가능성 {it.likelihood}</span>
          <b>{sub(it.title)}</b>
          <p>{sub(it.detail)}</p>
        </section>
      ))}

      <h2 className="r-h2 serif" data-sec="experiment">이번 주 실험 1</h2>
      <section className="r-exp">
        <span className="newsbar">{exp.days}일 실험</span>
        <b>{sub(exp.title)}</b>
        <p>{sub(exp.how)}</p>
        <div className="r-evidence">
          <div><span>A · 이러면</span>{sub(exp.ifA)}</div>
          <div><span>B · 이러면</span>{sub(exp.ifB)}</div>
        </div>
        {!update ? (
          <div className="r-result">
            <b>{exp.days}일 뒤, 결과를 알려줘</b>
            <div className="r-result-btns">
              <button className="btn-secondary" disabled={busy} onClick={() => result('A')}>A · 반응 왔어</button>
              <button className="btn-secondary" disabled={busy} onClick={() => result('B')}>B · 안 왔어</button>
              <button className="btn-ghost" disabled={busy} onClick={() => result('C')}>애매해</button>
            </div>
          </div>
        ) : (
          <div className={`r-update ${update.tag === '정정' ? 'fix' : ''}`}>
            <span className="newsbar">{update.tag}</span>
            <p>{sub(update.text)}</p>
          </div>
        )}
      </section>

      <section className="r-box r-action" data-sec="action">
        <b>전망 · 지금 할 행동</b>
        <p><span className="do">할 것</span>{sub(content.action.do)}</p>
        <p><span className="dont">하지 말 것</span>{sub(content.action.dont)}</p>
        <p><span className="when">타이밍</span>{sub(content.action.timing)}</p>
      </section>

      {content.messages && (
        <>
          <h2 className="r-h2 serif" data-sec="messages">보낼 문장</h2>
          <section className="r-msg">
            <div className="ok"><span>보내도 되는 문장</span>{sub(content.messages.ok)}</div>
            <div className="not"><span>보내면 안 되는 문장</span>{sub(content.messages.not)}</div>
            <p className="why">{sub(content.messages.why)}</p>
          </section>
        </>
      )}

      <p className="r-policy" data-sec="policy">{content.correctionPolicy}</p>

      <section className="r-feedback">
        <b>근거가 충분했어?</b>
        {fb === null ? (
          <div className="row">
            <button className="btn-secondary" onClick={() => feedback(1)}>충분했어</button>
            <button className="btn-secondary" onClick={() => feedback(0)}>부족했어</button>
          </div>
        ) : (
          <p className="status">{fb === 1 ? '기록했어. 실험 결과도 알려줘 — [속보]나 [정정]으로 이어갈게.' : '기록했어. 어디가 부족했는지는 다음 호에서 보강할게.'}</p>
        )}
        {fb === 0 && onRefund && !demo && <button className="btn-ghost light" onClick={onRefund}>근거가 없었어? 발행 후 24시간 안에 환불 요청</button>}
      </section>

      <h2 className="r-h2 serif">다음 취재</h2>
      <div className="r-next">
        <button className="r-next-item deep" onClick={() => nextSku('deep')}>
          <span className="newsbar">심층</span>
          <b>{SKUS.deep.name} · {formatWon(SKUS.deep.price)}</b>
          <p>{SKUS.deep.blurb}. {SKUS.deep.includes[SKUS.deep.includes.length - 1]}.</p>
          {!SKUS.deep.available && <em>곧 열려요</em>}
        </button>
        <div className="r-next-row">
          <button className="r-next-item" onClick={() => nextSku('question')}>
            <b>{SKUS.question.name} · {formatWon(SKUS.question.price)}</b>
            <p>{SKUS.question.blurb}</p>
            {!SKUS.question.available && <em>곧 열려요</em>}
          </button>
          <button className="r-next-item" onClick={() => nextSku('tarot')}>
            <b>{SKUS.tarot.name} · {formatWon(SKUS.tarot.price)}</b>
            <p>{SKUS.tarot.blurb}</p>
            {!SKUS.tarot.available && <em>곧 열려요</em>}
          </button>
        </div>
        {nextNotice && <p className="status">{nextNotice}</p>}
      </div>
    </article>
  );
}
