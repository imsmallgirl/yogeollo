# Phase 3 완료 보고

## 구현 범위
사용자가 승인한 홈·추천 결과 UI만 구현했다. 기존 추천 엔진과 데이터 조회를 연결했으며 추천 순위·DB 모델·게임 원자료는 변경하지 않았다. 새 의존성도 없다. 상세·소개 페이지와 룰렛은 구현하지 않았다.

| 변경 파일 | 내용 |
| --- | --- |
| `src/app/page.tsx`, `layout.tsx`, `globals.css` | 아이보리·포인트 컬러의 한국어 홈, 기존 브랜드와 스타일 활용, 모임 조건 입력, 공통 레이아웃·한글 줄바꿈 |
| `src/app/recommend/page.tsx`, `loading.tsx` | 서버 추천 결과·조건 요약·완화 안내·빈 결과·데이터 준비 중·조회 실패·잘못된 URL·로딩 |
| `src/components/recommendation/choice-group.tsx`, `recommendation-form.tsx` | 재사용 native radio 선택 그룹, 7명 이상 정확한 인원, Zod 검증·오류 포커스·전환 대기 |
| `src/components/recommendation/preference-summary.tsx`, `game-card.tsx`, `empty-state.tsx` | 카드·요약·빈 상태, 표기/평균 시간 구분, 미확인 표시, 추천 이유와 확인 정보 |
| `src/components/ui/notice.tsx` | 재사용 안내 컴포넌트 |
| `src/domain/recommendation/query.ts`, `query.test.ts` | 엄격한 쿼리 파싱, 중복 키·알 수 없는 키 차단, 공유 URL·조건 복원, 한국어 오류 |
| `src/server/catalog.ts`, `catalog.test.ts` | 서버 전용 미리보기·운영 데이터 모드, 공개 검토 목록·검증 상태 확인, 실패 시 샘플 대체 차단 |
| `src/server/recommendation.ts`, `recommendation.test.ts` | 입력 확인 후 카탈로그 → 기존 엔진 조합. 페이지 데이터 상태 분리 |
| `src/components/recommendation/game-card.test.ts` | 미확인 항목·평균 생성 방지, 시간 완화의 접히지 않은 표시 검증 |
| `data/publication-approvals.json` | 비어 있는 공개 검토 목록. 실제 승인이나 데이터 추가 없음 |
| `tests/e2e/recommend.spec.ts`, `production.spec.ts` | 데스크톱·모바일·320px 흐름과 실제 production의 미검토 샘플 차단 검증. 이전 준비 화면 전용 home.spec을 대체 |
| `playwright.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`, `vitest.config.ts` | 기존 개발 서버와 테스트 서버 격리, 생성물 제외, 컴포넌트 테스트 경로 alias |
| `.env.example`, `GETTING_STARTED.md`, `docs/PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `DATA_SOURCES.md`, `DEVELOPMENT_PLAN.md`, `RECOMMENDATION_ENGINE.md`, 본 보고서 | 환경·화면 연결·공개 경계·검사·다음 단계 동기화 |

## 사용자 흐름과 데이터 경계
홈의 기본 선택값은 화면에서 확인할 수 있으며 사용자가 변경 가능하다. 선택 후 GET URL에 조건을 저장해 직접 접근·새로고침·조건 수정에서 보존한다. 결과 URL에는 유효한 조건이 모두 필요하며 누락·중복·잘못된 값은 추정하지 않는다. 인원·시간·분위기·난이도는 클라이언트와 서버에서 같은 Zod 계약으로 확인한다. 조회보다 검증을 먼저 수행한다.

폼만 Client Component이며 결과 카드·요약·안내는 서버에서 렌더링한다. 별도 HTTP API나 자기 서버로의 중복 HTTP 요청은 만들지 않았다. 미검토 편집 태그·평균·이미지를 생성하지 않는다. 실제 후보 수와 표기 시간을 보여주며 시간 완화·선호 불일치는 바로 표시한다. 참고 정보는 native details로 펼칠 수 있다. 상세 페이지가 없는 동안 비활성 준비 버튼을 표시해 404 링크를 만들지 않았다.

개발/test의 기본 preview는 기존 샘플 1개를 사용하고 미리보기 안내를 표시한다. 운영은 preview 지정으로도 이 샘플을 공개하지 않는다. database 모드는 공개 검토 목록의 slug와 VERIFIED 사실을 모두 만족한 DB 레코드만 사용한다. 현재 목록은 비어 있어 운영에서는 데이터 준비 중 안내가 정상이다. 게임 공개 검토·배포 승인을 임의로 만들지 않았다. 검토 대상 데이터가 바뀌면 재검토가 필요하며 전체 수집·검토 이력 자동화는 Phase 5 범위다.

DB 실패·설정 오류는 별도 unavailable 상태로 처리하고 오류 원문·연결 정보·임의 샘플을 보내지 않는다. 실제 결과 없음은 데이터 준비 중·조회 실패와 구분한다. 결과 페이지에 내부 진단 객체를 렌더링하지 않는다. 검색 색인은 계속 차단한다.

## 최종 검사
| 검사 | 결과 |
| --- | --- |
| `pnpm lint` | 통과, 오류·경고 0 |
| `pnpm typecheck` | 통과, TypeScript strict 유지 |
| `pnpm test` | 10 파일·149 테스트 통과: 기존 119개 + Phase 3 30개 |
| `pnpm build` | 통과. 홈·추천 결과는 요청 시 서버 렌더링, robots·sitemap·404 정적 생성 |
| `pnpm test:e2e` | 19개 통과: desktop 6개, mobile Chromium 6개, 320px 6개, production 1개 |
| `pnpm peers check` | 충돌 없음 |
| `git diff --check` | 통과 |

브라우저 검증은 기본 조건 선택 → 실제 샘플 결과 → 추가 정보 펼치기 → 조건 복원, 7명 이상 빈 값/6명 거부·8명 보존·빈 결과, 시간 완화의 상위 안내와 카드 표시, 공유 URL·새로고침, 잘못된 URL, 키보드·오류 포커스·본문 이동, 가로 넘침을 포함한다. 실제 production 서버에 preview 환경변수를 넣어도 미검토 샘플이 표시되지 않고 noindex가 유지됨을 확인했다.

desktop·mobile·320px의 홈·결과 스크린샷을 생성하고 직접 확인했다. 테스트 중 radio의 클릭 영역을 전체 선택 카드로 보완했고, Next의 route-announcer와 구분되도록 테스트의 오류 안내 선택자를 본문으로 한정했다. 최종 수정 후 전체 검사를 통과했다.

테스트 서버는 3173·3174 포트를 사용하고 자동 종료한다. 기존 사용자의 3147 서버는 종료하거나 재사용하지 않았다. 테스트 dev 산출물은 `.next-e2e`로 격리했다. production 브라우저 검증은 사전 `pnpm build`가 필요하다. DB 스키마·기존 repository는 변경하지 않아 PostgreSQL 통합 테스트는 재실행하지 않았으며 Phase 1의 20개 통과 기록을 따른다. 모바일은 Chromium 에뮬레이션이며 실제 iOS Safari·실기기 검증은 남아 있다.

## 미완료와 다음 단계
실제 게임은 개발용 샘플 1개이며 공개 검토 완료 자료는 0개다. 출처·한국 유통 판본·이용 범위·자체 편집의 사람 검토와 추가 데이터 확보가 필요하다. 결과를 5개 채우기 위한 가짜 데이터는 추가하지 않았다. 공개 검토 자동화·관리 UI·실제 배포는 이번 범위가 아니다.

Phase 4의 게임 상세·자체 규칙 요약·룰렛·서비스 소개는 아직 준비 중이다. 데이터가 부족하거나 미검토인 상태를 숨기지 않고 현재 구현을 사용·검토할 수 있게 했다.

**Phase 3 완료 커밋을 남기고 종료한다. 사용자 승인 전까지 Phase 4를 시작하지 않는다.**
