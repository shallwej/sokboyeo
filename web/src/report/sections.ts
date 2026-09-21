/** 전체 리포트에 들어있는 9가지 — 랜딩 그리드(9칸)·페이월 목록·리포트 섹션 앵커(data-sec)가 같은 표를 쓴다. */
export type SectionKey = 'stage' | 'profile' | 'compat' | 'signals' | 'facts' | 'interps' | 'experiment' | 'action' | 'messages' | 'policy';

export interface ReportSection {
  key: SectionKey;
  title: string;
  sub: string;
}

export const REPORT_SECTIONS: ReportSection[] = [
  { key: 'stage', title: '관계 단계 판정', sub: '지금 어디쯤인지 + 다음 단계로 가는 조건' },
  { key: 'profile', title: '걔의 결', sub: '관심 있을 때·없을 때 움직임, 통하는 접근' },
  { key: 'compat', title: '두 사람 원국 대조', sub: '합·충·기운 보완 전부' },
  { key: 'signals', title: '신호 분석표', sub: '요즘 상황 5개 각각의 읽기' },
  { key: 'facts', title: '확인된 팩트 3', sub: '요즘 상황 2 + 원국 1' },
  { key: 'interps', title: '가능한 해석 2', sub: '각각의 근거와 가능성' },
  { key: 'experiment', title: '이번 주 실험 1', sub: '결과를 넣으면 [속보]/[정정]으로 판정 갱신' },
  { key: 'action', title: '할 것 · 하지 말 것', sub: '타이밍까지' },
  { key: 'messages', title: '보낼 문장', sub: '보내도 되는 문장 / 안 되는 문장' },
];
