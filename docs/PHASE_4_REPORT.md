# Phase 4 완료 보고

## 구현 범위와 변경 파일
사용자가 승인한 게임 상세·룰렛·서비스 소개만 구현했다. 추천 순위, DB 모델·migration·seed, 기존 게임 사실과 공개 검토 목록은 변경하지 않았다. 수집 파이프라인이나 실제 배포는 시작하지 않았다.

| 변경 파일 | 구현 내용 |
| --- | --- |
| `src/app/games/[slug]/page.tsx` | 요청 시 상세 렌더링, 게임별 metadata, 안전한 slug 처리, 실제 404·조회 오류 분리 |
| `src/server/game-detail.ts`, `game-detail.test.ts` | 기존 카탈로그 공개 경계 재사용, metadata·본문의 요청별 조회 재사용, preview 초안 분리 |
| `src/components/games/game-detail-content.tsx`, `game-detail-content.test.ts` | 소개·인원·시간·난이도·분위기·준비·진행·승리·대상·주의·출처·작성 정보 |
| `src/domain/games/guide.ts`, `data/guides/splendor.json` | Zod 검증을 적용한 자체 작성 DRAFT 요약. 원문·이미지 복제 없음 |
| `src/lib/format-date.ts` | 출처·작성일의 한국 시간 표시 |
| `src/domain/roulette/roulette.ts`, `roulette.test.ts` | 후보 계약, 선택 교집합, uint32 거부 샘플링, 포인터와 일치하는 회전 각도 |
| `src/components/recommendation/game-roulette.tsx`, `game-roulette.test.tsx` | 실제 후보 선택·회전·결과, 빈/단일 후보, 중복 실행 잠금·정리, 동작 줄이기 설정 |
| `src/app/about/page.tsx` | 추천 기준·데이터·권리·룰렛 원칙 소개 |
| `src/app/recommend/page.tsx`, `src/components/recommendation/game-card.tsx`, `game-card.test.ts` | 실제 상세 링크와 추천 결과의 룰렛 연결 |
| `src/app/layout.tsx`, `sitemap.ts` | 소개 링크·소개 sitemap 추가. 미검토 상세 URL은 sitemap에 포함하지 않음 |
| `tests/e2e/details-roulette.spec.ts`, `production.spec.ts`, `recommend.spec.ts` | 상세·소개·룰렛·404·운영 공개 경계, 기존 결과 흐름 회귀 검사 |
| `package.json`, `pnpm-lock.yaml` | jsdom 29.1.1 개발 의존성. 새 런타임/UI 라이브러리는 없음 |
| `GETTING_STARTED.md`, `docs/PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `DATA_SOURCES.md`, `RECOMMENDATION_ENGINE.md`, `DEVELOPMENT_PLAN.md`, 본 보고서 | 실제 동작·출처·검사·미완료 사항 갱신 |

## 상세·규칙 안내
개발 preview에서 기존 샘플의 상세와 자체 작성 요약을 제공한다. 공식 제품 페이지가 연결하는 [퍼블리셔 기본판 규칙서](https://cdn.svc.asmodee.net/production-asmodeeit/uploads/2022/09/Splendor_IT.pdf)의 관련 쪽을 텍스트·렌더링으로 대조했다. 한국어 핵심 설명은 직접 작성했으며 원본 PDF·페이지 이미지·규칙 문구를 저장소나 웹 UI에 복제하지 않았다. 임시 PDF 검토 파일은 저장소 밖에 있다.

요약은 DRAFT이며 사람의 편집 검토와 한국 유통 판본 대조가 남아 있음을 표시한다. 추천 인원·난이도·언어 의존도를 추정하지 않았고, 기존 PENDING 태그도 승격하지 않았다. 운영 상세는 동일한 공개 검토 카탈로그와 VERIFIED 편집을 사용하며 개발용 요약을 반환하지 않는다. 현재 공개 검토 자료가 0개이므로 운영의 `/games/splendor`는 404가 정상이다. 게임 데이터가 없다는 이유로 판본이나 규칙을 생성하지 않았다.

metadata와 본문은 요청 안에서 조회를 재사용한다. 잘못된 slug는 데이터 조회 전에 거부한다. 외부 출처 링크·확인일·작성자를 표시하며, 보유 판본의 공식 규칙서를 우선하도록 안내한다. 전체 사이트는 정식 공개 전까지 noindex를 유지한다.

## 룰렛
서버는 추천된 최대 5개 게임의 이름·slug만 클라이언트에 전달한다. 체크한 후보의 부분집합만 대상으로 하고 후보별 가중치는 같다. crypto.getRandomValues의 uint32 값에서 나머지 편향을 피하도록 거부 샘플링한다. 추천 점수나 순위에 난수를 사용하지 않는다.

선택 결과를 먼저 정하고 바퀴의 해당 구간 중앙이 고정 포인터에 오도록 회전한다. 같은 이벤트 구간의 중복 클릭도 ref로 차단한다. 회전 중 후보를 바꿀 수 없고, 완료 이벤트·보조 타이머가 같은 결과를 공개한다. 타이머·미디어 이벤트는 정리하며 후보 목록이 바뀌면 상태를 초기화한다. 빈 선택은 실행 불가, 단일 후보는 난수·회전 없이 즉시 선택한다. 동작 줄이기를 켜거나 회전 중 설정을 변경하면 결과를 바꾸지 않고 회전을 생략·종료한다. 오류 시 임의 결과로 대체하지 않는다.

## 최종 검사
| 검사 | 결과 |
| --- | --- |
| `pnpm lint` | 통과, 오류·경고 0 |
| `pnpm typecheck` | 통과, strict 유지 |
| `pnpm test` | 14 파일·182개 통과: 기존 149개 + Phase 4 33개 |
| `pnpm build` | 통과. 상세·홈·결과 요청 렌더링, 소개·404·robots·sitemap 정적 생성 |
| `pnpm test:e2e` | 32개 통과: desktop/mobile/320px 각 10개, production 2개 |
| `pnpm peers check` | 충돌 없음 |
| `git diff --check` | 통과 |

추가 테스트는 공개 경계·초안 노출 차단·잘못된 slug, 필수 상세 콘텐츠, 빈/단일/다중 후보, 선택 해제, 중복 실행, 완료 이벤트·타이머, 동작 줄이기·중간 변경, 후보 교체, 난수 API 실패와 회전 포인터 일치를 포함한다. jsdom 29는 프로젝트 Node 24 최소 기준과 호환되는 안정 버전으로 선택했다. 별도의 UI 테스트 라이브러리는 추가하지 않고 React act와 기존 Vitest를 사용했다.

실제 데이터가 1개이므로 브라우저에서는 단일 후보·빈 선택·결과 링크를 검증했다. 다중 후보는 테스트 폴더의 합성 자료로 DOM 상호작용과 회전 각도를 검증했으며 실제 앱 데이터에 가짜 게임을 추가하지 않았다. 브라우저는 상세 진입·metadata·출처 링크·존재하지 않는 게임의 HTTP 404·소개·모바일 가로 넘침·기존 추천 흐름과 운영 미검토 상세의 HTTP 404를 확인했다. 상세·룰렛·소개 대표 스크린샷을 직접 검토했다. 제목의 장식 번호를 접근성 이름에서 제외해 명확한 제목 탐색을 보완했다.

DB 모델과 기존 repository는 그대로여서 PostgreSQL 통합 테스트는 재실행하지 않았다. 테스트용 서버는 기존과 같이 3173·3174에서 격리해 자동 종료하며 사용자의 3147 서버는 유지했다. 생성 파일·스크린샷·원문 PDF는 커밋하지 않는다.

## 미완료 사항
실제 샘플은 1개, 운영 공개 검토 완료 자료는 0개다. 사람의 출처·판본·이용 범위·자체 편집 검토, 추가 실제 데이터 확보는 남아 있다. 다중 실제 게임으로 전체 브라우저 회전을 검증하는 운영 데이터 기반 QA와 실기기 iOS Safari 검증은 아직 하지 않았다. 현재 단일 후보가 즉시 결정되는 것은 정상 동작이다.

데이터 수집·검토 이력 자동화는 Phase 5, 배포·전체 품질 검사는 Phase 6 범위다. **Phase 4 완료 커밋을 남기고 종료하며 사용자 승인 전까지 Phase 5를 시작하지 않는다.**
