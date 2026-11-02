# 데이터 출처와 수집 정책

## 현재 상태
검증된 게임 데이터는 0개다. 이번 단계에서는 게임 정보를 수집하거나 seed를 만들지 않았다. 100개는 목표이며 숫자를 맞추기 위해 이름·인원·규칙·판매 사실을 생성하지 않는다.

## 후보 출처
- 코리아보드게임즈: https://www.koreaboardgames.com/
- 보드엠: https://boardm.co.kr/
- BoardGameGeek API 안내: https://boardgamegeek.com/wiki/page/BGG_XML_API2
- 기타 국내 유통사·출판사 및 이용이 허용된 공개 데이터.

위 URL은 탐색 후보이며 이용 약관·수집 권한·데이터 정확성을 검증했다는 뜻이 아니다. 자동 수집은 수행하지 않았다. BGG는 애플리케이션 승인·인증·이용 조건 확인 전 연동하지 않는다. 사이트별 robots와 약관을 확인하되 robots 허용만으로 데이터 이용 허가를 간주하지 않는다.

## Phase 1 수동 검증과 Phase 5 파이프라인
허용된 수동 조사나 제공 파일로 소량 후보를 확보 → 출처와 관측 사실 기록 → Zod 구조·범위 검증 → 중복/판본 검토 → 사람의 승인 → VERIFIED 전환 → 트랜잭션 반영. 승인된 자동 수단이 없으면 수동 샘플만 유지한다.

필수 기록: 게임 식별자, 출처명·직접 URL·타입, 확인 날짜, 확인자, 검증 상태, 확인 필드, 국내 판매 상태, 국내 플레이 근거, 이용 허가/라이선스 근거, 원자료와 자체 편집 구분. 판매 페이지의 존재·재고·한국어판은 서로 다른 관측이다. 국내 인기 주장은 별도 기간·모집단·출처를 갖는 지표가 있어야 한다.

신선도는 사실별 재검증 주기를 운영 정책으로 확정한다. 오래된 판매 기록은 STALE로 내리고 현재 판매라고 표시하지 않는다. 삭제·정정 요청 경로와 확인 이력을 보존한다.

## 저작권
외부 이미지·상세 소개·규칙 원문은 복제하지 않는다. 이미지별 권리자, 허가 범위, 출처 표시 조건, 만료일이 확인될 때만 저장·표시한다. 미확인이면 자체 그래픽 또는 이미지 없는 카드를 사용한다. 규칙은 사실에 기반한 자체 요약으로 작성하고 원문 표현을 재사용하지 않는다. 자체 요약도 편집자와 검토일을 기록한다.

## 개발 도구 확인 근거
2026-11-03 실행 환경의 npm 레지스트리 `pnpm view` 결과를 기준으로 안정 버전을 선택했다. Next 16.4.4, React 19.3.1, Tailwind 4.3.3, Vitest 5.1.0, Playwright 1.64.1. Prisma latest=8.0.0-rc.29를 제외하고 안정 7.10.1 사용. 실제 전이 의존성은 잠금 파일을 따른다.

공식 참고: [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation), [Prisma 7 전환](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7), [Tailwind Next.js 설치](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [shadcn Next.js 설치](https://ui.shadcn.com/docs/installation/next).
