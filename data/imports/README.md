# 가져오기 입력 예제

`splendor-unreviewed.json`은 기존 `data/games/splendor.json`의 사실·출처를 복사한 구조 예제다. 자체 편집은 외부 수집과 분리하기 위해 null이다. 신규 실제 데이터·사람의 검토·수집 허가를 추가한 것이 아니다.

권한이 UNCONFIRMED이므로 `pnpm data:check --file data/imports/splendor-unreviewed.json`은 정책 문제와 종료 코드 2를 반환해야 한다. 화면 확인이나 테스트를 위해 실제 검토 없이 권한을 CONFIRMED로 바꾸지 않는다. 접수·검토·반영·별도 공개 절차는 `docs/DATA_IMPORT.md`를 따른다.
