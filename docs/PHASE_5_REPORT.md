# Phase 5 완료 보고 — 검토 기반 데이터 가져오기

## 범위
사용자의 다음 단계 승인에 따라 Phase 5만 구현했다. 실제 데이터 추가·사람의 승인 대행·공개 목록 수정·크롤링·BGG 연동·배포는 수행하지 않았다. 기존 실제 샘플 1개, 운영 공개 승인 0개를 유지한다. 테스트 합성 자료는 격리된 임시 DB에서만 사용했다.

## 변경 파일과 구현
| 파일 | 내용 |
| --- | --- |
| `src/domain/data-import/schema.ts` | 1~100개 게임의 strict 입력, 권한 근거, 자체 편집 분리, 중복 ID·인증 URL·정밀도 검증 |
| `src/domain/data-import/plan.ts` | 생성/변경/동일 계획, 수집 권한·검증·미래일·BGG·판본·이름·ID·관측 충돌 검사 |
| `src/domain/data-import/digest.ts` | 정규 JSON SHA-256, 공개 내용·출처 해시. Node 서버/CLI 전용 |
| `prisma/import-service.ts` | 접수·해시 대조 검토·반영·조회, 기준 상태 변경 감지, 기존 편집 보존, Serializable 원자적 반영·재시도 |
| `scripts/data-import.ts`, `package.json` | 오프라인 check, stage, inspect, review, apply, publication CLI. 최대 2MiB의 제한 읽기와 오류 정보 보호 |
| `prisma/schema.prisma`, `prisma/migrations/20261102190000_import_batches/migration.sql` | ImportBatch 감사 모델·상태·인덱스·CHECK, 불변 내용·이력 상태 전이와 append-only 관측 trigger |
| `src/domain/games/schema.ts` | 허가된 파일 방식 PERMITTED_FILE을 관측 계약에 추가 |
| `src/server/catalog.ts`, `catalog.test.ts` | 기존 공개 승인에 recordDigest 일치 요구. 내용 변경 시 공개 중단, 미검토 편집 제외 |
| `src/domain/data-import/import.test.ts`, `cli.test.ts`, `tests/integration/import.test.ts` | 계약·정책·해시·오프라인 CLI, PostgreSQL 동시성·승인·보존·롤백·SQL 제약 테스트 |
| `data/imports/splendor-unreviewed.json`, `README.md` | 기존 사실의 미승인 구조 예시. 권한 UNCONFIRMED, 실제 신규 자료 아님 |
| `.env.example`, `GETTING_STARTED.md`, `docs/DATA_IMPORT.md`, 기존 6개 개발 문서, 본 보고서 | 분리 테스트 DB·운영 절차·권한/공개 경계·현황·검사 기록 |

신규 의존성은 없다. UI·추천 순위는 변경하지 않았다. 외부 사실과 자체 편집·공개 승인 경계를 유지했다. 공개 해시는 DB 내부 ID·수정 시각을 제외하고 동일한 공개 내용과 출처에 묶인다. 데이터 가져오기 승인은 웹 공개를 자동 승인하지 않는다.

## 최종 검증
| 검사 | 결과 |
| --- | --- |
| `pnpm lint` | 통과 |
| `pnpm typecheck` | 통과, TypeScript strict 유지 |
| `pnpm test` | 16파일·203개 통과 |
| `pnpm db:validate` | 통과 |
| `pnpm test:db` | 2파일·28개 통과: 기존 20개 + 가져오기 8개 |
| migration deploy/status/diff | 새 임시 DB 2곳에서 두 migration 적용, 최신 상태, Prisma schema 차이 없음 |
| `pnpm build` | Webpack 명시 후 통과, DB 연결 없이 페이지 생성 |
| `pnpm test:e2e` | 32개 통과: desktop/mobile/320px 각 10개, production 2개 |
| `git diff --check` | 통과 |

초기 기본 Turbopack 빌드는 sandbox 내부 로컬 포트 생성 제한으로 실패했고 권한 허용 후에도 같은 오류가 발생했다. 공식 `next build --webpack`은 성공해 변경 이유를 사전 보고하고 build 스크립트에 이를 명시했다. 개발 서버는 기존 Turbopack으로 E2E를 통과했다. 최초 DB 통합 테스트에서는 새 관측일과 사실 확인일이 어긋난 테스트 픽스처를 바로잡았고, 불완전한 VERIFIED 픽스처가 차단되는 것도 확인했다. 최종 통합 검사는 모두 통과했다. PostgreSQL 드라이버에서 기존에도 관측된 pg 차기 버전 관련 DeprecationWarning이 발생하며 검사 실패는 아니다. 드라이버 교체는 이 단계에서 진행하지 않았다.

DB 검증은 Unix socket 전용 PostgreSQL 17 임시 클러스터와 서로 다른 `_test` DB 두 곳에서 실행했다. 동시 접수·반영의 중복 방지, 잘못된 해시·미승인 반영 차단, 승인 전후 DB 변경 차단, 기존 편집·외부 ID·생략된 관측 보존, 이력 변조·삭제 차단을 검증했다. 두 번째 게임의 SQL 저장을 의도적으로 실패시켜 첫 게임과 반영 상태가 함께 롤백됨을 확인했다. 기존 사용자 개발 서버는 건드리지 않고 브라우저용 3173/3174 서버만 자동 종료했다. 생성 산출물·DB·테스트 이력은 Git에 포함하지 않는다.

## 미완료와 다음 승인
권한 확인 자료의 추가 확보, 실제 사람의 출처·판본·이용 범위·자체 편집 검토, 실제 게임의 공개 승인은 남아 있다. 100개를 채우거나 승인자를 꾸며 내지 않았다. CLI의 검토자 문자열은 신원 인증이 아니며 DB 접근 권한이 있는 신뢰 운영자용이다. 자동 수집·이미지 수집·BGG API·관리자 웹 UI·주기적 재고/인기 확인은 구현하지 않았다. 실제 이용 허가가 생기면 해당 범위에서 파일을 준비하고 명시적 검토 절차를 거쳐야 한다.

Phase 6의 배포 준비·실제 배포는 시작하지 않는다. Phase 5 변경만 하나의 커밋으로 남기고 사용자 승인을 기다린다.
