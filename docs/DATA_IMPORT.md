# Phase 5 — 검토 기반 데이터 가져오기

## 범위와 권한
자동 크롤러·스케줄러·BGG API·이미지 다운로드는 구현하지 않는다. 수집·이용 근거를 실제 확인한 수동 사실 대조 또는 허가된 JSON 파일만 받는다. 네트워크로 출처 URL에 접속하는 코드가 없다. BGG 출처 타입·도메인·제공자 표기는 승인 여부가 확인되지 않아 차단한다. 다른 URL의 실제 권리 확인은 운영자의 책임이며 CONFIRMED 문자열을 법적 허가로 판정하지 않는다.

이 CLI는 DB 접근 권한을 가진 신뢰할 수 있는 로컬 운영자용이다. 웹 관리 API·인증·권한 위임 기능은 없다. reviewer는 실제 검토자 이름을 기록하는 감사 정보이고 신원을 인증하지 않는다. 앱 실행·설치·빌드 시 가져오기를 자동 실행하지 않는다.

## 입력 계약
`src/domain/data-import/schema.ts`의 strict Zod 계약을 따른다. version=1, 양의 revision, label, collectedBy, collectedAt, acquisition, games가 필수다. acquisition은 method(MANUAL_REVIEW/PERMITTED_FILE), permissionStatus(UNCONFIRMED/CONFIRMED), 실제 근거를 적는 permissionBasis다. 파일은 UTF-8 JSON 2MiB 이하, 게임은 1~100개다. 수집 파일의 개인정보·비밀값은 사전에 제거한다. 출처 URL의 사용자명·비밀번호는 거부한다.

각 게임은 기존 사실·출처·관측·외부 ID 계약을 따르고 editorial은 반드시 null이다. 자체 작성 태그·규칙은 이 경로로 수정하지 않는다. VERIFIED 사실은 필드와 값이 출처 관측에 대응해야 하며, 출처 확인일은 최신 관측일, 사실 확인일은 포함된 검증 관측일이어야 한다. 날짜는 밀리초, 복잡도는 소수 둘째 자리까지 받는다. DB 반올림으로 승인 내용이 달라지는 일을 막는다.

`data/imports/splendor-unreviewed.json`은 기존 샘플을 감싼 구조 예시다. 신규 게임이나 수집 허가가 아니며 권한은 UNCONFIRMED다. 예제를 검토자 이름으로 임의 승인하지 않는다. 실제 데이터는 기존 1개이고 공개 승인 목록은 0개다.

## 운영 순서
먼저 별도 관리하는 실제 DB 주소를 설정하고 검토된 migration을 적용한다. CLI는 DATABASE_URL, migration은 DIRECT_URL이 있으면 우선 사용한다. 출력은 로컬 검토용이며 공개 로그에 올리지 않는다.

```sh
pnpm db:deploy
pnpm data:check --file /path/to/authorized.json
pnpm data:stage --file /path/to/authorized.json
pnpm data:inspect --batch <UUID>
pnpm data:review --batch <UUID> --digest <검토한_SHA256> --decision approve --reviewer '실제 검토자' --notes '실제 확인한 출처·판본·이용 근거'
pnpm data:apply --batch <UUID>
```

`check`는 DB 없이 형식과 정책을 검사한다. databaseCompared=false이며 DB 중복 검사를 마쳤다는 의미가 아니다. 종료 코드는 0(오프라인 검사 적격), 2(유효하지만 권한·정책 문제), 1(형식·파일·연결·실행 실패)이다. 예제 파일의 예상 종료 코드는 2다.

`stage`는 DB와 비교해 payload·기준 상태·변경 계획·문제를 ImportBatch에 저장한다. BoardGame은 변경하지 않는다. 형식 오류는 접수하지 않지만 권한 미확인 등 정책 문제는 검토 대기 기록으로 보관한다. JSON 키 순서·공백과 무관한 동일 내용 해시는 같은 batch를 반환한다. 새로운 검토를 위해서는 실제 근거·내용을 수정하거나 revision을 올린 새 파일을 제출한다.

