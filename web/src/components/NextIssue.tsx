import { RefObject, useState } from 'react';
import type { Brand } from '../brand';
import { NOTIFY_URL } from '../brand';
import type { BirthInput } from '../saju/manse';
import { buildShareUrl } from '../share';
import { track } from '../track';

interface Props {
  brand: Brand;
  input: BirthInput;
  mbti: string;
  archetype: string;
  cardRef: RefObject<HTMLDivElement>;
  onReissue: () => void;
  onStartSku: () => void;
}

export default function NextIssue({ brand, input, mbti, archetype, cardRef, onReissue, onStartSku }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  async function saveImage() {
    if (!cardRef.current) return;
    track('card_saved', { archetype });
    setStatus('이미지 만드는 중…');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${brand.masthead}-1면.png`;
      a.click();
      setStatus('저장했어. 스토리에 올려봐.');
    } catch {
      setStatus('이미지 저장이 막힌 환경이야. 화면을 캡처해줘.');
    }
  }

  async function copyLink() {
    const url = buildShareUrl(input, mbti);
    track('link_copied', { archetype });
    try {
      await navigator.clipboard.writeText(url);
      setStatus('링크 복사됐어. 친구한테 보내면 걔 1면도 나와.');
    } catch {
      setStatus(url);
    }
  }

  function notify() {
    track('next_issue_cta', { archetype });
    window.open(NOTIFY_URL, '_blank', 'noopener');
  }

  return (
    <div className="next-block">
      <div className="actions">
        <button className="btn-secondary" onClick={saveImage}>이미지 저장</button>
        <button className="btn-secondary" onClick={copyLink}>링크 복사</button>
      </div>
      <button className="btn-ghost center" onClick={onReissue}>다른 생년월일로 다시 보기</button>
      {status && <p className="status">{status}</p>}

      <section className="teaser">
        <span className="newsbar">단독 · 다음 호</span>
        <h3 className="serif">이 사람과 나,<br />지금 무슨 사이</h3>
        <p>상대 생년월일만 있으면 돼. 지금 보이는 신호 3개, 가능한 해석 2개, 2주 안에 확인할 것 2개, 지금 할 행동 1개로 알려줘.</p>
        <button className="btn-primary" onClick={onStartSku}>걔 마음 무료로 확인하기</button>
        <button className="btn-ghost light" onClick={notify}>발행 알림만 받기</button>
      </section>
    </div>
  );
}
