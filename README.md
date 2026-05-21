# Binance Monitoring Dashboard

Binance Monitoring Dashboard는 바이낸스의 실시간 시장 데이터, Simple Earn 상품, Futures 펀딩비, 스테이킹+숏 헤지 전략, arbitrage 가능성을 한 곳에서 모니터링하기 위한 개인용 대시보드 프로젝트입니다.

현재 단계에서는 구현 전에 프로젝트 요구사항과 제품 방향을 정리하는 초기 기획 레포입니다.

## 목표

- BTC, ETH, SOL, BNB, TRX, XRP 등 주요 코인의 현재가를 실시간으로 확인합니다.
- Binance Simple Earn 상품을 APR, 상품 유형, 구독 가능 여부, 이벤트 여부 기준으로 정리합니다.
- Simple Earn 관련 Binance 공지를 함께 보여주어 이벤트성 APR을 빠르게 파악합니다.
- 고APR Earn 상품에 대해 Futures 숏 포지션을 결합했을 때 예상 순수익과 리스크를 계산합니다.
- Spot, Futures, 여러 페어 간 arbitrage 후보를 감지하고 알림을 받을 수 있게 합니다.

## 핵심 화면

### Market Watch

주요 코인의 실시간 가격, 24시간 등락률, 거래량, 호가, 미니 차트를 보여주는 화면입니다.

### Simple Earn Screener

Simple Earn Flexible 및 Locked 상품을 APR, 한도, 구독 가능 여부, 관련 이벤트 기준으로 필터링하고 정렬하는 화면입니다.

### Earn Events

Binance Simple Earn 공지 페이지의 이벤트를 수집하고, 관련 코인 및 상품과 연결해서 보여주는 화면입니다.

대상 공지:

- https://www.binance.com/en/support/announcement/list/93

### Hedge Strategy Lab

Simple Earn으로 코인을 보유하고 동일 코인을 Futures에서 숏 포지션으로 헤지하는 전략을 시뮬레이션합니다.

주요 계산 항목:

- Simple Earn APR
- Futures 펀딩비
- 현물-선물 베이시스
- 거래 수수료
- 슬리피지
- 예상 순 APR
- 청산 가격
- 필요 증거금

### Arbitrage Monitor

다양한 페어와 Spot-Futures 가격 차이를 모니터링하고, 설정한 기준을 넘는 기회가 발견되면 알림을 보냅니다.

초기 알림 채널 후보:

- Telegram
- Discord Webhook
- Email
- Browser Push

## 데이터 소스 후보

- Binance Spot WebSocket Streams
- Binance Spot REST API
- Binance USD-M Futures REST API
- Binance Futures WebSocket Streams
- Binance Simple Earn SAPI
- Binance Support Announcement

## MVP 범위

초기 MVP는 다음 기능을 목표로 합니다.

- 주요 코인 실시간 가격 대시보드
- Simple Earn 상품 스크리너
- Simple Earn 공지 연동
- 고APR 상품의 Futures 마켓 존재 여부 확인
- 펀딩비 기반 예상 순 APR 계산
- Spot-Futures 베이시스 모니터링
- Telegram 또는 Discord Webhook 알림

자동 주문 실행은 MVP 범위에서 제외합니다. 먼저 데이터 수집, 분석, 알림 중심으로 안정적인 모니터링 도구를 만드는 것을 우선합니다.

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

## 보안 원칙

- API Key는 `.env` 또는 Secret Manager에 저장합니다.
- API Secret은 클라이언트에 노출하지 않습니다.
- 초기 버전에서는 읽기 전용 API Key만 사용합니다.
- 출금 권한과 거래 권한은 기본적으로 비활성화합니다.
- 로그에 API Key, Secret, 서명값을 남기지 않습니다.

## 리스크 고지

이 프로젝트는 투자 조언이나 자동매매 시스템이 아니라 모니터링 및 분석 도구입니다.

Simple Earn APR, Futures 펀딩비, 시장 가격, 유동성은 빠르게 변할 수 있습니다. 스테이킹+숏 전략은 펀딩비 역전, 청산, 락업, 슬리피지, 수수료, 이벤트 종료 등의 리스크를 포함합니다.

## 문서

- [요구 분석 문서](./REQUIREMENTS.md)

## 현재 상태

- 프로젝트 요구사항 정리 완료
- Git 레포 초기화 완료
- README 작성 완료

다음 단계는 MVP 기술 스택을 확정하고, 데이터 수집기와 첫 화면 구조를 설계하는 것입니다.
