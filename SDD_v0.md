# SDD v0 — 2단계 전환: SKU 1 「[단독] 이 사람과 나, 지금 무슨 사이」

작성일: 2026-09-12 · 전제: 기획안_종합.md §5·§9·§10, 1단계 산출물 `web/`
목표: **G2(지불 의사)·G3(사주가 답이 되나)** 측정. 카드→유료 전환율, 상대 생년월일 입력 완료율, 리포트 직후 1탭 피드백, 환불율.

## 1. 범위

**만든다**: 질문 조준 → 상대 정보(닉네임·생년월일·시간 선택) → 셀프리포트 5문항 → 티저(수치 공개·해석 잠금) → 결제(토스페이먼츠) → 리포트 생성(결정론 계산 + LLM 해석) → 휴먼 검수 → 발행·열람 → 1탭 피드백. 열람 전 전액 취소. 리포트 영구 소장.
**만들지 않는다**: 카톡 분석, 앱, 커플 계정, 챗봇, 구독, 상대 초대.

## 2. 아키텍처

```
[Vite SPA · Vercel]  ──(supabase-js)──▶ [Supabase]
  랜딩·1면 카드·SKU 플로우           ├ Postgres (subjects, reports) + RLS
  티저·결제위젯·리포트 뷰어          ├ Auth (이메일 OTP → 카카오 로그인 후속)
                                     └ Edge Functions (Deno)
                                         ├ create-order      : 주문 생성(금액 서버 확정)
                                         ├ confirm-payment   : 토스 confirm → 생성 큐
                                         ├ generate-report   : 결정론 팩트 + Anthropic API → JSON
                                         ├ cancel-order      : 열람 전 취소 → 토스 cancel
                                         └ publish-report    : 검수 승인(admin)
[토스페이먼츠 v2 위젯] ──▶ successUrl(paymentKey, orderId, amount) ──▶ confirm-payment
[Anthropic API] ◀── generate-report (서버 측 키)
```

선택 근거: 백엔드 없는 1단계 코드 유지, Supabase는 Auth·DB·함수·RLS가 한 곳(1인 운영 저비용), 토스는 테스트 키로 계약 전 결제 플로우 검증 가능, LLM 키는 브라우저에 두지 않는다.

## 3. 사용자 플로우 (상태 머신)

`landing → card → sku(question → subject → selfreport → teaser) → checkout → paid → generating → review → published → viewed → feedback`
- `paid → cancelled`: 열람 전 사용자 취소(전액 환불). `published` 이후엔 불가(약관 명시).
- `generating` 실패 → `failed` → 자동 재시도 1회 → 실패 시 운영자 알림 + 사용자 환불.
- 진입 경로: 1면 카드 하단 "취재 시작" / 딥링크 `?flow=sku` / 공유 링크에서 "나도 발행" 후.
- 내 사주가 없으면(직접 진입) 플로우 첫 단계에서 내 생년월일부터 받는다.

## 4. 데이터 모델 (Postgres)

```sql
-- 상대 = 관계 단위 (3단계 '연재'의 뿌리)
subjects(id uuid pk, user_id uuid fk auth.users, nickname text, birth_date date, birth_hour smallint null,
         calendar text check in ('solar','lunar'), leap_month bool default false, created_at timestamptz)
reports(id uuid pk, user_id uuid, subject_id uuid fk, question_key text, self_report jsonb,
        my_chart jsonb, subject_chart jsonb, compat jsonb,             -- 결정론 계산 결과(재현 가능)
        status text check in ('draft','paid','generating','review','published','viewed','cancelled','refunded','failed'),
        order_id text unique, payment_key text, amount int, content jsonb,   -- LLM 출력(JSON 스키마)
        feedback smallint null,  -- 1탭: 1 근거 충분 / 0 부족
        created_at, paid_at, published_at, viewed_at timestamptz)
```
RLS: 사용자는 자기 행만 select/insert; 상태 전이·content 기록은 service role(Edge Function)만. 상대 생년월일은 이용자가 입력한 참고 정보로 취급 — 리포트 생성 외 사용 금지, 사용자 삭제 시 함께 삭제(약관·개인정보처리방침 명시).

## 5. 결정론 레이어 vs LLM 레이어 ("계산은 코드로, 해석만 AI로")

**결정론(클라이언트+서버 동일 코드, `src/saju/compat.ts`, `src/report/selfreport.ts`)**
- 궁합 팩트: 천간합/충, 일간 오행 관계(비화·식상·인성·재성·관성 → 연애 언어 번역), 일지 육합/삼합/충, 띠(연지) 합/충, 오행 보완(상대 우세 오행이 내 부족 오행인지). 궁합 흐름 지수 0~100(휴리스틱, v0 — 표기 시 '흐름 지수'로만).
- 셀프리포트 팩트: 답장 텀 / 먼저 연락 비율 / 최근 2주 만남 / 마지막 만남 경과 / 상대 먼저 연락 횟수 → 신호 지수 0~100 + 플래그(일방 신호·행동 신호·정체).
- 티저는 이 수치만 공개하고 해석·확인 취재·행동은 잠근다(ONDO 티저 원칙).

