# Binance Monitoring Dashboard 요구 분석

## 1. 프로젝트 개요

Binance Monitoring Dashboard는 바이낸스의 주요 코인 가격, Simple Earn 상품, Futures 펀딩비, 스테이킹+숏 헤지 전략, 차익거래 기회를 한 화면 또는 여러 전문 화면에서 실시간으로 모니터링하는 개인용 투자 의사결정 도구이다.

이 프로젝트의 핵심 목적은 다음과 같다.

- 메이저 코인의 실시간 가격과 변동률을 빠르게 확인한다.
- Simple Earn 상품의 APR, 한도, 이벤트성 수익률을 정리해서 고APR 기회를 찾는다.
- 고APR Simple Earn 코인에 대해 Futures 숏 포지션을 결합했을 때 예상 순수익과 위험을 계산한다.
- 현물/선물/교차 페어 간 가격 차이를 감지해 차익거래 후보를 즉시 알림으로 받는다.

본 대시보드는 자동매매 시스템이 아니라, 우선은 모니터링과 시그널 탐지를 중심으로 한다. 주문 실행 기능은 별도 승인과 리스크 관리 설계 후 후속 단계에서 검토한다.

## 2. 사용자 목표

사용자는 다음과 같은 흐름으로 대시보드를 사용한다.

1. BTC, ETH, SOL, BNB, TRX, XRP 등 주요 코인의 가격과 변동률을 실시간으로 확인한다.
2. Binance Simple Earn 상품 중 APR이 높은 코인을 찾는다.
3. 해당 코인이 일시적인 이벤트 APR인지, 지속 가능한 기본 APR인지 확인한다.
4. 해당 코인의 Futures 마켓이 존재하는지 확인한다.
5. Spot 또는 Earn 보유분과 Futures 숏 포지션을 결합했을 때 예상 순수익을 계산한다.
6. 펀딩비, 베이시스, 수수료, 슬리피지, 청산 위험을 함께 확인한다.
7. 차익거래 조건이 설정한 기준을 넘으면 메시지, 이메일, 푸시 알림 등으로 신호를 받는다.

## 3. 주요 기능 요구사항

### 3.1 실시간 메이저 코인 가격 페이지

#### 대상 코인

초기 기본 감시 목록은 다음을 포함한다.

- BTC
- ETH
- SOL
- BNB
- TRX
- XRP

사용자는 이후 설정 화면에서 감시 코인을 추가하거나 제거할 수 있어야 한다.

#### 표시 정보

각 코인별로 다음 정보를 표시한다.

- 현재가
- 24시간 등락률
- 24시간 고가/저가
- 24시간 거래대금
- 최근 업데이트 시각
- 스프레드 또는 최우선 매수/매도 호가
- 간단한 미니 차트

#### 데이터 업데이트

- WebSocket 기반 실시간 업데이트를 우선 사용한다.
- WebSocket 연결이 끊기면 자동 재연결한다.
- 24시간마다 WebSocket 연결이 종료될 수 있으므로 재연결 로직을 설계한다.
- REST API는 초기 로딩, 장애 복구, 누락 데이터 보정용으로 사용한다.

#### 참고 데이터 소스

- Binance Spot WebSocket Streams  
  https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams

## 4. Simple Earn 스크리너

### 4.1 목적

Simple Earn 상품을 APR, 상품 유형, 구독 가능 여부, 한도, 이벤트 여부 기준으로 정리하여 고수익 후보를 빠르게 찾는다.

### 4.2 표시 정보

각 상품별로 다음 정보를 표시한다.

- 코인 심볼
- 상품 유형: Flexible, Locked
- 표시 APR
- 기본 APR과 이벤트 APR 구분
- 구독 가능 여부
- 총 한도 및 개인별 한도
- 남은 모집 수량
- 락업 기간
- 상환 가능 시점
- 자동 재구독 여부
- 원금 보장 여부 및 주요 약관 링크

### 4.3 정렬 및 필터

필수 필터는 다음과 같다.

- APR 높은 순
- Flexible / Locked
- 구독 가능 상품만 보기
- Futures 마켓 존재 상품만 보기
- 메이저 코인만 보기
- 이벤트성 APR 상품만 보기
- 최소 APR 기준
- 최소 유동성 기준

### 4.4 이벤트/공지 연동

