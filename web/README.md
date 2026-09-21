# 속보여 웹 — v0 1단계 (유입: 랜딩 + 내 연애 1면)

React + Vite + TypeScript. 만세력 계산은 `lunar-javascript`로 **브라우저 안에서** 끝나며 생년월일은 서버로 전송되지 않는다(백엔드 없음).

## 실행
```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # dist/ 정적 산출물 → Vercel/Netlify/Cloudflare Pages에 그대로 배포
npm run typecheck
npm run check:saju # 만세력 정확도 검증 (연사리 공개 샘플·입춘 경계·음력 변환)
```

## 구조
- `src/saju/manse.ts` — 생년월일(시) → 원국(연·월·일·시주), 일간, 오행 분포. 시간 미입력 시 삼주.
- `src/saju/archetypes.ts` — 일간 10종 → 연애 스타일 아키타입 카피(초안, 명리 자문 검수 전) + 오행 과다/부족 노트. 과다 임계 37.5%.
- `src/brand.ts` — 이름 A/B 락업(`?v=a` 속보여 / `?v=b` 연애속보), 알림 채널 URL(`NOTIFY_URL` — 카카오 채널 개설 후 교체).
- `src/track.ts` — 계기판 이벤트 → `window.dataLayer` push. 생년월일은 이벤트에 싣지 않는다.
- `src/share.ts` — 공유 링크(`?b=YYYYMMDD&h=HH|-&c=s|l&l=1`). 링크로 들어오면 카드가 바로 렌더되고 "나도 발행" 배너가 뜬다.

## 계기판 이벤트 (기획안_종합.md §10-1 대응)
| 이벤트 | 시점 | 가설 |
|---|---|---|
| `page_view` | 진입 (variant 포함) | G5 이름 A/B |
| `cta_hero_click` / `form_start` / `form_submit` | 랜딩 → 폼 | 랜딩→카드 전환 |
| `card_issued` (archetype, has_time, calendar) | 1면 발행 | G1·G6 |
| `card_saved` / `link_copied` | 공유 | G6 공유율 |
| `shared_view` | 공유 링크 유입 | G6 유기적 유입 |
| `next_issue_cta` | 다음 호 알림 클릭 | G2 선행 지표(관심) |
| `reissue_click` | 다시 발행 | — |

GA4 연결: `index.html`에 gtag 스니펫을 넣고 GTM 없이 쓰려면 `track()`에서 `gtag('event', event, props)`를 추가 호출하도록 한 줄 바꾸면 된다.

## 배포 전 교체할 것
1. `NOTIFY_URL` — 카카오 채널 URL
2. `index.html` og:image (1면 카드 기본 이미지) + GA4 측정 ID
3. 도메인(sokboyeo.com) 연결 후 `brand.ts`의 `domain`

## v0에서 다루지 않는 것
야자시·조자시, 서머타임, 진태양시(-30분) 보정, 십성·신살, 상대 궁합(SKU 1은 2단계).

참고: 개발 모드에서 `page_view`가 2회 찍히는 것은 React StrictMode의 이중 실행 때문이며 프로덕션 빌드에서는 1회다.

---

# 2단계 (SKU 1) — 백엔드 연동

## 구성
- `supabase/migrations/0001_init.sql` — subjects · reports · report_events, RLS, `set_report_feedback` RPC
- `supabase/functions/` — `create-order` · `confirm-payment` · `generate-report` · `cancel-order` · `get-report` · `admin-reports`
- `supabase/functions/_shared/` — `http.ts`(CORS·인증·서비스 클라이언트), `toss.ts`, `facts.ts`(입력 검증 + 서버 재계산), `saju/` `report/`(**web/src에서 자동 복사** — `web/scripts/sync-shared.sh`, 직접 수정 금지)
- 클라이언트 — `src/lib/supabase.ts`, `src/api.ts`, `AuthGate`(이메일 OTP), `Checkout`(토스 결제위젯 v2), `Pending`(발행 대기 폴링·열람 전 취소), `MyReports`(발행함 `?box=1`), `Admin`(데스크 `?admin=1`)

`VITE_SUPABASE_URL`·`VITE_SUPABASE_ANON_KEY`·`VITE_TOSS_CLIENT_KEY`가 모두 있어야 실결제 플로우가 켜지고, 없으면 샘플 리포트 walkthrough로 동작한다.

## 배포 절차
1. Supabase 프로젝트 생성 → SQL Editor에 `0001_init.sql` 실행 (또는 `supabase db push`)
2. Auth → Email 활성화. OTP 코드 입력을 쓰려면 이메일 템플릿(Magic Link)에 `{{ .Token }}` 포함. 사이트 URL·리다이렉트 URL에 배포 도메인 등록
3. 시크릿: `supabase secrets set TOSS_SECRET_KEY=test_gsk_... ANTHROPIC_API_KEY=... ADMIN_EMAILS=you@example.com AUTO_PUBLISH=false`
4. 함수 배포: `web/scripts/sync-shared.sh && supabase functions deploy create-order confirm-payment generate-report cancel-order get-report admin-reports`
   - `generate-report`는 `confirm-payment`가 service role 키로 내부 호출한다(외부에선 admin만)
   - 함수 JWT 검증은 기본값(켜짐) 유지 — 내부 호출도 service role JWT라 통과한다
5. 토스페이먼츠 개발자센터에서 테스트 키 발급 → `VITE_TOSS_CLIENT_KEY`(클라이언트), `TOSS_SECRET_KEY`(서버). 정식 계약 전엔 테스트 결제만 가능
6. `web/.env`에 클라이언트 변수 채우고 `npm run build` → Vercel 배포(SPA rewrite `/* → /index.html`)

## 생성 파이프라인
결제 confirm → `generate-report` → Claude(`claude-opus-5`, 구조화 출력 `zodOutputFormat`) → 스키마·금지어 검증(실패 시 교정 재시도 1회) → `review`(휴먼 검수) 또는 `AUTO_PUBLISH=true`면 `published` → 사용자 첫 열람 시 `viewed`(이후 취소 불가). 시스템 프롬프트는 프롬프트 캐시(`cache_control`) 적용.

## 아직 없는 것
- 발행 이메일 알림(Resend 등 SMTP 연동) — 현재는 앱 내 발행함에서 확인
- 카카오 로그인 (이메일 OTP로 시작)
- 서버 함수 자동 테스트 — 로컬 `supabase functions serve`로 수동 검증 필요
