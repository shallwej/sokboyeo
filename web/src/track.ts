/**
 * 계기판 이벤트. GA4 등 분석 도구는 window.dataLayer에 연결한다 (README 참조).
 * 개인정보(생년월일)는 절대 이벤트에 싣지 않는다 — 아키타입 키만 보낸다.
 */
export type Variant = 'a' | 'b';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function getVariant(): Variant {
  const v = new URLSearchParams(window.location.search).get('v');
  return v === 'b' ? 'b' : 'a';
}

/** 디자인 테마 — 기본 'mag'(인스타 매거진). `?t=news`로 창간(신문) 팔레트 참고. 선택은 브라우저에 남는다(내부 이동 시 파라미터가 지워져도 유지). */
export type Theme = 'mag' | 'red' | 'news';
const THEME_KEY = 'sokboyeo.theme';
const THEMES: Theme[] = ['mag', 'red', 'news'];

export function getTheme(): Theme {
  const t = new URLSearchParams(window.location.search).get('t') as Theme | null;
  if (t && THEMES.includes(t)) {
    try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
    return t;
  }
  try {
    const s = localStorage.getItem(THEME_KEY) as Theme | null;
    if (s && THEMES.includes(s)) return s;
  } catch { /* ignore */ }
  return 'mag';
}

export function applyTheme(): Theme {
  const t = getTheme();
  if (t === 'mag') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  return t;
}

export function track(event: string, props: Record<string, string | number | boolean> = {}): void {
  const payload = { event, variant: getVariant(), theme: getTheme(), ts: Date.now(), ...props };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (import.meta.env.DEV) console.debug('[track]', payload);
}