Simple Earn APR은 이벤트에 의해 크게 변할 수 있으므로 Binance 공지 페이지의 이벤트 소식을 함께 보여준다.

대상 페이지:

- Binance Simple Earn 공지 리스트  
  https://www.binance.com/en/support/announcement/list/93

공지 데이터는 다음 기준으로 처리한다.

- 제목
- 게시일
- 관련 코인
- 이벤트 기간
- APR 또는 보상 조건
- 신규 사용자 한정 여부
- 국가/계정 조건
- 최소/최대 구독 금액
- 공지 원문 링크

공지와 Earn 상품을 코인 심볼 기준으로 매칭하고, 매칭된 상품에는 "관련 이벤트 있음" 표시를 제공한다.

### 4.5 API 및 인증 고려사항

Simple Earn 상품 조회는 Binance SAPI 계열의 인증 API가 필요할 수 있다.

참고 엔드포인트:

- `GET /sapi/v1/simple-earn/flexible/list`
- `GET /sapi/v1/simple-earn/locked/list`
- `GET /sapi/v1/simple-earn/flexible/history/rateHistory`

API Key는 읽기 전용 권한으로 시작하며, 출금 및 거래 권한은 비활성화한다.

## 5. Futures 정보 및 스테이킹+숏 전략 분석

### 5.1 목적

Simple Earn에서 높은 APR을 제공하는 코인에 대해 Futures 숏 포지션을 결합했을 때, 가격 변동을 헤지하면서 Earn 수익을 얻을 수 있는지 계산한다.

예시 전략:

- Spot 또는 Simple Earn으로 코인 보유
- 동일 수량만큼 USDT-M Perpetual Futures에서 숏 포지션 진입
- 코인 가격 상승/하락 노출은 줄이고, Earn APR에서 펀딩비와 수수료를 뺀 순수익을 노림

### 5.2 표시 정보

고APR Simple Earn 후보에 대해 다음 정보를 표시한다.

- Futures 심볼 존재 여부
- 현재 선물 가격
- 현물 가격
- 베이시스: 선물가 - 현물가
- 베이시스 비율
- 현재 펀딩비
- 다음 펀딩 예정 시각
- 최근 8시간, 24시간, 7일 평균 펀딩비
- 펀딩비 연율 환산
- 예상 Earn APR
- 예상 펀딩 비용 또는 수익
- 거래 수수료
- 예상 순 APR
- 추천 헤지 수량
- 필요 증거금
- 청산 가격
- 포지션 위험도

### 5.3 순수익 계산

기본 계산식은 다음과 같다.

```text
예상 순 APR =
  Simple Earn APR
  - Futures 펀딩비 연율
  - 거래 수수료 연율 환산
  - 슬리피지 비용 연율 환산
  - 기타 비용
```

펀딩비가 숏 포지션에 유리한 방향이면 순수익에 더하고, 불리한 방향이면 비용으로 차감한다.

### 5.4 시뮬레이션 입력값

사용자는 다음 값을 직접 조정할 수 있어야 한다.

- 투자 원금
- 헤지 비율: 50%, 75%, 100%, 사용자 지정
- 레버리지
- 예상 보유 기간
- 수수료율
- 예상 슬리피지
- 펀딩비 계산 기준: 현재값, 최근 24시간 평균, 최근 7일 평균

### 5.5 리스크 표시

대시보드는 수익률만 보여주지 않고 다음 리스크를 명확히 표시해야 한다.

- 펀딩비가 갑자기 불리하게 변할 수 있음
- Earn APR이 이벤트 종료 후 급락할 수 있음
- Locked 상품은 중도 상환 제약이 있을 수 있음
- 숏 포지션은 청산 위험이 있음
- 현물/선물 심볼, 계약 단위, 최소 주문 수량이 다를 수 있음
- 차익보다 수수료와 슬리피지가 클 수 있음
- Binance 지역 제한, 계정 등급, KYC 조건에 따라 상품 접근이 달라질 수 있음

### 5.6 참고 데이터 소스

- Binance USDⓈ-M Futures Funding Rate History  
  https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History
- Binance USDⓈ-M Futures Funding Info  
  https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Info

## 6. Arbitrage 모니터링

### 6.1 목적

