# Phase 1 완료 보고

## 구현
사용자의 다음 단계 승인에 따라 DB 모델과 소량 사실 확인 샘플만 구현했다. 홈과 결과 UI·추천 엔진·룰렛은 변경하거나 구현하지 않았다.

| 변경 파일 | 내용 |
| --- | --- |
| `prisma/schema.prisma` | BoardGame, GameEditorial, GameSource, SourceObservation, ExternalGameId와 enum·관계·인덱스 |
| `prisma/migrations/20261102170000_initial/migration.sql`, `migration_lock.toml` | PostgreSQL 최초 migration, 인원·시간·복잡도 CHECK, 추천 인원 무결성 trigger, unique·FK |
| `prisma.config.ts`, `prisma/client.ts` | Prisma 7 설정, Next 환경 로더, PostgreSQL adapter·연결 제한 |
| `prisma/seed.ts`, `seed-data.ts` | 전체 입력 검증 후 트랜잭션 create-only seed, 기존 편집 보존 |
| `src/server/db.ts`, `games.ts` | 서버 전용 지연 연결·검증 데이터 조회·미검토 편집 차단·직렬화 |
| `src/domain/games/schema.ts`, `schema.test.ts` | 독립 Zod 계약·교차 필드 검증·출처 필드와 실제 값 대조·중복 차단 |
| `src/lib/database-env.ts`, `database-env.test.ts` | PostgreSQL 주소 검증과 오류의 비밀값 노출 방지 |
| `data/games/splendor.json`, `README.md` | 외부 문구·이미지 복제 없는 사실 확인 샘플 1개, 자체 편집 초안 분리 |
| `tests/integration/database.test.ts`, `vitest.database.config.ts` | 전용 PostgreSQL DB 통합 테스트 |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | adapter·Next 환경 로더·server-only·tsx, DB 명령·생성 단계·esbuild 설치 정책 |
| `.env.example`, `.gitignore`, `eslint.config.mjs` | 서버 환경 예시, Prisma 생성물 제외 |
| `GETTING_STARTED.md`, `docs/PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `DATA_SOURCES.md`, `DEVELOPMENT_PLAN.md` | 실제 모델·상태·운영 절차·출처·진행 상태 동기화 |

## 데이터 범위와 한계
스플렌더 기본판 1개만 기록했다. [국내 유통사 채널](https://link.inpock.co.kr/koreaboardgames)에서 한국어 이름·상품 노출을, [퍼블리셔](https://www.asmodee.it/product/splendor/)에서 기본판 인원·표기 시간을 대조했다. 국내 상품 노출(LISTED)은 재고·국내 인기·한국어판 확인과 구분했다. 한국 유통 판본의 구성물 대조도 미완료다.

실측 평균·복잡도·추천 인원·난이도·언어 의존도·BGG ID는 추측하지 않았다. 자체 소개와 태그는 PENDING 편집 초안이며 서버 기본 조회에 노출하지 않는다. VERIFIED는 명시한 사실의 에이전트 출처 대조이며 사람의 공개 승인이나 복제 허가 취득을 뜻하지 않는다. 공개 서비스용 승인 데이터는 아직 0개다. 이용 근거는 FACTS_ONLY로 한정하며 외부 이미지·상세 문구·규칙 원문·가격·대량 수집은 없다.

## 최종 검사
| 검사 | 결과 |
| --- | --- |
| `pnpm lint` | 통과, 오류·경고 0 |
| `pnpm typecheck` | 통과, Prisma 생성·Next 타입 생성·strict 타입 검사 |
| `pnpm test` | 3 파일, 21 테스트 통과 |
| `pnpm build` | DB 환경변수·연결 없이 통과, 기존 정적 페이지 생성 |
| `pnpm db:validate` | 통과 |
| `pnpm peers check` | 충돌 없음 |
| 빈 PostgreSQL 17.11 DB의 `pnpm db:deploy` | 최초 migration 적용 성공 |
| `pnpm db:seed` 및 반복 실행 | 샘플 1개·출처 2개·관측 2개, 기존 ID·편집 보존 |
| `pnpm test:db` | 1 파일, 20 테스트 통과 |
| migration deploy 재실행·status | 미적용 migration 없음, 최신 상태 |
| `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` | 차이 없음, 종료 코드 0 |
| `git diff --check` | 통과 |

UI를 변경하지 않아 Playwright는 이번 단계에 재실행하지 않았다. Phase 0의 desktop/mobile smoke 통과 기록은 별도 보고서를 따른다.

## 실제 DB 검증과 환경
환경에 PostgreSQL과 Docker가 없어 승인된 Homebrew 설치로 PostgreSQL 17.11을 준비했다. Homebrew가 필요한 시스템 의존성도 설치·갱신했다. 로그인 시 자동 실행하는 서비스는 등록하지 않았다. `/private/tmp/yogeollo-phase1-postgres`의 임시 클러스터를 Unix 소켓 전용으로 실행해 외부 TCP 연결을 받지 않았다. 최종 테스트는 별도 `yogeollo_phase1_final_test` DB에서 수행했다. 저장소에 자격정보·실제 `.env`·DB 파일은 추가하지 않았다. 검증 후 임시 PostgreSQL 서버를 종료했다.

개발 중 빈 URL에서 원시 URL 예외가 발생하는 문제를 검증해 수정했고, Node ESM에서 Next 환경 로더를 읽는 import 방식도 실제 seed 실행으로 확인해 조정했다. 필수 검사와 통합 검사는 최종 수정 후 통과했다. pg 드라이버가 Prisma 트랜잭션 실행 중 query 동시 호출 관련 deprecation 경고를 한 차례 출력했지만 검사는 통과했다. 추가 의존성으로 경고를 숨기지 않았으며 차기 adapter 업데이트 시 확인한다. 기존 ESLint 9 지원 종료 설치 경고도 남아 있다.

## 다음 단계와 미완료
사람의 출처·판본·이용 범위·편집 공개 검토, 추가 검증 게임 확보, 실제 개발/배포 DB 주소 설정은 남아 있다. 추천 알고리즘·후보 다양성·추천 이유·조건 완화는 Phase 2, 입력/결과 UI는 Phase 3, 상세·룰렛은 Phase 4, 자동 수집은 Phase 5다. 이번 단계에서 웹사이트의 동작은 준비 화면을 유지한다.

**Phase 1 완료 커밋을 남기고 종료한다. 사용자 승인 전까지 Phase 2를 시작하지 않는다.**
