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
- 공지는 30분 주기 크롤링으로 수집한다.
- Simple Earn Flexible 데이터는 1분에서 5분 주기로 갱신한다.
