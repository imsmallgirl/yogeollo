# Phase 5 추가 작업 — 실제 게임 데이터 1차 확장

## 결과와 범위
사용자의 “데이터를 추가해봐” 요청에 따라 Phase 5의 데이터 확보 범위만 보완했다. 공식 유통사 상품 안내를 개별 조회·대조해 **14개를 추가하고 총 15개**로 확장했다. 개발 추천·상세·룰렛과 DB seed가 같은 목록을 사용한다. Phase 6나 배포는 진행하지 않았다.

확인 시각: 2026-11-03T14:32:51Z. 이 시각은 에이전트가 제공된 공개 페이지 응답을 대조한 시각이며 원격 재고 서버의 갱신 시각이 아니다. 검색·웹 도구의 캐시 응답을 포함하므로 현재 구매 가능 재고를 보장하지 않는다.

## 새로 기록한 게임
| 게임 | 인원 | 표기 시간 | 확인한 상품 |
| --- | --- | --- | --- |
| 젝스님트 | 2~10명 | 20분 | [상품번호 309](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=309) |
| 카르카손 | 2~5명 | 35분 | [상품번호 1000000871](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1000000871) |
| 커피 러시 | 2~4명 | 30분 | [상품번호 1000001019](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1000001019) |
| 다빈치 코드 | 2~4명 | 15분 | [상품번호 8](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=8) |
| 딕싯 | 3~8명 | 30분 | [상품번호 1000000059](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1000000059) |
| 도블 | 2~8명 | 15분 | [상품번호 1589](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1589) |
| 달무티 | 4~8명 | 15분 | [상품번호 916](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=916) |
| 할리갈리 링엘딩 | 2~8명 | 10분 | [상품번호 130](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=130) |
| 할리갈리 | 2~6명 | 15분 | [상품번호 118](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=118) |
| 클라스크 | 2명 | 10분 | [상품번호 1000000088](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1000000088) |
| 로보77 | 2~8명 | 30분 | [상품번호 21](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=21) |
| 루미큐브 클래식 | 2~4명 | 20분 | [상품번호 25](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=25) |
| 사보타지 | 3~10명 | 30분 | [상품번호 995](https://akongdakong.co.kr/goods/goods_view.php?goodsNo=995) |
| 우봉고 | 1~4명 | 25분 | [상품번호 1000000935](https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1000000935) |

스플렌더의 기존 파일·관측·PENDING 편집은 그대로 보존했다. 이름·인원·시간·판본 범위·국내 상품 노출만 사실로 기록했다. 출처 URL·확인일·필드별 값·검증 상태·확인자·이용 범위·주의사항을 각 JSON의 observations에 남겼다. 게임별 외부 식별자는 페이지에서 확인한 `akongdakong` 상품번호다. BGG ID는 추측하지 않았다.

## 판본과 한계
- 루미큐브 클래식은 해당 상품 안내의 20분, 카르카손은 35분, 젝스님트는 20분을 기록했다. 통상 알려진 시간이나 다른 판본의 시간을 섞지 않았으며 실측 평균은 모두 null이다.
- 딕싯은 해당 모델의 3~8명, 우봉고는 1~4명을 기록했다. 서비스 입력은 기존 2명 이상을 유지한다. 수업용 PPT 제공 같은 판촉 표현은 게임명에서 제외했다.
- 사보타지는 검색 제목 “사보타지 2017”과 상품필수정보의 사보타지 모델 범위를 함께 기록했다. 사보타지·카르카손의 구매 불가 안내를 보고도 재고를 IN_STOCK으로 승격하지 않았다. 전체 신규 자료는 LISTED이며 판매량·국내 플레이·인기는 UNKNOWN이다.
- 달무티와 젝스님트에 같은 모델 문자열이 표시되어도 서로 다른 상품번호·이름을 기준으로 분리했다. 모델명만으로 동일 게임이라고 병합하지 않았다.
- 카탄은 후보로 발견했지만 해당 상품 상세 응답을 확보하지 못해 추가하지 않았다. 확인되지 않은 인원·시간을 기억으로 채우지 않았다.
- 추천 인원·난이도·분위기·언어 의존도·한국어판·영문 이름·규칙 요약은 이번 사실 확인 범위에 없으므로 비워 두었다. 신규 editorial은 null이다. 추천은 확인된 인원과 표기 시간을 근거로 하고 미확인 선호 항목을 명시한다. 세부 설명과 분위기 기반 구분을 완성하려면 별도 편집 검토가 필요하다.

## 수집·이용 경계
[아콩다콩 이용약관](https://www.akongdakong.co.kr/service/agreement.php)의 저작물 이용 제한을 확인했다. 개별 상품의 식별·인원·시간 같은 소량 사실과 출처 링크만 기록했으며 사이트의 표현·데이터베이스 전체·이미지·규칙·상품 설명·가격·리뷰를 복제하지 않았다. 자동 크롤러나 페이지 다운로드 스크립트를 만들거나 실행하지 않았다. JSON 작성에 사용한 로컬 스크립트는 이미 대조한 사실을 직렬화했으며 네트워크 요청을 하지 않았다. 데이터셋의 라이선스나 상업적 이용 허가를 취득했다고 기록하지 않았다.

`usageStatus=FACTS_ONLY`는 원저작물 복제 허가를 뜻하지 않는다. 자료의 사실 대조 상태 VERIFIED와 사람의 공개·권리 검토를 구분한다. 공개 승인 목록은 0개로 유지했고 실제 ImportBatch의 승인자를 꾸미거나 권한을 CONFIRMED로 바꾸지 않았다. 개발 카탈로그와 신규 설치용 create-only seed에만 목록을 연결했다. 운영 공개는 기존 별도 승인·내용 해시 경계를 통과해야 한다.

## 변경 파일
- `data/games/*.json`: 신규 14개 출처·필드 관측 기록.
- `data/catalog.ts`: 명시적인 파일 목록과 전체 Zod 검증. seed와 개발 미리보기의 공통 데이터 진입점.
- `prisma/seed-data.ts`: 기존 create-only 동작을 유지하면서 신규 목록을 사용. DB 스키마·migration은 변경하지 않음.
- `src/server/catalog.ts`, `catalog.test.ts`: 개발 미리보기 15개 연결. 운영 승인·해시 정책 유지.
- `src/domain/games/catalog.test.ts`: 전체 근거·누락 상태·상품 중복 분리, 2/4/8/10/11인 추천 검증.
- `tests/integration/database.test.ts`: 15개 seed 조회·재실행·자체 편집 보존 검증.
- `tests/e2e/recommend.spec.ts`, `details-roulette.spec.ts`, `production.spec.ts`: 8인 추천·11인 빈 결과, 실제 다중 후보 회전·단일/빈 선택, 추가 상세 출처·미확인 정보, 운영 직접 접근 차단.
- 개발 시작·출처·DB·아키텍처·요구사항·추천·계획 문서와 본 보고서: 현재 수량·사용 방법·한계 갱신.

## 검사 결과
최종 실행 결과는 아래 표에 기록한다. 초기 E2E는 후보가 스플렌더 하나라고 가정해 실패했으며, 실제 TOP 5와 복수 카드에 맞게 검사를 고쳤다. 후보 렌더링 대기와 상세 이동 완료 대기도 추가했다. 추천 순위를 테스트에 맞추기 위해 변경하지 않았다.

| 검사 | 결과 |
| --- | --- |
| lint | 통과 |
| 타입 검사 | 통과, strict 유지 |
| 단위 테스트 | 17파일·210개 통과 |
| PostgreSQL 통합 테스트 | 2파일·28개 통과 |
| production build | 통과, 기존 Webpack 설정 유지 |
| Playwright | 38개 통과: desktop/mobile/320px 각 12개, production 2개 |
| diff 검사 | 통과 |

실서비스 DB에 접속하거나 운영 seed를 실행하지 않았다. 기존 전용 테스트 DB에서 14개 신규 입력과 seed 재실행을 확인했다. 운영자가 자신의 DB에 신규 자료를 넣을 때는 기존 `pnpm db:deploy` 후 `pnpm db:seed`를 실행한다. 이미 존재하는 slug의 값·관측·자체 편집은 이 seed로 갱신하지 않는다. 개발 미리보기는 DB 없이 15개를 즉시 읽는다.

## 남은 작업
100개 목표까지 85개가 남아 있다. 실제 사람의 공개·권리 검토, 자체 소개·규칙·분위기·난이도 편집, 장시간/협력 장르 데이터와 출처 다양화는 미완료다. 승인되지 않은 기능·배포 작업을 자동으로 시작하지 않는다. 이번 Phase 5 데이터 보완만 별도 커밋으로 남긴다.