**LLM(서버, Anthropic API)**: 입력 = 질문 키 + 두 사람 아키타입 + 궁합 팩트 + 셀프리포트 팩트 + 관계 단계 추정. 출력 = 아래 JSON만(구조화 출력).
```
ReportContent { headline, lede, stage{current, note}, facts[3]{title, detail, source},
  interpretations[2]{title, detail, likelihood}, checks[2]{title, how, evidenceFor, evidenceAgainst},
  action{do, dont, timing}, correctionPolicy }
```
프롬프트 규칙: 단정 금지·확률 수치 금지·상대 비하 금지·팩트 밖 사실 창작 금지(팩트에 없는 사건 언급 시 실패 처리), 화법 = 기사체(리드→팩트→분석→확인→전망) + 용어 즉시 번역. **보호 모드**: 질문이 '식음'이고 신호 지수 < 30이면 톤 다운(존댓말, 행동 제안은 '거리 두기·정리' 계열만).
인젝션 표면: 자유 텍스트 입력 없음(선택형 문항만, 닉네임은 프롬프트에 넣지 않고 렌더 시 치환).

## 6. Edge Functions

| 함수 | 입력 | 처리 | 출력 |
|---|---|---|---|
| create-order | subject, question, selfReport, myBirth | 차트·팩트 서버 재계산 → reports(draft) 생성, 금액 서버 확정(8,900) | orderId, amount |
| confirm-payment | paymentKey, orderId, amount | 금액 대조 → 토스 `/v1/payments/confirm` → status paid → generate 호출 | status |
| generate-report | reportId | 팩트 → Anthropic → JSON 검증(스키마·금지어) → status review 또는 AUTO_PUBLISH면 published | ok |
| cancel-order | reportId | status ∈ {paid,generating,review}만 허용 → 토스 cancel → refunded | ok |
| publish-report | reportId (admin) | review → published + 이메일 발송 | ok |
| get-report | reportId | RLS 하 조회, 첫 열람 시 viewed_at 기록(취소 불가 전환) | content |

## 7. 결제 (토스페이먼츠 결제위젯 v2, 테스트 키로 시작)

클라이언트: `loadTossPayments(clientKey).widgets({customerKey})` → `setAmount` → `renderPaymentMethods` → `requestPayment({orderId, orderName:'[단독] 관계 리포트', successUrl, failUrl})`. 서버 confirm 필수(금액 위변조 방지). 정가 19,900 → 출시가 8,900. 열람 전 전액 취소 문구를 결제 버튼 옆에 고정. 정식 계약 전엔 테스트 결제로 플로우·전환 의도만 측정(실결제는 계약 후).

## 8. 검수·발행·알림

- 초기: 모든 리포트 `review` → 운영자 admin 페이지(Supabase Auth, role=admin)에서 본문 확인·수정 → 발행. `AUTO_PUBLISH=true`면 검수 생략(품질 안정 후).
- 알림: 발행 시 이메일(Supabase Auth OTP 링크 = 로그인 겸 알림). 카카오 알림톡은 채널 개설 후.
- SLA 안내: "발행까지 최대 24시간, 대부분 10분 안".

## 9. 계기판 이벤트 (추가)

`sku_start`, `sku_question{key}`, `sku_subject_entered{has_time}`, `sku_selfreport_done{signal}`, `paywall_view{compat, signal}`, `purchase_click`, `payment_success`, `payment_fail`, `report_view{demo|paid}`, `report_feedback{value}`, `order_cancelled`.
G3 판정에 쓰는 것: `sku_subject_entered / sku_question` (상대 생년월일 입력 완료율), `report_feedback`, 환불율.

## 10. 환경변수·배포·비용

- 클라이언트: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TOSS_CLIENT_KEY`
- 서버(Edge Functions secrets): `SUPABASE_SERVICE_ROLE_KEY`, `TOSS_SECRET_KEY`, `ANTHROPIC_API_KEY`, `AUTO_PUBLISH`, `ADMIN_EMAILS`
- 배포: SPA → Vercel(rewrite `/* → /index.html`), 함수 → `supabase functions deploy`. 
- 비용: 리포트 1건당 LLM 입력 ~2K·출력 ~1.5K 토큰 → 수십 원 수준(모델 선택에 따라). 결제 수수료 별도.

## 11. 리스크와 방어

| 리스크 | 방어 |
|---|---|
| LLM 품질·환각 | 팩트 외 창작 금지 + JSON 스키마 검증 + 초기 휴먼 검수 |
| 결제-생성 불일치 | confirm 후에만 생성, 생성 실패 시 자동 환불 |
| 상대 개인정보 | 참고 정보 취급 명시, 최소 수집(닉네임+생일), 삭제권, 프롬프트에 실명 미포함 |
| 취약 고객 | 보호 모드(식음 질문 + 낮은 신호) |
| 명리 계산 오류 | 1단계 검증 스위트 유지 + 궁합 테이블 단위 테스트 |

## 12. 단계 계획

- **2a (오늘)**: 결정론 모듈(compat·selfreport) + 질문 조준·상대 정보·셀프리포트 UI + 티저 + 리포트 뷰어 + 데모 리포트(결제 미연동 시 샘플로 전 플로우 walkthrough). 타입체크·빌드·DOM 검증.
- **2b**: Supabase 스키마·RLS, Edge Functions 5종, 토스 테스트 결제, Anthropic 생성(JSON), 이메일.
- **2c**: admin 검수 페이지, 취소/환불, 실기기 QA, 배포.
