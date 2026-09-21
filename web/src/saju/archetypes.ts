import { Chart, Element, ELEMENT_KO, ELEMENT_ORDER, Gan, GAN_KO } from './manse';

export interface Archetype {
  gan: Gan;
  name: string;
  tagline: string;
  metaphor: string;
  lede: string;
  keywords: [string, string, string];
  shaky: string;
  criterion: string;
}

/**
 * 일간(日干) 10종 → 연애 스타일 아키타입. v0 초안 — 명리 자문 검수 전.
 * 화법: 헤드라인은 짧게, 본문은 용어를 쓰되 즉시 일상어로 번역, 단정 대신 '흔들리는 순간'과 '확인 기준'.
 */
export const ARCHETYPES: Record<Gan, Archetype> = {
  甲: {
    gan: '甲',
    name: '직진 속보형',
    tagline: '먼저 보도하고, 후회는 나중에',
    metaphor: '큰 나무',
    lede: '일간이 갑목(甲木)이야. 큰 나무처럼 곧게 자라는 기운이라, 마음이 생기면 돌려 말하기보다 먼저 움직여. 다가가는 속도는 빠른데 한 번 정한 방향을 잘 못 바꿔서, 상대가 애매하게 굴면 답답함부터 올라와.',
    keywords: ['먼저 다가감', '직진', '방향 고정'],
    shaky: '상대가 재는 게 느껴질 때. 밀당이 아니라 "왜 확실히 안 해?"로 읽혀서 조급해져.',
    criterion: '네가 먼저 간 횟수 말고, 상대가 스스로 만든 약속이 있는지를 봐.',
  },
  乙: {
    gan: '乙',
    name: '장기 연재형',
    tagline: '휘어져도 안 끊긴다',
    metaphor: '풀과 덩굴',
    lede: '일간이 을목(乙木)이야. 풀과 덩굴처럼 상황에 맞춰 휘어지는 기운이라, 상대에게 맞춰주면서 관계를 오래 이어가. 부딪히기보다 스며드는 쪽이고, 그래서 정작 내 마음은 늦게 말해.',
    keywords: ['맞춰줌', '지속', '늦은 고백'],
    shaky: '맞춰주기만 하다가 "나는 뭐지?" 싶어질 때. 서운함이 쌓여도 말 대신 거리로 표현해.',
    criterion: '상대가 네 편의를 봐주는 장면이 있는지를 봐. 맞춰주는 게 한쪽뿐이면 연재가 아니라 연장이야.',
  },
  丙: {
    gan: '丙',
    name: '1면 톱기사형',
    tagline: '숨길 수가 없는 마음',
    metaphor: '태양',
    lede: '일간이 병화(丙火)야. 태양처럼 환하게 드러나는 기운이라, 좋아하면 표정·말·연락에서 다 티가 나. 관계를 밝게 데우는 힘이 크지만 식는 것도 똑같이 티가 나서, 상대가 온도차를 먼저 눈치채.',
    keywords: ['표현 빠름', '밝음', '온도차 노출'],
    shaky: '내 열기만큼 안 돌아올 때. 리액션이 미지근하면 "관심 없나" 단정이 빨라져.',
    criterion: '상대의 표현 크기 말고 꾸준함을 봐. 조용한 사람의 일정한 연락이 큰 리액션보다 신호야.',
  },
  丁: {
    gan: '丁',
    name: '심야 편집형',
    tagline: '겉은 잔잔, 속은 오래 탄다',
    metaphor: '촛불',
    lede: '일간이 정화(丁火)야. 촛불처럼 작지만 오래 타는 기운이라, 겉으론 차분해 보여도 한 사람을 오래 깊게 생각해. 밤에 대화창을 다시 읽는 건 이 유형의 습관이야.',
    keywords: ['깊은 몰입', '섬세', '혼자 복기'],
    shaky: '상대의 작은 말투 변화. 사소한 단서 하나로 밤새 시나리오를 쓰게 돼.',
    criterion: '문장 하나 말고 2주 동안의 흐름을 봐. 단서 하나로 기사 쓰지 말고, 세 개 모은 뒤에 판단해.',
  },
  戊: {
    gan: '戊',
    name: '데스크형',
    tagline: '말보다 곁, 티는 안 냄',
    metaphor: '산',
    lede: '일간이 무토(戊土)야. 산처럼 묵직하고 잘 안 움직이는 기운이라, 좋아해도 표현이 느리고 대신 곁에 있는 걸로 말해. 안정감은 최고인데, 상대는 "이 사람 나한테 관심 있나?"를 한참 헷갈려.',
    keywords: ['안정', '느린 표현', '묵묵함'],
    shaky: '상대가 빠른 확답을 원할 때. 재촉당하면 오히려 더 굳어버려.',
    criterion: '네 표현이 전달됐는지를 봐. 곁에 있는 건 너만 아는 신호일 수 있어 — 상대가 그걸 관심으로 읽었는지 확인해.',
  },
  己: {
    gan: '己',
    name: '정정보도형',
    tagline: '다 받아주다가, 기준이 나오면 확실히',
    metaphor: '밭',
    lede: '일간이 기토(己土)야. 밭처럼 무엇이든 받아 키우는 기운이라, 상대를 잘 챙기고 현실적으로 관계를 가꿔. 대신 참을 만큼 참다가 기준을 넘는 순간 정정보도처럼 단호해져서, 상대는 갑작스럽다고 느껴.',
    keywords: ['챙김', '현실감각', '임계점'],
    shaky: '내 노력이 당연해질 때. 챙김이 기본값이 되면 서운함이 한 번에 터져.',
    criterion: '상대가 네 챙김을 알아채고 되돌려주는지를 봐. 되돌아오는 게 없으면 밭이 아니라 창고야.',
  },
  庚: {
    gan: '庚',
    name: '단독 확인형',
    tagline: '애매하면 바로 팩트체크',
    metaphor: '바위와 쇠',
    lede: '일간이 경금(庚金)이야. 바위와 쇠처럼 단단하고 직설적인 기운이라, 애매한 관계를 못 견디고 결론을 빨리 내려. 의리와 결단은 강한데, 상대의 "조금만 더 두고 보자"를 회피로 읽기 쉬워.',
    keywords: ['직설', '결단', '애매함 불허'],
    shaky: '상대가 답을 미룰 때. 기다림 자체가 손해로 느껴져서 먼저 끊어버릴 수 있어.',
    criterion: '상대가 느린 건지 마음이 없는 건지 구분해. "언제 볼까?"에 날짜가 나오면 느린 거고, 안 나오면 없는 거야.',
  },
  辛: {
    gan: '辛',
    name: '팩트체크형',
    tagline: '티 안 나게 다 재는 중',
    metaphor: '보석',
    lede: '일간이 신금(辛金)이야. 보석처럼 섬세하고 예민한 기운이라, 상대의 말과 태도를 하나하나 재고 기억해. 인정받는 느낌에 약하고 무심한 한마디에 오래 상처받는데, 겉으론 아무렇지 않은 척해.',
    keywords: ['섬세', '기억력', '인정 욕구'],
    shaky: '상대가 무심할 때. 상처는 속에 쌓이고 겉으로는 더 차가워져서 오해가 커져.',
    criterion: '네가 잰 항목들을 상대도 아는지 봐. 말 안 한 서운함은 상대에겐 존재하지 않는 기사야.',
  },
  壬: {
    gan: '壬',
    name: '늦게 터지는 특종형',
    tagline: '판이 다 깔린 뒤에야 확신',
    metaphor: '바다',
    lede: '일간이 임수(壬水)야. 바다처럼 깊고 넓은 기운이라, 상대의 말보다 분위기와 흐름을 읽어. 신호는 다 보는데 확신이 설 때까지 결론을 미뤄서, 좋아하는 티는 내면서도 정작 결정적인 말은 늦게 해.',
    keywords: ['흐름 읽기', '확신 필요', '늦은 결론'],
    shaky: '상대가 밀지도 당기지도 않을 때. 해석만 많아지고 결론은 더 멀어져.',
    criterion: '말보다 행동. 단둘이 보자는 제안이 상대 쪽에서도 나오는지를 봐.',
  },
  癸: {
    gan: '癸',
    name: '취재수첩형',
    tagline: '조용히 다 적어두는 중',
    metaphor: '이슬비',
    lede: '일간이 계수(癸水)야. 이슬비처럼 조용히 스며드는 기운이라, 눈치가 빠르고 상대의 기분을 먼저 살펴. 내 감정은 수첩에 적듯 속으로만 정리하고, 상대가 먼저 알아봐 주길 기다리는 편이야.',
    keywords: ['눈치', '내향', '기다림'],
    shaky: '상대가 둔할 때. 내 신호를 못 읽는 게 "관심 없음"으로 느껴져 혼자 정리해버려.',
    criterion: '상대가 못 읽은 건지 안 읽은 건지 확인해. 한 번은 수첩 말고 입으로 말한 뒤에 반응을 봐.',
  },
};