Binance 내 다양한 페어 간 가격 차이를 실시간으로 감지하고, 수수료와 슬리피지를 고려한 뒤 실제 차익 가능성이 있을 때 알림을 보낸다.

### 6.2 모니터링 유형

초기에는 다음 유형을 고려한다.

#### 6.2.1 Spot 삼각 차익거래

예시:

```text
USDT -> BTC -> ETH -> USDT
```

또는

```text
USDT -> BNB -> XRP -> USDT
```

필요 계산:

- 각 페어의 bid/ask 가격
- 거래 수수료
- 최소 주문 수량
- 호가창 깊이
- 예상 슬리피지
- 체결 가능 수량
- 최종 순수익률

#### 6.2.2 Spot-Futures 베이시스 차익

예시:

```text
Spot 매수 + Futures 숏
```

또는

```text
Spot 매도 + Futures 롱
```

필요 계산:

- 현물 가격
- 선물 가격
- 베이시스
- 펀딩비
- 수수료
- 보유 기간별 기대 수익

#### 6.2.3 Stablecoin 페어 차익

예시:

```text
USDT / USDC / FDUSD
```

필요 계산:

- 환산 가격
- 수수료
- 유동성
- 디페그 위험

### 6.3 알림 조건

사용자는 다음 조건을 설정할 수 있어야 한다.

- 최소 순수익률
- 최소 예상 수익금
- 최소 거래 가능 금액
- 특정 코인 제외
- 특정 페어만 포함
- 알림 쿨다운
- 동일 시그널 반복 방지

### 6.4 알림 채널

초기 알림 채널 후보는 다음과 같다.

- Telegram 메시지
- Discord Webhook
- 이메일
- 브라우저 푸시 알림
- 모바일 푸시 알림

MVP에서는 구현 난도가 낮고 실시간성이 좋은 Telegram 또는 Discord Webhook을 우선 적용한다.

## 7. 화면 구성

### 7.1 Dashboard Home

전체 상태를 요약한다.

- 주요 코인 가격 카드
- 고APR Simple Earn 상위 상품
- 스테이킹+숏 예상 순APR 상위 후보
- 활성 arbitrage 시그널
- 시스템 상태: WebSocket, API rate limit, 마지막 동기화 시각

### 7.2 Market Watch

주요 코인의 실시간 가격, 변동률, 거래량, 미니 차트를 제공한다.

### 7.3 Simple Earn Screener

Simple Earn 상품을 테이블과 필터 중심으로 보여준다.

### 7.4 Earn Events

Binance 공지 중 Simple Earn 관련 이벤트를 목록으로 보여주고, 관련 상품과 연결한다.

### 7.5 Hedge Strategy Lab

고APR 상품을 선택해 Spot/Earn + Futures 숏 전략의 예상 수익과 위험을 시뮬레이션한다.

### 7.6 Arbitrage Monitor

차익거래 후보와 실시간 시그널을 보여준다.

### 7.7 Settings

다음 설정을 관리한다.

- API Key
- 감시 코인 목록
- 알림 채널
- 수수료율
- 최소 수익률 기준
- 리스크 한도
- 데이터 갱신 주기

## 8. 데이터 아키텍처 요구사항

### 8.1 데이터 수집

데이터 수집기는 다음 역할로 나눈다.

- Spot Market Collector
- Futures Market Collector
- Funding Rate Collector
- Simple Earn Collector
- Announcement Collector
- Arbitrage Engine
- Notification Worker

### 8.2 저장 데이터

저장 대상은 다음과 같다.

- 코인 메타데이터
- 심볼 및 페어 정보
- 가격 스냅샷
- 호가창 스냅샷
- 펀딩비 히스토리
- Simple Earn 상품 히스토리
- 공지 히스토리
- 시그널 히스토리
- 사용자 설정

### 8.3 데이터베이스 후보

MVP에서는 다음 구성을 권장한다.

- PostgreSQL: 상품, 공지, 시그널, 설정 저장
- Redis: 실시간 가격 캐시, WebSocket 상태, 알림 쿨다운

간단한 로컬 MVP는 SQLite + 메모리 캐시로 시작할 수 있다.

## 9. 비기능 요구사항

### 9.1 성능

