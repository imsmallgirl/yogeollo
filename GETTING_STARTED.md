# 개발 시작

기존 프로젝트 설명은 `README.md`에 그대로 보존했습니다. 현재 범위는 **Phase 0**이며 추천 서비스는 아직 동작하지 않습니다.

## 실행
Node 24.x와 pnpm 11.5.1을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

http://localhost:3000 에서 준비 화면을 확인합니다. `.env.example`을 참고해 필요할 때 `.env.local`을 작성하세요. 기본 화면에는 DB나 비밀키가 필요하지 않습니다. DATABASE_URL은 Phase 1용 예시이며 실제 연결은 구현하지 않았습니다.

## 검사
```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright는 전용 3147 포트에 로컬 서버를 자동 실행하며 desktop/mobile Chromium을 검사합니다. 실제 iOS Safari 검증은 별도입니다. production 실행은 `pnpm build` 후 `pnpm start`입니다. 준비 화면은 검색 색인을 비활성화했습니다.

설계와 다음 단계는 [개발 계획](docs/DEVELOPMENT_PLAN.md), [아키텍처](docs/ARCHITECTURE.md), [Phase 0 보고서](docs/PHASE_0_REPORT.md)를 참고하세요. 사용자 승인 전에는 다음 단계를 구현하지 않습니다.