const EXCESS_NOTE: Record<Element, string> = {
  木: '목(木) 기운이 강해서, 마음이 생기면 대화와 반응으로 관계를 키우려는 힘이 세.',
  火: '화(火) 기운이 강해서, 표현이 빠르고 식는 것도 빨리 드러나.',
  土: '토(土) 기운이 강해서, 안정이 확인되기 전엔 잘 안 움직여.',
  金: '금(金) 기운이 강해서, 기준이 분명하고 애매한 상태를 오래 못 견뎌.',
  水: '수(水) 기운이 강해서, 상대 말 하나에 해석이 여러 갈래로 늘어나.',
};

const LACK_NOTE: Record<Element, string> = {
  木: '목(木) 기운은 비어 있어서, 먼저 다가가는 힘은 약한 편이야.',
  火: '화(火) 기운이 비어 있어서, 마음이 있어도 표현이 잘 안 나가.',
  土: '토(土) 기운이 비어 있어서, 관계가 흔들릴 때 중심을 잡기 어려워.',
  金: '금(金) 기운이 비어 있어서, 아닌 관계에 선 긋기가 어려워.',
  水: '수(水) 기운이 비어 있어서, 상대 마음 읽기보다 내 감정이 앞서.',
};

export interface FrontPage {
  archetype: Archetype;
  dayGanLabel: string;
  basis: string;
  elementNote: string | null;
  excess: Element | null;
  lack: Element | null;
  elementRows: { el: Element; label: string; count: number; pct: number }[];
  mbti: string | null;
  mbtiNote: string | null;
}