- 주요 코인 가격은 1초 이내 지연으로 갱신한다.
- Simple Earn 상품은 1분에서 10분 간격으로 갱신한다.
- 공지는 5분에서 30분 간격으로 갱신한다.
- Arbitrage 계산은 실시간 호가 기준으로 수행하되, 과도한 API 호출을 피한다.

### 9.2 안정성

- WebSocket 자동 재연결
- API rate limit 감지
- 데이터 수집 실패 시 재시도
- 오래된 데이터 표시 경고
- 알림 중복 방지

### 9.3 보안

- API Key는 서버 환경변수 또는 Secret Manager에 저장한다.
- 클라이언트에 API Secret을 노출하지 않는다.
- 초기 버전에서는 읽기 전용 API Key만 사용한다.
- 거래 실행 권한은 기본적으로 비활성화한다.
- 로그에 API Key, Secret, 서명값을 기록하지 않는다.

### 9.4 규정 및 책임

- 대시보드는 투자 조언이 아니라 데이터 분석 도구임을 명시한다.
- 자동 주문 기능을 추가할 경우 별도 리스크 동의와 안전장치를 둔다.
- Binance 상품 접근성은 국가, 계정, KYC 상태에 따라 달라질 수 있음을 표시한다.

## 10. MVP 범위

### 10.1 MVP에 포함

- 주요 코인 실시간 가격 대시보드
- Simple Earn 상품 목록 스크리너
- Simple Earn 공지 목록 연동
- 고APR 상품의 Futures 존재 여부 표시
- 펀딩비 및 예상 순APR 계산
- 기본 Spot-Futures 베이시스 모니터링
- Telegram 또는 Discord Webhook 알림
- 로컬 환경에서 실행 가능한 웹 대시보드

### 10.2 MVP에서 제외

- 자동 주문 실행
- 복수 거래소 간 차익거래
- 고급 포트폴리오 리밸런싱
- 모바일 앱
- 세금 계산
- 완전 자동 청산 방어

## 11. 후속 확장 아이디어

- Binance 외 거래소와 가격 비교
- 실제 계정 포지션 기반 수익률 추적
- 전략별 백테스트
- 펀딩비 예측 모델
- APR 이벤트 종료 예측
- Telegram 봇에서 직접 쿼리
- 모바일 PWA
- 자동 주문 모듈
- 리스크 한도 초과 시 자동 알림 또는 포지션 축소

## 12. 초기 기술 스택 제안

### Frontend

- Next.js 또는 React
- TypeScript
- Recharts 또는 Lightweight Charts
- TanStack Query
- WebSocket client

### Backend

- Python FastAPI 또는 Node.js NestJS
- Binance REST/WebSocket client
- Background worker
- Scheduler

### Storage

- PostgreSQL
- Redis
- SQLite for local MVP

### Notification

- Telegram Bot API
- Discord Webhook
- SMTP 또는 transactional email provider

## 13. 핵심 성공 기준

이 프로젝트가 성공했다고 판단할 수 있는 기준은 다음과 같다.

- 주요 코인의 현재가가 안정적으로 실시간 갱신된다.
- Simple Earn 상품과 관련 이벤트를 한 화면에서 비교할 수 있다.
- 고APR 상품 중 Futures 헤지 가능 후보를 자동으로 분류한다.
- Earn APR, 펀딩비, 수수료를 반영한 예상 순APR을 계산한다.
- 차익거래 후보가 기준을 넘으면 즉시 알림을 받을 수 있다.
- 사용자가 실제 투자 전에 수익뿐 아니라 리스크를 함께 판단할 수 있다.

## 14. 오픈 질문

다음 항목은 구현 전 추가 결정이 필요하다.

- 첫 MVP는 로컬 개인용 앱으로 만들 것인가, 서버 배포형 웹앱으로 만들 것인가?
- 알림 채널은 Telegram과 Discord 중 무엇을 우선할 것인가?
- Simple Earn은 Flexible만 먼저 볼 것인가, Locked까지 포함할 것인가?
- 투자 원금과 실제 계정 잔고를 연동할 것인가, 수동 입력으로 시작할 것인가?
- 차익거래는 Binance 내부 페어만 볼 것인가, 추후 타 거래소까지 확장할 것인가?
- 한국어 UI를 기본으로 할 것인가, 영어 UI도 함께 제공할 것인가?
- API Key를 로컬 `.env`로 관리할 것인가, 별도 Secret Manager를 사용할 것인가?
