# 개발 시작

기존 프로젝트 설명은 `README.md`에 그대로 보존했습니다. 현재 **Phase 5(검토 기반 가져오기)**까지 구현했고, 추가 요청으로 개발 카탈로그를 **15개**로 확장했습니다. 개발 환경에서는 DB 없이 여러 실제 게임의 추천·상세·룰렛을 확인할 수 있습니다.

## 실행
Node 24.x와 pnpm 11.5.1을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

http://localhost:3000 에서 조건을 선택해 추천 결과를 확인합니다. `.env.example`을 참고해 필요할 때 `.env.local`을 작성하세요. 개발 기본 미리보기에는 DB나 비밀키가 필요하지 않습니다. DB 작업은 아래 절차로 별도 실행합니다.

## 검사
```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright는 3173 포트의 격리된 개발 서버와 3174 포트의 운영 서버를 자동 실행합니다. 먼저 `pnpm build`가 성공해야 합니다. desktop/mobile/320px Chromium과 운영 환경의 미검토 데이터 차단을 검사합니다. 기존 3147 서버는 재사용하거나 종료하지 않습니다. 실제 iOS Safari 검증은 별도입니다. production 실행은 `pnpm build` 후 `pnpm start`입니다. 정식 공개 전까지 검색 색인을 비활성화했습니다.

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
DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/yogeollo_import_test' DIRECT_URL='' pnpm db:deploy
TEST_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/yogeollo_test' IMPORT_TEST_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/yogeollo_import_test' pnpm test:db
```

통합 테스트는 DB에 샘플을 입력하고 seed 재실행·SQL 제약·검증 상태·출처·기존 편집 보존을 확인합니다. 실제 서비스 DB를 사용하지 마세요. 전체 결과는 [Phase 1 보고서](docs/PHASE_1_REPORT.md)에 기록합니다.

## 추천 엔진 (Phase 2)
추천 함수는 `src/domain/recommendation/recommend.ts`, 조건 계약은 `preferences.ts`에 있습니다. 네트워크·DB 없이 `pnpm test`로 추천 로직을 검사할 수 있습니다. Phase 3에서 이 엔진을 결과 화면과 연결했습니다. 기능 구현 완료는 데이터 공개 승인이나 다음 단계 진행 승인을 뜻하지 않습니다.

추천 입력과 정렬·완화 정책은 [추천 엔진 문서](docs/RECOMMENDATION_ENGINE.md), 변경 파일과 검증 결과는 [Phase 2 보고서](docs/PHASE_2_REPORT.md)를 참고하세요.

## 홈·결과와 데이터 모드 (Phase 3)
홈에서 인원·시간·분위기·난이도를 고르면 `/recommend`의 URL에 조건을 저장합니다. 7명 이상은 정확한 정수 인원을 입력합니다. 결과에서 조건을 다시 고르면 이전 값을 복원합니다. 중복 키·잘못된 조건은 추천 전에 검증합니다. 결과 카드에서 상세를 열거나, 추천 후보를 골라 룰렛으로 결정할 수 있습니다. 푸터에서 서비스 소개로 이동합니다.

GAME_DATA_MODE 미설정 시 development/test는 preview, 운영은 database입니다. 개발 preview는 기존 샘플 1개만 사용하고 화면에 미리보기임을 표시합니다. 실제 게임 정보를 추정해 추가하지 않습니다. 운영은 preview 지정으로도 미검토 샘플을 표시하지 않습니다.

운영 추천에는 실제 출처·판본·이용 범위 검토를 마친 `data/publication-approvals.json` 기록과 DB의 VERIFIED 사실이 모두 필요합니다. 현재 공개 검토 목록은 비어 있어 운영 실행에서는 ‘게임 정보를 확인하고 있어요’가 정상입니다. 승인 기록을 임의로 만들지 마세요. 검토된 자료가 존재하는데 DB 조회가 실패하면 별도 오류 안내를 제공하고 샘플로 대체하지 않습니다.

새 의존성·DB 스키마 변경은 없습니다. [Phase 3 보고서](docs/PHASE_3_REPORT.md)에 검사와 미완료 사항을 정리합니다. 다음 Phase는 별도 승인 후 진행합니다.

## 상세·룰렛·소개 (Phase 4)
개발 서버에서 `/games/splendor`의 자체 작성 요약 초안을 볼 수 있습니다. 공개 검토 목록이 비어 있는 운영 환경의 같은 주소는 404가 정상이며, 미리보기 플래그로 우회되지 않습니다. `/about`은 추천·출처·룰렛 원칙을 설명합니다.

현재 실제 샘플은 1개라 룰렛의 단일 후보 선택은 즉시 완료됩니다. 2~5개가 추천되면 선택한 후보만 동일 가중치로 뽑아 실제로 회전합니다. 후보를 모두 해제하면 실행할 수 없고, 동작 줄이기 설정에서는 회전 없이 결과를 표시합니다. 여러 후보를 보여주려고 가짜 게임을 추가하지 않았습니다.

`pnpm test`에는 jsdom 기반 다중 후보 상호작용·중복 실행·동작 줄이기 테스트를 포함합니다. `pnpm build` 후 `pnpm test:e2e`는 desktop/mobile/320px의 상세·소개·단일 후보·빈 선택과 실제 production의 상세 404 경계를 확인합니다. [Phase 4 보고서](docs/PHASE_4_REPORT.md)에 변경 파일과 한계를 정리합니다. Phase 5는 사용자 승인 전까지 진행하지 않습니다.

## 검토 기반 가져오기 (Phase 5)

권한을 확인한 JSON 파일을 오프라인 검사 → 대기 접수 → 해시 대조·수동 검토 → 원자적 반영 순서로 처리합니다. 명령과 운영 절차는 [데이터 가져오기 문서](docs/DATA_IMPORT.md)를 따르세요. 자동 크롤링·BGG 연동·실제 자료의 승인·공개는 수행하지 않았습니다. 기존 실제 샘플은 1개, 공개 승인 목록은 0개입니다. 공개 목록에는 이제 검토한 내용의 recordDigest도 필요하며 변경된 데이터는 재검토 전까지 노출하지 않습니다. [Phase 5 보고서](docs/PHASE_5_REPORT.md)에 결과를 기록합니다. Phase 6는 별도 승인 후 진행합니다.

빌드는 `next build --webpack`을 사용합니다. 현재 실행 환경에서 Turbopack production 빌드의 내부 포트 생성이 차단되어, Next가 제공하는 Webpack 옵션을 명시했습니다. 개발 서버는 기존 Turbopack을 유지합니다.

## 실제 게임 데이터 1차 확장

공식 유통사 상품 안내를 개별 대조해 14개를 추가했고 총 15개를 제공합니다. DB 없이 개발 미리보기에 바로 반영되며, DB 사용 시 기존 `pnpm db:seed`는 신규 slug만 생성합니다. 기존 데이터와 편집을 덮어쓰지 않습니다. 자체 편집이 없는 항목은 확인 중으로 표시하며 운영 공개 승인은 0개를 유지합니다. [출처·변경 파일·검사 보고서](docs/DATA_EXPANSION_1_REPORT.md)를 참고하세요. 이하 과거 Phase별 기록의 1개 수량은 당시 상태입니다.