export const EXCESS_THRESHOLD = 0.375;

export function buildFrontPage(chart: Chart, mbti = ''): FrontPage {
  const cmp = mbti ? compareMbti(chart.dayGan, mbti) : null;
  const archetype = ARCHETYPES[chart.dayGan];
  const rows = ELEMENT_ORDER.map((el) => ({
    el,
    label: ELEMENT_KO[el],
    count: chart.elements[el],
    pct: chart.elements[el] / chart.total,
  }));

  const strongest = [...rows].sort((a, b) => b.pct - a.pct)[0];
  const excess = strongest.pct >= EXCESS_THRESHOLD ? strongest.el : null;
  const lackRow = rows.find((r) => r.count === 0);
  const lack = lackRow ? lackRow.el : null;

  const notes: string[] = [];
  if (excess) notes.push(EXCESS_NOTE[excess]);
  if (lack) notes.push(LACK_NOTE[lack]);

  return {
    archetype,
    dayGanLabel: `${GAN_KO[chart.dayGan]}(${chart.dayGan})`,
    basis: chart.hasTime ? '사주(四柱) 기준' : '삼주(三柱) 기준 · 태어난 시간 미입력',
    elementNote: notes.length ? notes.join(' ') : null,
    excess,
    lack,
    elementRows: rows,
    mbti: cmp ? mbti.toUpperCase() : null,
    mbtiNote: cmp ? cmp.note : null,
  };
}

/** MBTI 대조 — MBTI는 '네가 고른 너', 사주는 '타고난 결'. 맞다/틀리다가 아니라 겹침/차이로 읽는다. I/E · F/T · J/P 세 축만 본다. */
export const MBTI_TYPES = ['INFP', 'INFJ', 'INTP', 'INTJ', 'ISFP', 'ISFJ', 'ISTP', 'ISTJ', 'ENFP', 'ENFJ', 'ENTP', 'ENTJ', 'ESFP', 'ESFJ', 'ESTP', 'ESTJ'];

const MBTI_LEAN: Record<Gan, [string, string, string]> = {
  甲: ['E', 'T', 'J'], 乙: ['I', 'F', 'P'], 丙: ['E', 'F', 'P'], 丁: ['I', 'F', 'J'], 戊: ['I', 'T', 'J'],
  己: ['E', 'F', 'J'], 庚: ['E', 'T', 'J'], 辛: ['I', 'F', 'J'], 壬: ['I', 'F', 'P'], 癸: ['I', 'F', 'P'],
};
const AXIS_KO = ['I/E', 'F/T', 'J/P'];

export function compareMbti(gan: Gan, mbti: string): { overlap: number; note: string } | null {
  const m = mbti.toUpperCase();
  if (!MBTI_TYPES.includes(m)) return null;
  const mine = [m[0], m[2], m[3]];
  const lean = MBTI_LEAN[gan];
  const diff: string[] = [];
  let overlap = 0;
  lean.forEach((l, i) => { if (mine[i] === l) overlap += 1; else diff.push(AXIS_KO[i]); });
  if (overlap === 3) return { overlap, note: `MBTI ${m}와 타고난 결이 같은 방향이야. 네가 아는 너와 사주가 본 너가 겹쳐.` };
  if (overlap === 2) return { overlap, note: `MBTI ${m}와 두 축이 겹쳐. 다른 한 축(${diff[0]})은 네가 고른 나와 타고난 결이 갈리는 지점 — 연애에선 그 축이 먼저 흔들려.` };
  return { overlap, note: `MBTI ${m}와 타고난 결이 꽤 달라(${diff.join('·')}). 지금의 너는 타고난 결을 눌러쓰고 있을 수 있어 — 연애에서 어느 쪽이 나오는지가 관건이야.` };
}
