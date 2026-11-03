# 아키텍처

## 기본 원칙
Next.js App Router / React / TypeScript strict / Tailwind CSS v4. Server Components가 기본이며 폼 상태·룰렛 등 상호작용 경계에만 Client Components를 둔다. shadcn/ui의 로컬 소스 방식과 `components.json`을 사용한다. Phase 0 버튼은 동일한 cva·cn 패턴의 최소 기본형으로, 사용하지 않는 Radix 의존성은 설치하지 않았다.

## 디렉터리와 데이터 흐름
- `src/app`: 라우트, 레이아웃, metadata, robots, sitemap.
- `src/components/ui`: 재사용 UI 기본 요소.
- `src/lib`: 환경 검증과 공통 유틸리티.
- `src/domain/recommendation`: Zod 조건 입력, 독립 DTO, 순수 추천 함수, 시간 완화·한국어 이유. 프레임워크·DB·현재 시각·난수에 의존하지 않는다.
- `src/server`: `server-only` 경계의 지연 Prisma 연결과 검증된 게임 조회. 이 경로는 클라이언트에서 import하지 않는다.
- `prisma`: PostgreSQL 스키마·SQL 마이그레이션·데이터 검증 후 create-only seed. CLI 전용 연결 factory를 서버 facade와 공유한다.
- `src/domain/games`, `data/games`: Zod 데이터 계약과 출처 관측을 기록한 개발용 샘플 1개.
- `tests/e2e`, `docs`: 브라우저 테스트와 설계 문서.

Phase 3 연결 흐름: 폼 → 공유 가능한 GET URL → 서버의 Zod 쿼리 검증 → 카탈로그 공개 검토 확인 → 기존 repository → 순수 추천 함수 → 결과 카드 서버 렌더링. 잘못된 조건은 DB 조회 전에 차단한다. 개발 미리보기는 기존 샘플만 사용한다. 폼 상태·검증 오류·라우팅 전환만 Client Component이며 카드·조건 요약·빈 결과·오류 안내는 Server Components다. Phase 4의 룰렛은 후보 이름·slug만 Client Component에 전달하고 브라우저에서 선택·회전한다. 단순 서버 렌더링에 자기 API를 호출하지 않는다. 외부 API가 필요할 때만 Route Handler를 만들고 입력과 응답을 검증한다.

## 런타임·환경
Node 24.x, pnpm 11.5.1. `package.json`의 정확 버전과 `pnpm-lock.yaml`이 재현 기준이다. Next·React peer 조건은 레지스트리에서 확인했다. Prisma latest가 RC여서 안정 7.10.1로 고정했다. Phase 1에 Prisma 7 adapter·환경 로더·생성 단계를 추가했다. 설치·타입·빌드에 generate만 포함하며 실제 DB 연결·migration·seed는 실행하지 않는다.

`NEXT_PUBLIC_SITE_URL`은 HTTP(S) URL만 허용하며 로컬 기본값이 있다. `DATABASE_URL`은 서버에서만 검증·사용한다. CLI의 `DIRECT_URL`, 명시적 테스트용 `TEST_DATABASE_URL`을 별도로 둔다. 실제 `.env`는 Git 제외다. 외부 폰트·이미지 다운로드 없이 시스템 한글 글꼴을 사용한다.

## SEO·배포
한국어 lang, 제목 템플릿, 설명, sitemap, robots 기반을 제공한다. 개발 단계의 홈·결과는 noindex와 전체 disallow로 색인을 막는다. 정식 공개 시 검증된 페이지에 대해 색인 정책을 전환하고 canonical·게임별 metadata를 추가한다. 현재 sitemap은 홈만 포함한다.

Vercel에서는 Node 24와 pnpm 잠금 파일을 사용하고 `pnpm build`로 빌드한다. 실제 배포는 이번 범위가 아니다. PostgreSQL 17과 Prisma adapter의 최대 연결 수 5를 기준으로 하며 배포 인스턴스 수에 따라 풀 예산을 조정한다. migration CLI는 DIRECT_URL을 우선한다. migration은 배포 전 별도 작업으로 실행하며 빌드 중 실행하지 않는다.

## 도구 호환성 결정
TypeScript 7.0.2와 ESLint 10.14.0도 확인했으나 Next lint 플러그인의 peer 범위를 벗어나므로 TypeScript 6.0.3과 ESLint 9.39.5로 고정했다. ESLint 9의 지원 종료 경고는 남아 있다. 플러그인이 ESLint 10을 지원하면 함께 갱신한다. `pnpm peers check`로 실제 호환성을 검사한다.

pnpm 11이 생성한 `pnpm-workspace.yaml`은 Prisma 및 TypeScript CLI 실행에 필요한 esbuild 설치 스크립트를 명시적으로 허용하며, 릴리스 대기 정책 예외는 확인한 Next/Vitest 버전에 한정한다.

## 검증
ESLint flat config, `next typegen && tsc --noEmit`, Vitest Node 환경, Playwright desktop/mobile Chromium. Phase 1에 데이터 계약 단위 테스트와 별도 `test:db` PostgreSQL 통합 테스트를 추가했다. Phase 2에 추천 조건·엔진·시간 정책 테스트를 추가했으며 전체 단위 테스트 119개를 통과했다.

