# Binance Monitoring Dashboard 아키텍처 문서

이 문서는 시스템 구조와 주요 동작 흐름을 다이어그램으로 정리한 문서들의 인덱스다.

## 다이어그램 목록

- [전체 서버 구조](./docs/diagrams/server-architecture.md)
- [주요 컴포넌트 구조](./docs/diagrams/component-model.md)
- [주요 시퀀스 다이어그램](./docs/diagrams/sequence-flows.md)
- [데이터 수집 및 알림 판단 작동 로직](./docs/diagrams/operation-flow.md)
- [EC2/Lightsail Docker 배포 운영 흐름](./docs/diagrams/deployment-flow.md)
- [데이터 저장 관계 ERD](./docs/diagrams/data-model.md)

## 설계 전제

- 초기 MVP는 로컬 실행을 기준으로 한다.
- 24시간 운영은 AWS EC2 또는 Amazon Lightsail 서버에 Docker Compose로 배포한다.
- 대시보드는 개인 컴퓨터에서 서버에 접속해서 본다.
- 접근 제한은 SSH 터널링, IP allowlist, Tailscale, Cloudflare Tunnel, 로그인 인증 중 하나를 사용한다.
- 알림은 기존 Telegram 봇 `@Tturu_news_bot`을 사용한다.
- Simple Earn은 Flexible 상품을 우선 지원한다.
- 공지는 Binance CMS JSON endpoint를 통해 수집한다.
- 앱의 Earning Events 영역은 최신 공지와 일부 상세 본문을 조회해 토큰, 페어, APR/APY, 보상, 기간 후보를 파싱한다.
- APR 이벤트 알림은 최근 여러 공지 페이지를 스캔하고, APR/APY/Simple Earn/Staking 계열 이벤트만 Telegram과 앱 알림창에 반영한다.
- APR 이벤트 중복 발송 방지를 위해 로컬 `.alert-state.json`에 전송한 공지 코드를 저장한다.
- Simple Earn Flexible/Locked 데이터는 1분에서 5분 주기로 갱신한다.
- Hedge Strategy Lab 후보는 Simple Earn 자산, Spot USDT 심볼, USDT-M Perpetual Futures 심볼의 교집합으로 생성한다.

## 현재 구현 메모

- 프론트엔드는 Vite + React + TypeScript 기반이다.
- 로컬 API 서버는 Node.js HTTP 서버 기반이며 기본 포트는 `8787`이다.
- 주요 실시간 가격과 arbitrage 후보는 Binance WebSocket 데이터를 사용한다.
- Simple Earn 상품과 계정성 데이터는 Binance signed API를 사용하므로 `.env`의 Binance API key/secret이 필요하다.
- Telegram 알림은 `@Tturu_news_bot`에 연결된 Bot API 설정을 사용한다.
- Docker/AWS 배포, 백그라운드 스케줄러, 실제 잔고 기반 계산, arbitrage Telegram 알림은 아직 후속 구현 항목이다.
