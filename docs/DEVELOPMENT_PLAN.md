# 개발 계획과 단계별 보고

## 승인 경계
이번 실행은 Phase 0만 수행한다. 완료 후 사용자 승인 전까지 Phase 1 이후 구현을 진행하지 않는다.

## Phase 0 — 프로젝트 초기화·문서
변경 파일: 루트 package/lock/TypeScript/Next/PostCSS/ESLint/shadcn/Vitest/Playwright/환경 설정, `src/app/*`, `src/components/ui/button.tsx`, `src/lib/*`, `tests/e2e/home.spec.ts`, `docs/*.md`, `GETTING_STARTED.md`.

구현: 한국어 준비 화면, 따뜻한 아이보리 테마, Server Component 기본 레이아웃, 제목·설명·robots·sitemap, 환경 URL 검증, shadcn 로컬 UI 기반, 단위·브라우저 테스트 실행 기반. 기존 README는 보존한다.

품질 검사 결과는 `docs/PHASE_0_REPORT.md`에 기록한다. 미완료: DB 모델·마이그레이션·검증 게임·추천·결과 UI·상세·소개·룰렛·수집·실제 배포. 의도적으로 다음 단계에 남긴다.

## Phase 1 — DB와 검증 샘플
Prisma 7 설정과 PostgreSQL adapter, 모델·제약·인덱스·migration·seed, 출처 기록. 소량 데이터의 권리와 실제 사실을 수동 검증한다. 완료: DB validation/migration/seed 재실행 검증, 출처와 자체 편집 데이터 구분. 선행 조건: 사용자 승인과 합법적 데이터 접근.

## Phase 2 — 추천 엔진
순수 함수와 Zod 입력 스키마, 필터·결정적 순위·완화·이유. 완료: 모든 추천 테스트와 중복·누락·결정성 검증.

## Phase 3 — 홈·결과
입력 폼, 7명 이상 정수 입력, URL 조건 파싱, 결과 카드, 빈 결과·완화 안내. 완료: 키보드·모바일·잘못된 쿼리 테스트.

## Phase 4 — 상세·룰렛·소개
자체 작성 규칙 요약, 상세 metadata·404, `/about`, 후보 선택과 실제 랜덤 룰렛. 완료: 상세 콘텐츠, 빈/단일/다중 후보, 중복 실행과 reduced-motion 테스트.

## Phase 5 — 수집 파이프라인
권한을 확인한 방식만 지원. import 검증·중복·수동 승인·이력·재검증 설계. BGG 미승인 시 비활성. 완료: 미검증 데이터의 공개 차단과 안전한 재실행.

## Phase 6 — 품질·배포
전체 lint·타입·단위·E2E·production build, 모바일 접근성, DB 통합, Vercel 환경·migration·연결 풀·SEO 정책 검증. 배포는 별도 승인된 범위에서 실행한다. 100개 검증이 불가능하면 실제 수량과 한계를 공개한다.
