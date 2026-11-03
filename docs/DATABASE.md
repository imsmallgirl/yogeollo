# 데이터베이스 — Phase 1 구현

## 런타임과 연결
PostgreSQL 17.x를 개발·검증 기준으로 선택했다. 실제 통합 검증은 17.11에서 수행했다. Prisma CLI·Client·PostgreSQL adapter는 모두 7.10.1이다. 스키마는 `prisma/schema.prisma`, 최초 migration은 `prisma/migrations/20261102170000_initial/migration.sql`이다. 기본 PostgreSQL `public` 스키마를 사용한다.

Prisma 7의 `prisma-client` generator가 `src/generated/prisma`에 생성하며 생성물은 Git에서 제외한다. 설치 후 및 타입·빌드 검사 전에 생성한다. DB 연결 없이 생성·빌드할 수 있다. migration이나 seed는 빌드에 포함하지 않는다.

`prisma.config.ts`는 Next 환경 로더로 `.env*`를 읽는다. migration CLI는 `DIRECT_URL`이 있으면 우선하고 없으면 `DATABASE_URL`을 사용한다. 실제 앱과 seed는 `DATABASE_URL`만 사용한다. `src/server/db.ts`는 `server-only`와 지연 초기화·프로세스별 연결 재사용을 제공한다. CLI는 `prisma/client.ts`의 동일 factory를 사용한다. 최대 연결 수 5, 연결 대기 5초, idle 30초, statement timeout 10초다. 배포 시 인스턴스 수에 맞춰 연결 예산을 다시 정한다. 인증서 검증을 끄지 않는다.

## 물리 모델과 요구 필드 대응
| 모델 | 필드와 역할 |
| --- | --- |
| BoardGame | UUID id, 고유 slug, nameKo/nameEn, editionNote, min/maxPlayers, min/maxPlayTime, nullable averagePlayTime, nullable complexity/complexityScale, koreanEdition, domesticAvailability, domesticPlayStatus, domesticPopularityStatus, verificationStatus, nullable lastVerifiedAt, createdAt/updatedAt |
| GameEditorial | 게임 1:1 자체 편집. bestPlayers, categories, mechanics, moodTags, nullable difficulty, languageDependency, nullable descriptionKo/setupKo/howToPlayKo/victoryKo/recommendedForKo/cautionsKo, rationaleKo, author, verificationStatus, reviewedAt와 생성·수정일 |
| GameSource | 게임 1:N. id, boardGameId, sourceName/sourceUrl/sourceType, 최신 관측 verifiedAt |
| SourceObservation | 출처 1:N 관측 이력. verifiedAt, verificationStatus, checkedFields, observedFacts(JSONB), collectionMethod, reviewedBy, evidenceNoteKo, usageStatus/usageNoteKo, createdAt |
| ExternalGameId | 게임 1:N. id, boardGameId, provider/externalId. 이번 샘플에는 외부 ID를 추측해 입력하지 않음 |

요청된 BoardGame 필드 중 추천 인원·태그·한국어 소개·언어 의존도는 Phase 0 설계대로 GameEditorial에 물리적으로 분리한다. 도메인 입력은 `BoardGameRecord`의 `facts`와 `editorial`로 구분하며, 추후 추천 DTO에 이들을 결합한다. 외부 facts와 자체 판단의 출처를 혼동하지 않기 위한 구조다. 확인하지 못한 난이도·언어 의존도·평균 시간은 null/UNKNOWN으로 보존한다. complexity는 원자료의 척도 명칭과 함께 보관하며 자체 difficulty로 변환하지 않는다.

## 상태
- verificationStatus: PENDING / VERIFIED / STALE / REJECTED. VERIFIED는 명시된 사실의 출처 대조이며 공개 승인·복제 허가를 뜻하지 않는다.
- domesticAvailability: UNKNOWN / LISTED / IN_STOCK / OUT_OF_STOCK. 상품 노출과 재고 확인을 구분한다.
- domesticPlayStatus와 domesticPopularityStatus: 각각 UNKNOWN / CONFIRMED. 판매에서 플레이·인기를 추론하지 않는다.
- koreanEdition: UNKNOWN / CONFIRMED / NOT_AVAILABLE.
- languageDependency: UNKNOWN / NONE / LOW / MEDIUM / HIGH. 자체 편집 판단이다.
- usageStatus: FACTS_ONLY / PERMISSION_GRANTED / OPEN_LICENSE / UNCONFIRMED. FACTS_ONLY는 소량의 사실 기록 범위이며 라이선스 허가 상태가 아니다.

