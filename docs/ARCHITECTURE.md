# 아키텍처

## 기본 원칙
Next.js App Router / React / TypeScript strict / Tailwind CSS v4. Server Components가 기본이며 폼 상태·룰렛 등 상호작용 경계에만 Client Components를 둔다. shadcn/ui의 로컬 소스 방식과 `components.json`을 사용한다. Phase 0 버튼은 동일한 cva·cn 패턴의 최소 기본형으로, 사용하지 않는 Radix 의존성은 설치하지 않았다.

## 디렉터리와 데이터 흐름
- `src/app`: 라우트, 레이아웃, metadata, robots, sitemap.
- `src/components/ui`: 재사용 UI 기본 요소.
- `src/lib`: 환경 검증과 공통 유틸리티.
- 향후 `src/domain/recommendation`: 프레임워크·DB·시간·난수에 의존하지 않는 순수 추천 함수 및 타입.
- 향후 `src/server`: `server-only` 경계의 Prisma 클라이언트·repository·데이터 검증. 이 경로는 클라이언트에서 import하지 않는다.
- 향후 `prisma`: PostgreSQL 스키마·마이그레이션·검증된 seed.
- `tests/e2e`, `docs`: 브라우저 테스트와 설계 문서.

추천 요청 → Zod 입력 파싱 → 서버 repository 조회 → 도메인 순수 함수 → 직렬화 가능한 결과 → 서버 렌더링. 룰렛만 선택 후보 DTO를 받아 클라이언트에서 동작한다. 단순 서버 렌더링에 자기 API를 호출하지 않는다. 외부 API가 필요할 때만 Route Handler를 만들고 입력과 응답을 검증한다.

## 런타임·환경
Node 24.x, pnpm 11.5.1. `package.json`의 정확 버전과 `pnpm-lock.yaml`이 재현 기준이다. Next·React peer 조건은 레지스트리에서 확인했다. Prisma latest가 RC여서 안정 7.10.1로 고정했다. Prisma 7의 driver adapter·환경 로딩 설정은 Phase 1에 구현한다. DB 모델이 없어 generate나 DB 연결을 build에 넣지 않는다.

`NEXT_PUBLIC_SITE_URL`은 HTTP(S) URL만 허용하며 로컬 기본값이 있다. `DATABASE_URL`은 향후 서버에서만 검증·사용한다. 실제 `.env`는 Git 제외다. 외부 폰트·이미지 다운로드 없이 시스템 한글 글꼴을 사용한다.

## SEO·배포
한국어 lang, 제목 템플릿, 설명, sitemap, robots 기반을 제공한다. 준비 화면은 noindex와 전체 disallow로 색인을 막는다. 정식 공개 시 검증된 페이지에 대해 색인 정책을 전환하고 canonical·게임별 metadata를 추가한다. 현재 sitemap은 홈만 포함한다.

Vercel에서는 Node 24와 pnpm 잠금 파일을 사용하고 `pnpm build`로 빌드한다. 실제 배포는 이번 범위가 아니다. Phase 1 이후 PostgreSQL pooled URL, migration 전용 직접 연결, Prisma adapter와 연결 예산을 결정한다. migration은 배포 전 별도 작업으로 실행하며 빌드 중 실행하지 않는다.

## 도구 호환성 결정
TypeScript 7.0.2와 ESLint 10.14.0도 확인했으나 Next lint 플러그인의 peer 범위를 벗어나므로 TypeScript 6.0.3과 ESLint 9.39.5로 고정했다. ESLint 9의 지원 종료 경고는 남아 있다. 플러그인이 ESLint 10을 지원하면 함께 갱신한다. `pnpm peers check`로 실제 호환성을 검사한다.

pnpm 11이 생성한 `pnpm-workspace.yaml`은 Prisma 설치 스크립트만 명시적으로 허용하며, 릴리스 대기 정책 예외는 확인한 Next/Vitest 버전에 한정한다.

## 검증
ESLint flat config, `next typegen && tsc --noEmit`, Vitest Node 환경, Playwright desktop/mobile Chromium. DB 통합 테스트와 추천 테스트는 해당 단계에서 추가한다.
