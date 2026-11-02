# 데이터베이스 설계안

이 문서는 Phase 1 구현 기준이다. 이번 단계에는 Prisma 스키마·마이그레이션·seed·DB 연결이 없다. 대상 DB는 PostgreSQL이며 로컬과 호스팅 버전은 Phase 1에 확정한다.

## BoardGame
사용자 요청 필드 `id`, `slug`, `nameKo`, `nameEn`, `minPlayers`, `maxPlayers`, `bestPlayers`, `minPlayTime`, `maxPlayTime`, `complexity`, `categories`, `mechanics`, `moodTags`, `languageDependency`, `koreanEdition`, `domesticAvailability`, `descriptionKo`, `verificationStatus`, `lastVerifiedAt`, `createdAt`, `updatedAt`을 유지한다.

id는 UUID, slug는 unique, 한국어 이름은 필수, 영문 이름은 nullable. 인원·시간은 양의 정수이며 min ≤ max. `bestPlayers`는 정수 배열이며 가능 범위 내 값만 허용한다. 시간 원자료의 범위를 저장하고 실제 평균은 출처가 있을 때 별도 nullable 필드에 저장한다. complexity는 출처 척도와 값 또는 null로 저장하고 자체 난이도 레벨과 구분한다. 배열은 PostgreSQL 배열을 고려한다.

`koreanEdition`, `domesticAvailability`, `languageDependency`는 unknown을 표현하는 enum을 사용한다. 국내 판매는 AVAILABLE / UNAVAILABLE / UNKNOWN, 검증은 PENDING / VERIFIED / REJECTED / STALE로 구분한다. 인기 지표는 판매 여부에서 추론하지 않으며 별도 관측 모델로 추가한다. lastVerifiedAt은 미검증이면 nullable이다.

## GameSource
id UUID, boardGameId FK, sourceName, sourceUrl, sourceType, verifiedAt. 게임 1:N 출처. sourceType은 국내 유통사·출판사·BGG·허가 공개데이터·자체 편집을 구분한다. `(boardGameId, sourceUrl)` unique, boardGameId 인덱스. URL은 출처 위치이며 복제 권한을 뜻하지 않는다.

출처별 `checkedFields`, 수집 방식, 라이선스/허가 근거, 확인자, 확인 결과, 원자료 관측일을 추가해 필드별 근거를 추적한다. verifiedAt만으로 판매 중·인기 등 모든 사실이 확인됐다고 해석하지 않는다. 변경 이력은 덮어쓰기 대신 관측 기록으로 보존한다.

## ExternalGameId
id UUID, boardGameId FK, provider, externalId. 게임 1:N 외부 ID. `(provider, externalId)` unique 및 `(boardGameId, provider)` unique. 판본·확장판 병합 여부는 사람이 검토한다.

## 자체 편집 데이터 분리
별도 GameEditorial 1:1 모델로 자체 추천 분위기·난이도·권장 인원 근거·descriptionKo·준비·기본 진행·승리·추천 대상·주의점을 관리한다. 요청된 BoardGame 필드 중 자체 작성 필드는 이 관계에서 조회하는 도메인 projection으로 제공한다. 외부 facts와 자체 판단은 source/provenance를 섞지 않는다. 실제 schema에서 물리적 위치를 확정하고 문서를 동기화한다.

## 제약·인덱스
slug unique, `(verificationStatus, domesticAvailability)`, 인원 범위, 시간 범위 조회 인덱스를 검토한다. 배열 검색 GIN은 데이터량과 쿼리 계획 확인 후 추가한다. 단일 조건마다 무조건 인덱스를 만들지 않는다. SQL CHECK로 인원·시간·complexity 범위를 보강하고 Zod로 배열·교차 필드 조건을 검증한다. 출처와 외부 ID 삭제는 게임 삭제 시 cascade를 고려하되 감사 이력 보존 정책을 먼저 정한다.