`inspect`로 전체 보관 내용·문제·기준 상태를 확인한 뒤 실제 대조한 파일 해시를 review에 전달한다. 승인·반려 모두 검토자와 사유가 필요하다. 반려는 `--decision reject`로 기록한다. 완료된 결정을 바꿀 수 없고, 동일 검토자·사유의 동일 결정 재시도만 허용한다. 승인 시 현재 DB와 다시 비교하며 모든 정책 문제를 해결해야 한다.

`apply`는 APPROVED만 허용한다. 승인 이후 기준 DB가 달라지면 BASE_CHANGED로 중단하고 새 revision 접수·검토를 요구한다. 전체 게임·출처·관측·외부 ID·감사 결과를 Serializable 트랜잭션 하나로 반영한다. 충돌·중복 오류는 최대 3회 시도하며 계속 실패하면 아무 부분도 확정하지 않는다. 이미 APPLIED이면 같은 기록을 반환한다.

## 병합·재검증 정책
- slug가 같아도 이름·판본이 다르면 자동 병합하지 않는다. 다른 slug의 이름 중복, 대소문자를 정규화한 제공자·외부 ID 충돌도 수동 확인 대상으로 차단한다. 판본 통합·ID 교정·삭제는 별도 검토 작업이다.
- 기존 자체 편집과 생략된 출처·관측·외부 ID는 보존한다. 사실 업데이트로 기존 권장 인원이 가능 범위를 벗어나면 차단한다.
- 출처 이름·타입과 같은 출처·확인일의 관측을 덮어쓰지 않는다. 출처보다 오래된 확인일도 거부한다. 재검증은 새 확인일의 관측을 추가하고 출처의 최신 확인일을 갱신한다. 사실은 해당 관측의 필드·값으로 대조한다.
- 미래 수집·관측일과 이용 범위 UNCONFIRMED는 차단한다. 보편적인 유효기간을 임의 생성하지 않는다. 자동 재고·인기 검증이나 일정 기반 STALE 전환은 구현하지 않았다.
- DB trigger도 ImportBatch의 원문·기준·계획 변경과 삭제, 잘못된 상태 전이, 관측 수정·삭제를 막는다. 원문·기준 상태는 이력이며 개인정보 정정·법적 삭제가 필요하면 별도 검토된 관리 절차가 필요하다.

## 공개는 별도 검토
DB 반영이 서비스 공개를 뜻하지 않는다. 실제 출처·판본·이용 범위·공개 콘텐츠 검토를 마친 운영자가 다음 명령으로 현재 내용의 해시를 확인한다. 이 명령은 공개 목록을 수정하지 않는다.

```sh
pnpm data:publication --slug <slug>
```

검토한 `recordDigest`, slug, 실제 reviewedBy, approvedAt, usageBasis를 `data/publication-approvals.json`에 코드 리뷰로 기록해야 한다. 현재 목록은 비워 둔다. 해시는 사실·검증 편집·출처 이력·외부 ID를 묶으며 DB 내부 ID·수정 시각과 미검토 편집은 제외한다. 내용이 달라지면 이전 공개 승인은 일치하지 않아 노출을 중단한다. DB 조회도 VERIFIED 사실만 반환한다. 운영은 미리보기로 우회하지 않는다. Node crypto는 서버/CLI에서만 사용한다.

## 통합 테스트
실서비스와 분리된 두 개의 `_test` DB를 만든다. 기존 DB 테스트는 샘플 1개를 기대하므로 가져오기 합성 자료용 DB를 분리한다. TEST_DATABASE_URL과 IMPORT_TEST_DATABASE_URL을 같은 주소로 지정할 수 없다. 테스트는 자체 합성 자료를 만들며 파일·운영 데이터·공개 목록에 이를 추가하지 않는다.

```sh
DATABASE_URL='<기존_테스트_DB_URL>' DIRECT_URL='' pnpm db:deploy
DATABASE_URL='<가져오기_테스트_DB_URL>' DIRECT_URL='' pnpm db:deploy
TEST_DATABASE_URL='<기존_테스트_DB_URL>' IMPORT_TEST_DATABASE_URL='<가져오기_테스트_DB_URL>' pnpm test:db
```

테스트는 전용 DB에 이력을 남기므로 테스트 후 해당 임시 서버를 종료한다. 두 번째 게임에만 실패를 일으키는 테스트 전용 trigger로 부분 반영 롤백을 검증하며 finally에서 이 trigger를 제거한다. 운영 migration에는 포함하지 않는다.
