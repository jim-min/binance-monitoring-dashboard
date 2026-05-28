# Binance Monitoring Dashboard

Binance Monitoring Dashboard는 바이낸스의 실시간 시장 데이터, Simple Earn 상품, Futures 펀딩비, 스테이킹+숏 헤지 전략, arbitrage 가능성을 한 곳에서 모니터링하기 위한 개인용 대시보드 프로젝트입니다.

현재 단계에서는 로컬 개인용 MVP를 구현 중입니다. Vite React 프론트엔드와 Node 로컬 API 서버로 구성되어 있으며, 사용자는 GitHub에서 프로젝트를 clone한 뒤 자신의 `.env`를 설정해 실행하는 방식을 기본으로 합니다.

## 목표

- BTC, ETH, SOL, BNB, TRX, XRP 등 주요 코인의 현재가를 실시간으로 확인합니다.
- Binance Simple Earn Flexible 상품을 APR, 구독 가능 여부, 이벤트 여부 기준으로 정리합니다.
- Simple Earn 관련 Binance 공지를 함께 보여주어 이벤트성 APR을 빠르게 파악합니다.
- 고APR Earn 상품에 대해 Futures 숏 포지션을 결합했을 때 예상 순수익과 리스크를 계산합니다.
- Spot, Futures, 여러 페어 간 arbitrage 후보를 감지하고 알림을 받을 수 있게 합니다.

## 핵심 화면

### Market Watch

주요 코인의 실시간 가격, 24시간 등락률, 거래량, 호가, 미니 차트를 보여주는 화면입니다.

### Simple Earn Screener

Simple Earn Flexible/Locked 상품을 APR, 한도, 구독 가능 여부, 관련 이벤트 기준으로 필터링하고 정렬하는 화면입니다. Binance signed Simple Earn API를 페이지네이션으로 호출해 가능한 상품을 수집합니다.

### Earn Events

Binance Latest Activities 공지 페이지의 이벤트를 수집하고, 관련 코인 및 상품과 연결해서 보여주는 영역입니다.

대상 공지:

- https://www.binance.com/en/support/announcement/list/93

현재 구현은 Binance CMS JSON endpoint를 통해 공지 목록을 가져오고, 최신 일부 공지는 상세 본문까지 가져와 토큰, 페어, APR/APY 문구, 보상 문구, 캠페인 기간 후보를 파싱합니다. Binance CMS가 허용하는 pageSize 값만 쓰도록 서버에서 정규화하고, 상세 본문 조회 실패 시 제목 기반 파싱으로 fallback합니다.

Telegram 알림은 전체 이벤트가 아니라 APR/APY/Simple Earn/Flexible/Locked/Staking 계열 이벤트만 대상으로 합니다. 이미 보낸 공지 코드는 로컬 `.alert-state.json`에 저장하며, 이 파일은 git에 커밋하지 않습니다.

### Hedge Strategy Lab

Simple Earn으로 코인을 보유하고 동일 코인을 Futures에서 숏 포지션으로 헤지하는 전략을 시뮬레이션합니다.

현재 후보 코인은 `Simple Earn에 존재` + `USDT-M Perpetual Futures 상장` + `Spot USDT 거래 가능` 조건의 교집합으로 생성합니다. 검색형 드롭다운에서 코인명 또는 심볼로 빠르게 찾을 수 있습니다.

주요 계산 항목:

- Simple Earn APR
- Futures 펀딩비
- 현물-선물 베이시스
- 거래 수수료
- 슬리피지
- 예상 순 APR
- 과거 가격 기반 백테스트

청산 가격, 필요 증거금, 레버리지별 마진 리스크는 후속 구현 항목입니다.

### Arbitrage Monitor

다양한 페어와 Spot-Futures 가격 차이를 모니터링합니다. 설정한 기준을 넘는 기회에 대한 Telegram 자동 알림은 후속 구현 항목입니다.

초기 알림 채널 후보:

- Telegram

MVP에서는 사용자가 이미 만들어둔 Telegram Bot을 활용합니다. 현재 APR 이벤트 알림은 구현되어 있으며, arbitrage 조건 충족 알림, Discord Webhook, Email, Browser Push는 후속 확장 후보입니다.

기존 봇:

- `@Tturu_news_bot`

새 프로젝트에서는 기존 봇 프로그램에 직접 의존하지 않고, 같은 Bot API 방식으로 독립 Notification Worker를 구현합니다. `.env`에는 `TELEGRAM_BOT_TOKEN`과 `TELEGRAM_CHAT_ID`를 설정합니다.

## 데이터 소스 후보

- Binance Spot WebSocket Streams
- Binance Spot REST API
- Binance USD-M Futures REST API
- Binance Futures WebSocket Streams
- Binance Simple Earn SAPI
- Binance Support Announcement

공지 데이터는 WebSocket이 아니라 주기적 크롤링으로 수집합니다. APR 변동에 빠르게 대응하기 위해 Simple Earn Flexible 상품 데이터는 공지보다 짧은 주기로 갱신하고, 화면에서는 수동 새로고침을 제공합니다.

## MVP 범위

초기 MVP는 다음 기능을 목표로 합니다.

