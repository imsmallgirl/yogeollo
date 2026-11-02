# 개발 시작

기존 프로젝트 설명은 `README.md`에 그대로 보존했습니다. 현재 **Phase 1(DB 기반)**까지 구현했으며 추천 서비스는 아직 동작하지 않습니다.

## 실행
Node 24.x와 pnpm 11.5.1을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

http://localhost:3000 에서 준비 화면을 확인합니다. `.env.example`을 참고해 필요할 때 `.env.local`을 작성하세요. 기본 화면에는 DB나 비밀키가 필요하지 않습니다. 준비 화면은 DB에 접속하지 않습니다. DB 작업은 아래 절차로 별도 실행합니다.

## 검사
```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright는 전용 3147 포트에 로컬 서버를 자동 실행하며 desktop/mobile Chromium을 검사합니다. 실제 iOS Safari 검증은 별도입니다. production 실행은 `pnpm build` 후 `pnpm start`입니다. 준비 화면은 검색 색인을 비활성화했습니다.

설계와 다음 단계는 [개발 계획](docs/DEVELOPMENT_PLAN.md), [아키텍처](docs/ARCHITECTURE.md), [Phase 0 보고서](docs/PHASE_0_REPORT.md)를 참고하세요. 사용자 승인 전에는 다음 단계를 구현하지 않습니다.

## PostgreSQL 설정 (Phase 1)
PostgreSQL 17.x와 기본 `public` 스키마를 사용합니다. 서비스용 `yogeollo`와 테스트용 `yogeollo_test` DB를 별도로 만들고, `.env.example`을 참고해 실제 연결 주소를 `.env.local`에 작성하세요. OS의 기존 PostgreSQL 서버나 호스팅 DB를 사용할 수 있으며 이 프로젝트는 시스템 서비스를 자동 시작하지 않습니다.

```sh
pnpm db:validate
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm db:status
```

설치·타입 검사·빌드 시 Prisma Client만 자동 생성합니다. DB 접속·migration·seed는 자동 수행하지 않습니다. 마이그레이션 CLI는 `DIRECT_URL`이 있으면 우선 사용하며 seed와 앱은 `DATABASE_URL`을 사용합니다. 로컬 개발에서 새 스키마 변경은 `pnpm db:migrate --name 설명`으로 migration을 만들고 검토합니다. 배포 환경은 검토된 migration에 `pnpm db:deploy`만 실행합니다.

seed는 출처를 대조한 개발용 샘플 1개를 신규 입력하며 기존 게임·편집·관측은 덮어쓰지 않습니다. 재고·인기는 미확인이고 편집은 미검토 상태입니다. 이 샘플은 아직 공개용으로 승인하지 않았습니다. `.env`의 실제 값·생성된 Prisma Client·테스트 결과는 커밋하지 않습니다.

DB 통합 테스트는 `_test`로 끝나는 전용 DB에 migration을 먼저 적용한 뒤 **환경변수를 명시적으로** 전달해 실행합니다. 아래 주소의 자격정보는 본인 로컬 테스트 설정으로 바꾸세요. TEST_DATABASE_URL은 자동으로 `.env.local`에서 로드하지 않습니다.

```sh
DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/yogeollo_test' DIRECT_URL='' pnpm db:deploy
TEST_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/yogeollo_test' pnpm test:db
```

통합 테스트는 DB에 샘플을 입력하고 seed 재실행·SQL 제약·검증 상태·출처·기존 편집 보존을 확인합니다. 실제 서비스 DB를 사용하지 마세요. 전체 결과는 [Phase 1 보고서](docs/PHASE_1_REPORT.md)에 기록합니다.