## 제약과 인덱스
BoardGame slug unique, 검증·유통 상태 복합 인덱스, 인원 범위·시간 범위 인덱스. GameEditorial boardGameId unique. GameSource `(boardGameId, sourceUrl)` unique, SourceObservation `(gameSourceId, verifiedAt)` unique. 복합 unique의 선두 FK가 관계 조회 인덱스를 겸한다. ExternalGameId는 `(provider, externalId)`와 `(boardGameId, provider)` 모두 unique다. GIN은 아직 추가하지 않았다.

SQL CHECK로 양의 인원·시간, min ≤ max, 평균의 범위 포함, 복잡도 값·척도 쌍, 검증 날짜, 빈 이름·잘못된 slug, 관측 JSON 객체 등을 제한한다. 추천 인원의 중복·범위는 양쪽 테이블 trigger로 보강해 게임 가능 인원 변경 시에도 무결성을 지킨다. 배열은 null을 허용하지 않는다. 모든 FK는 `onDelete: Restrict`로 감사 출처가 함께 사라지는 실수를 막는다.

Zod는 필수 필드, enum, URL, 날짜, 추천 인원, slug·출처·외부 ID 중복을 검사한다. VERIFIED 사실은 최신의 이용 근거가 있는 VERIFIED 관측에서 **같은 필드와 값**이 확인되어야 한다. 출처 없는 재고·인기 승격을 막는다. 검증 상태 전환·이력 추가는 향후 수집 파이프라인에서 관리하며 DB 자체가 사실의 진위나 이용 허가를 자동 판정하지 않는다. JSON의 개별 필드 출처 연결과 문자열 URL의 의미 검증은 애플리케이션 책임이다.

## seed·조회·운영 경계
seed는 전체 입력을 먼저 검증한 뒤 트랜잭션 안에서 slug 기준 create-only upsert한다. 기존 게임·자체 편집·관측은 덮어쓰거나 삭제하지 않는다. seed 재실행은 신규 관측 갱신 수단이 아니다. 샘플 수정 반영은 별도 검토와 데이터 변경 절차로 수행한다.

`src/server/games.ts` 기본 조회는 VERIFIED 게임만 읽고 VERIFIED 편집만 반환한다. 결과의 Decimal·Date는 number·ISO 문자열로 직렬화하고 다시 Zod 검증한다. 손상된 VERIFIED 데이터는 임의 보정하지 않고 검증 오류로 차단한다. Phase 3 카탈로그는 이 조회 결과에서 별도 공개 검토 목록의 slug만 UI 추천에 전달한다. 사람의 공개·권리 검토 전에는 운영 서비스에 공개하지 않는다. 개발 미리보기는 DB와 별개로 기존 개발용 샘플만 읽는다. 이 단계에서 DB 모델과 마이그레이션은 변경하지 않았다.

통합 테스트는 명시적인 `TEST_DATABASE_URL`만 사용하고 DB 이름이 `_test`로 끝나야 한다. 범위·중복 테스트의 임시 변경은 롤백한다. seed 보존 테스트는 전용 DB에서 기존 편집을 확인 후 원복한다. 운영 DB에서는 테스트를 실행하지 않는다.

## Phase 4 사용 범위
물리 모델·migration·seed는 변경하지 않았다. 상세는 기존 공개 검토 카탈로그를 통과한 사실과 VERIFIED 편집만 운영에 표시한다. 개발용 규칙 요약 DRAFT는 별도 파일에서 preview에만 연결하며 DB 값을 덮어쓰거나 추천 태그를 승격하지 않는다. 룰렛 선택은 브라우저 상태이며 DB에 저장하지 않는다.

## Phase 5 구현
ImportBatch는 UUID, 유일 SHA-256 digest, JSON payload/baseState/plan, PENDING→APPROVED/REJECTED→(승인만)APPLIED 상태, 검토자·사유·시각, 반영 시각·결과를 저장한다. status+createdAt 인덱스와 상태·JSON·해시 CHECK를 추가했다. SQL trigger로 원문·기준·계획 변경/삭제와 잘못된 전이를 차단한다. SourceObservation은 append-only이며 재검증은 새 관측으로 기록한다. 승인과 반영 시 기준 스냅샷을 대조하고 전체 쓰기는 Serializable 트랜잭션으로 처리한다. 기존 자체 편집·관측·생략된 ID는 보존한다. migration: 20261102190000_import_batches. 테스트는 기존 DB와 별도 IMPORT_TEST_DATABASE_URL을 사용한다.

## Phase 5 데이터 확장 보완
실제 개발 자료는 15개다. 신규 14개의 외부 식별자는 akongdakong 상품번호이며 DB 스키마·migration은 바꾸지 않았다. seed는 공통 data/catalog.ts에서 전체 목록을 검증한 후 기존 create-only 방식으로 신규 slug만 입력한다. 테스트 DB에서 기존 자료·관측·자체 편집 보존과 15개 조회를 검증했다.