## Phase 3 화면·공개 정책
`src/components/recommendation`에 선택 그룹·폼·조건 요약·카드·빈 상태를 분리했다. 쿼리 직렬화·재검증은 `src/domain/recommendation/query.ts`, 서버 조합은 `src/server/recommendation.ts`다. `searchParams` Promise를 await하므로 홈·결과는 요청 시 서버 렌더링한다. 쿼리 중복·알 수 없는 키·잘못된 enum은 추정값으로 바꾸지 않는다. 공유·새로고침·조건 수정에서 같은 값을 보존한다.

`src/server/catalog.ts`는 GAME_DATA_MODE를 처리한다. 미설정 시 development/test는 preview, 그 외는 database다. preview는 기존 샘플 1개를 읽고 UI에 미리보기 상태를 명시한다. 운영에서는 preview를 설정해도 차단한다. database 모드는 `data/publication-approvals.json`의 공개 검토 기록이 있는 slug 중 VERIFIED 사실만 반환한다. 목록은 현재 비어 있다. 승인 목록 오류나 DB 실패는 안전한 unavailable 상태이며 샘플로 대체하지 않는다. 공개 검토는 수집 파이프라인이나 배포 승인을 대신하지 않는다.

Playwright는 기존 개발 서버와 충돌하지 않도록 3173 포트의 `.next-e2e` dev 서버와 3174 포트의 `.next` production 서버를 사용한다. production 검증을 위해 `pnpm build`를 먼저 실행한다. YOGEOLLO_E2E는 테스트용 distDir만 바꾸며 일반 실행 경로는 유지한다. 생성 타입·번들·스크린샷은 Git에서 제외한다. 현재 단위 테스트 149개와 브라우저 테스트 19개를 통과했다.

## Phase 4 상세·룰렛·소개
`/games/[slug]`는 params를 await하고 요청 시 기존 카탈로그의 공개 검토 경계를 적용한다. `src/server/game-detail.ts`의 React cache로 메타데이터·본문의 동일 요청 조회를 재사용한다. 잘못된 slug는 조회 전에 차단하고 미공개·미존재 게임은 404, 자료 오류는 별도 안내를 반환한다. 운영은 VERIFIED 편집만 사용한다. 개발용 `data/guides/splendor.json`은 DRAFT 자체 요약으로 분리했으며 preview에서만 표시하고 추천 태그의 상태를 변경하지 않는다. 출처·작성 정보의 날짜는 한국 시간으로 표시한다.

`src/domain/roulette/roulette.ts`는 후보 계약, 선택 교집합, 주입된 uint32 난수원의 편향 없는 index 선택, 회전 각도를 분리한다. Client Component는 crypto.getRandomValues로 후보를 먼저 선택하고 실제 구간 중앙이 포인터에 오도록 CSS 회전한다. ref로 같은 이벤트 구간의 중복 실행을 차단하고 회전 중 후보를 고정한다. transitionend·타이머는 동일 선택을 완료하며 unmount에서 정리한다. 단일 후보는 바로 선택하고 빈 선택은 실행하지 않는다. 동작 줄이기 설정과 회전 중 설정 변경도 처리한다. 후보 목록 교체는 상태를 초기화한다.

`/about`은 추천·데이터·권리·룰렛 원칙을 설명한다. 소개를 sitemap에 추가했으나 개발용 상세 URL은 포함하지 않으며 noindex 정책은 유지한다. 새 런타임 라이브러리는 없고 DOM 상호작용 테스트용 jsdom 29.1.1만 개발 의존성에 추가했다. Node 24 기준과 호환되는 안정 버전을 사용했다. 테스트는 182개와 E2E 32개로 확장했다.

## Phase 5 구현
CLI scripts/data-import.ts → Zod 입력 계약·순수 변경 계획 → prisma/import-service.ts의 Serializable 트랜잭션 → ImportBatch 및 기존 게임 관계로 연결한다. 웹 API나 Client Component에서 가져오기 서비스를 호출하지 않는다. src/domain/data-import/digest.ts는 Node crypto를 사용하는 서버/CLI 전용이다. 공개 카탈로그는 recordDigest까지 대조하며 미검토 편집은 해시에서 제외한다. 신규 의존성은 없다. 상세 운영 절차는 DATA_IMPORT.md를 따른다.

Phase 5 검증 환경에서는 Turbopack production 빌드의 내부 포트 생성이 권한 허용 후에도 실패해 build 스크립트에 공식 `--webpack` 옵션을 명시했다. 개발 서버는 Turbopack을 유지하고 같은 App Router·Server Components를 사용한다.

## Phase 5 데이터 확장 보완
`data/catalog.ts`의 명시적 JSON 목록과 gameDatasetSchema 검증을 seed·개발 preview가 공유한다. Next의 정적 import로 파일을 포함하고 런타임 디렉터리 탐색이나 네트워크 수집은 하지 않는다. 운영 카탈로그는 이전처럼 DB와 공개 승인 해시를 사용한다.