- 주요 코인 실시간 가격 대시보드
- Simple Earn Flexible/Locked 상품 스크리너
- Binance CMS 기반 Earning Event 공지 연동
- 고APR 상품의 Futures 마켓 존재 여부 확인
- 펀딩비 기반 예상 순 APR 계산
- Spot-Futures 베이시스 모니터링
- Binance 내부 페어 중심 arbitrage 모니터링
- 실제 계정 잔고 조회 연동
- APR 이벤트 Telegram Bot 알림
- 한국어 UI

자동 주문 실행은 MVP 범위에서 제외합니다. 먼저 데이터 수집, 분석, 알림 중심으로 안정적인 모니터링 도구를 만드는 것을 우선합니다.

## 로컬 UI 실행

현재 UI는 Vite + React + TypeScript 기반으로 구성되어 있습니다.

```powershell
npm install
npm run dev
```

브라우저에서 접속:

```text
http://127.0.0.1:5173
```

로컬 API 서버 실행:

```powershell
npm run server:dev
```

API 상태 확인:

```text
http://127.0.0.1:8787/api/health
http://127.0.0.1:8787/api/config/status
```

Telegram 테스트 전송:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8787/api/telegram/test" `
  -ContentType "application/json" `
  -Body '{"message":"Binance Monitoring Dashboard test"}'
```

프로덕션 빌드 확인:

```powershell
npm run build
```

## 기술 스택 후보

### Frontend

- Next.js 또는 React
- TypeScript
- Recharts 또는 Lightweight Charts
- TanStack Query
- WebSocket client

### Backend

- Python FastAPI 또는 Node.js NestJS
- Background worker
- Scheduler
- Binance API client

### Storage

- SQLite for local MVP
- PostgreSQL for deployed version
- Redis for real-time cache and notification cooldown

### UI

- 한국어 단일 UI
- 다국어 지원은 후속 확장

## 보안 원칙

- API Key, API Secret, Telegram Bot Token, Telegram Chat ID는 로컬 `.env`에 저장합니다.
- `.env`는 git에 커밋하지 않습니다.
- API Secret은 클라이언트에 노출하지 않습니다.
- 초기 버전에서는 읽기 전용 API Key만 사용합니다.
- 출금 권한과 거래 권한은 기본적으로 비활성화합니다.
- 실제 계정 잔고 조회는 허용하되 주문 실행 권한은 사용하지 않습니다.
- 로그에 API Key, Secret, 서명값을 남기지 않습니다.

Secret Manager는 배포형 서비스나 팀 운영 단계에서 검토합니다. 로컬 개인용 MVP에서는 설정 부담이 적은 `.env` 방식을 기본으로 합니다.

Telegram Bot Token은 비밀번호처럼 취급합니다. GitHub에 커밋하지 않고, 로그에도 남기지 않습니다.

## 운영 방향

초기에는 로컬 앱으로 개발하고 실행합니다.

24시간 운영이 필요해지면 다음 순서로 확장합니다.

1. 로컬 MVP 완성
2. Telegram 알림 안정화
3. Dockerfile 및 Docker Compose 추가
4. 로컬 장시간 실행 테스트
5. Amazon Lightsail, AWS EC2, 또는 작은 VPS에 배포

24시간 운영 단계에서는 AWS EC2, Amazon Lightsail, 또는 작은 VPS에 앱을 띄우고, 개인 컴퓨터에서 서버의 대시보드에 접속하는 구조를 기본으로 합니다. 접근은 SSH 터널링, IP allowlist, Tailscale, Cloudflare Tunnel, 또는 로그인 인증으로 제한합니다.

초기 서버 유지비는 작은 Linux 서버 1대 기준 월 5달러에서 20달러 사이를 1차 예산으로 봅니다. 비용 예측과 설정 단순성이 중요하면 Amazon Lightsail을 우선 검토하고, AWS 네트워크/IAM 구성을 세밀하게 다뤄야 하면 EC2를 검토합니다.

AWS 서버에서 귀찮은 환경설정을 반복하지 않기 위해 Docker를 기본 배포 단위로 사용합니다. 서버에는 Docker와 Docker Compose만 준비하고, 앱은 `.env`와 compose 설정으로 실행하는 방향입니다.

## 리스크 고지

이 프로젝트는 투자 조언이나 자동매매 시스템이 아니라 모니터링 및 분석 도구입니다.

Simple Earn APR, Futures 펀딩비, 시장 가격, 유동성은 빠르게 변할 수 있습니다. 스테이킹+숏 전략은 펀딩비 역전, 청산, 락업, 슬리피지, 수수료, 이벤트 종료 등의 리스크를 포함합니다.

## 문서

- [요구 분석 문서](./REQUIREMENTS.md)
- [UML 및 아키텍처 문서](./ARCHITECTURE.md)
- [사용 설명서](./docs/USER_GUIDE.md)

## 현재 상태

- 주요 코인 실시간 가격 WebSocket 연동
- Simple Earn Flexible/Locked 상품 수집 및 정렬
- Binance CMS 기반 Earning Event 표시
- APR 이벤트만 Telegram 및 앱 알림창에 반영
- Earn + Futures 숏 전략 백테스트
- Simple Earn + Spot + Futures 교집합 후보 검색
- Binance 내부 arbitrage 후보 실시간 계산

다음 주요 작업은 백그라운드 스케줄러, arbitrage Telegram 알림, 실제 계정 잔고 기반 계산, Docker 배포 파일 추가입니다.
