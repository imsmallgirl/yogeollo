# Phase 5 보완 — 공개 라이선스 실물 사진

사용자가 요청한 “허락이 된 이미지를 찾아 가져오기”를 Phase 5 데이터 보완으로 수행했다. **15개 게임 중 6개**에 촬영자가 공개 라이선스로 제공한 실물 사진을 연결했다. 게임 데이터나 서비스의 운영 공개 승인을 추가하지 않았고 Phase 6·배포는 진행하지 않았다.

## 파일별 확인
| 게임 | 촬영자 | 사진 출처 | 적용 라이선스 |
| --- | --- | --- | --- |
| 젝스님트 | Muu-karhu | [6 nimmt!.jpg](https://commons.wikimedia.org/wiki/File:6_nimmt!.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 카르카손 | L'Éclipse | [Carcassone jogo-game.jpg](https://commons.wikimedia.org/wiki/File:Carcassone_jogo-game.jpg) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| 할리갈리 | joho345 | [Halli Galli.jpg](https://commons.wikimedia.org/wiki/File:Halli_Galli.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 클라스크 | Achim Raschka | [KLASK 04.jpg](https://commons.wikimedia.org/wiki/File:KLASK_04.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 루미큐브 클래식 | ella | [Rummikub (3600358059).jpg](https://commons.wikimedia.org/wiki/File:Rummikub_(3600358059).jpg) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| 우봉고 | JIP | [Ubongo.jpg](https://commons.wikimedia.org/wiki/File:Ubongo.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |

각 Commons 파일 설명 페이지에서 촬영자·출처·재사용 라이선스를 개별 대조하고, 공식 MediaWiki API의 imageinfo/extmetadata로 같은 정보를 확인했다. 선택한 파일 6개만 명시적으로 요청했다. BGG API나 쇼핑몰 이미지·규칙 원문은 사용하지 않았다. 라이선스가 제공하는 재사용 허가를 이용한 것이며 저작자에게 개별 연락하거나 별도 허락을 받았다고 기록하지 않는다.

확인 날짜는 한국 시간 2026-11-04다. 파일별 정확한 ISO 확인일, 확인 주체, Commons 고정 버전 링크, 원본 URL, 축소본 URL, 저장 파일의 SHA-256과 크기를 `data/game-photos.json`에 기록한다. 최초 카르카손 후보는 인물 중심이어서 제외하고 게임판 중심의 다른 CC BY 4.0 사진으로 교체했다. 최종 사진 6개를 실제 열어 게임 내용과 표시를 대조했다. 한국 판매판을 찍은 공식 상품 사진이라고 주장하지 않는다.

## 허가 조건의 적용
[CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)의 공식 조건을 확인했다. 조건을 준수하면 상업적 이용을 포함한 복제·배포가 허용되며, 저작자 표시·자료 링크·라이선스 링크·변경 표시를 유지한다. BY-SA 사진과 그 수정본에는 동일 라이선스 조건을 적용한다. 앱 코드 전체를 사진의 라이선스로 재허락하는 것은 아니다. 사진 라이선스가 상표·제품 디자인·모든 제3자 권리를 일괄 양도한다는 뜻도 아니다.

카드와 상세 모두 사진 제목·촬영자·출처·라이선스 링크를 figcaption으로 표시한다. Wikimedia가 제공한 960px JPEG 축소본을 저장했고 추가 합성·내용 편집·자르기는 하지 않았다. 표시 과정의 크기·형식 최적화를 밝힌다. 원 사진에 대한 출처와 라이선스는 변환된 표시본에도 함께 제공한다. 한국 판매판의 디자인·구성과 다를 수 있다는 안내를 붙였으며 후원·공식 제휴를 주장하지 않는다.

`public/game-photos/CREDITS.md`에도 파일별 출처·권리 표시를 함께 배포한다. 이미지를 옮기거나 재배포할 때 이 기록을 보존해야 한다. 네트워크 요청은 개발 중의 선택 파일 다운로드에만 사용하며 브라우저는 외부 이미지 서버에 접속하지 않는다. `next/image`가 로컬 JPEG를 최적화한다. 별도 CDN·외부 remotePatterns·신규 의존성은 추가하지 않았다.

## 변경 파일
- `public/game-photos/*.jpg`: 허가 조건 확인·실물 대조한 사진 6개. 전체 약 1.30MiB.
- `public/game-photos/CREDITS.md`, `data/game-photos.json`: 파일별 권리·출처·검증·해시 기록.
- `src/domain/games/photos.ts`: strict Zod 메타데이터 검증, 허용 라이선스와 공식 URI 대조, 게임/경로 중복 및 로컬 경로 검증. 미확인 사진은 등록하지 않음.
- `src/components/games/game-photo.tsx`: 카드·상세 공용 Server Component, 대체 텍스트·고정 크기·반응형 sizes·잘림 없는 표시와 인접 출처 표기.
- `game-card.tsx`, `game-detail-content.tsx`: 확인된 게임에만 사진 표시. 없는 게임은 기존 텍스트 화면 유지.
- `photos.test.ts`, `game-photo.test.tsx`, `tests/e2e/photos.spec.ts`: 파일·해시·권리 기록·미확인 차단, 크레딧 동반 표시, 실제 최적화 로딩·외부 이미지 요청 없음·모바일 폭 검사.
- `docs/DATA_SOURCES.md`, `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`, `GETTING_STARTED.md`, 본 문서: 사용 조건·사용 방법·검사·한계 기록.

게임 사실 JSON·공개 승인 목록·DB schema·seed·추천 엔진은 바꾸지 않았다. 사진이 필요한 경우 static manifest로 연결하므로 DB migration은 필요 없다. 설치·빌드 중 자동 다운로드도 하지 않는다.

## 검증
| 검사 | 결과 |
| --- | --- |
| lint | 통과 |
| 타입 검사 | 통과, strict 유지 |
| 단위/컴포넌트 | 19파일·215개 통과 |
| production build | 통과 |
| Playwright | 44개 통과: desktop/mobile/320px 각 14개, production 2개 |
| diff 검사 | 통과 |

권리 정보가 빠졌거나 라이선스명과 URI가 다르거나 외부 표시 경로를 지정하면 검증이 실패한다. 로컬 사진 파일과 SHA-256·크레딧의 대응을 검사한다. DB 구조·접근은 바꾸지 않아 PostgreSQL 통합 테스트는 재실행하지 않았다. E2E 서버는 기존과 같이 3173/3174로 격리하고 사용자 개발 서버는 건드리지 않는다.

## 남은 사항
나머지 9개는 이번 조사에서 적용할 라이선스 사진을 확보하지 않아 이미지 없이 유지한다. 쇼핑몰 이미지나 무관한 사진으로 채우지 않았다. 사진의 공개 라이선스 확인과 게임 정보의 운영 공개 승인은 별도이며, 운영 게임 공개 목록은 여전히 0개다. 추가 이미지도 파일별 동일한 검증·출처 표기 절차를 거쳐야 한다. 이번 범위의 변경만 하나의 Phase 5 보완 커밋으로 남긴다.

상세 상단 사진에는 eager loading을 적용해 브라우저의 LCP 지연 안내를 해소하고, 추천 카드의 사진은 lazy loading을 유지한다.
