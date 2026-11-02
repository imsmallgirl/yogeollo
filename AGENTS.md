# 요걸로 프로젝트 작업 원칙

이 지침은 프로젝트 전체에 적용한다. 명시적인 사용자 지시가 우선한다.

## 작업 범위와 진행
- 작업 전에 기존 코드, 관련 문서, Git 변경 사항을 먼저 확인한다. 기존 작업을 보존하고 불필요하게 재작성하거나 덮어쓰지 않는다.
- 한 번에 하나의 Phase만 구현한다. 현재 승인된 범위를 넘지 않는다.
- 기능 구현이 끝나도 다음 Phase를 자동으로 시작하지 않는다. 사용자의 명시적인 승인 후 진행한다.
- 요구사항과 다른 구현이 필요하면 변경 이유와 영향을 구현 전에 먼저 보고한다.

## 구현과 UI
- TypeScript strict를 유지한다. `any` 사용을 최소화하고 외부 입력은 `unknown`과 검증을 통해 안전하게 좁힌다.
- UI를 재사용 가능한 컴포넌트로 분리하고 모바일과 데스크톱을 함께 고려한다.
- Server Components를 기본으로 사용하고 상호작용이 필요한 경계에만 Client Components를 둔다. DB 접근은 서버에 한정한다.
- 불필요한 의존성과 복잡한 아키텍처를 피하고 현재 요구사항을 만족하는 최소한의 구조를 사용한다.

## 데이터와 추천
- 실제 데이터가 없으면 임의로 생성하지 않는다. 미확인 정보는 미확인 상태로 남기고 한계를 보고한다.
- 외부 데이터의 저작권·라이선스·이용약관을 준수한다. 수집·사용 권한을 확인하고 출처·확인일·검증 상태를 기록한다.
- 추천 근거를 설명할 수 있도록 설계한다. 추천 로직은 UI와 분리된 순수 TypeScript 함수로 유지하며, 무작위 점수나 근거 없는 적합도 수치를 만들지 않는다.

## 검증과 보고
- 각 작업 후 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`를 실행하고 각각의 성공 여부를 보고한다.
- UI와 사용자 흐름 변경 시 관련 Playwright 테스트로 모바일·데스크톱 동작을 검증한다.
- 실패하거나 실행할 수 없는 검사는 원인과 미완료 사항을 명시한다. 실행하지 않은 검사를 통과했다고 보고하지 않는다.
- 작업 결과에는 변경 파일, 구현 내용, 검사 결과, 미완료 사항을 포함한다.

## Phase별 커밋
- Phase마다 해당 단계의 작업과 문서·검증 결과를 하나의 완료 커밋으로 남긴다. 커밋 메시지에 Phase 번호와 목적을 명시한다.
- 커밋 전 diff와 스테이징 내용을 확인하고 해당 Phase와 관계없는 사용자 변경은 포함하지 않는다.
- 실제 비밀키, `.env` 파일, 빌드 산출물, 테스트 산출물, 의존성 디렉터리는 커밋하지 않는다.
- 필수 검사가 실패하면 완료 커밋을 만들지 않고 문제를 해결하거나 차단 원인을 보고한다. 완료 후 커밋 해시를 보고한다.
- 커밋은 다음 Phase의 승인이나 원격 push 권한을 뜻하지 않는다. 별도 지시 없이 push하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
