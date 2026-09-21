# 속보여 (sokboyeo)

걔 마음, 짐작 말고 확인. 걔 생일 + 내 생일 + 요즘 상황 5개로 관계를 판정하고, 전체 리포트(9,900원)로 걔의 결·이번 주 실험·보낼 문장까지.

- `web/` — Vite + React 클라이언트 (Vercel 배포, Root Directory `web`)
- `supabase/` — 마이그레이션 + Edge Functions (create-order · confirm-payment · generate-report · cancel-order · get-report · admin-reports)
- 문서 — 기획안_종합.md(마스터) · 빌드노트_1단계.md(변경 이력) · PG심사_체크리스트.md · 캐릭터_브리프.md

## 개발
```bash
cd web && npm install && npm run dev
```
환경변수는 `web/.env.example` 참고. 키가 없으면 샘플 모드로 동작한다.

## 배포
`main`에 push하면 Vercel이 자동 배포한다. 수동: `cd web && npx vercel --prod`.
