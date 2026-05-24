# Binance Monitoring Dashboard 요구 분석

## 1. 프로젝트 개요

Binance Monitoring Dashboard는 바이낸스의 주요 코인 가격, Simple Earn 상품, Futures 펀딩비, 스테이킹+숏 헤지 전략, 차익거래 기회를 한 화면 또는 여러 전문 화면에서 실시간으로 모니터링하는 개인용 투자 의사결정 도구이다.

이 프로젝트의 핵심 목적은 다음과 같다.

- 메이저 코인의 실시간 가격과 변동률을 빠르게 확인한다.
- Simple Earn 상품의 APR, 한도, 이벤트성 수익률을 정리해서 고APR 기회를 찾는다.
- 고APR Simple Earn 코인에 대해 Futures 숏 포지션을 결합했을 때 예상 순수익과 위험을 계산한다.
- 현물/선물/교차 페어 간 가격 차이를 감지해 차익거래 후보를 즉시 알림으로 받는다.

본 대시보드는 자동매매 시스템이 아니라, 우선은 모니터링과 시그널 탐지를 중심으로 한다. 주문 실행 기능은 별도 승인과 리스크 관리 설계 후 후속 단계에서 검토한다.

초기 MVP는 로컬 개인용 앱으로 개발한다. 사용자는 GitHub에서 프로젝트를 clone한 뒤 로컬 환경에서 실행하는 방식을 기본으로 하며, 서버 배포형 웹앱은 사용자가 늘어나거나 상시 운영 필요성이 생긴 뒤 후속 단계에서 검토한다.

## 2. 사용자 목표

사용자는 다음과 같은 흐름으로 대시보드를 사용한다.

1. BTC, ETH, SOL, BNB, TRX, XRP 등 주요 코인의 가격과 변동률을 실시간으로 확인한다.
2. Binance Simple Earn Flexible 상품 중 APR이 높은 코인을 찾는다.
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
- 상품 유형: Flexible 우선, Locked는 후속 확장
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
- Flexible 상품 우선
- Locked 상품은 후속 확장 옵션
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

Simple Earn 상품 조회는 Binance SAPI 계열의 인증 API가 필요할 수 있다. MVP에서는 자산 유동성을 확보하고 이벤트성 APR 변동에 빠르게 대응하기 위해 Flexible 상품을 우선 수집한다.

참고 엔드포인트:

- `GET /sapi/v1/simple-earn/flexible/list`
- `GET /sapi/v1/simple-earn/flexible/history/rateHistory`

Locked 상품 조회는 후속 확장 시 `GET /sapi/v1/simple-earn/locked/list`를 추가 검토한다.

API Key는 읽기 전용 권한으로 시작하며, 출금 및 거래 권한은 비활성화한다. 실제 계정 잔고 연동은 MVP에 포함하되, 주문 실행 권한 없이 잔고 조회 및 포지션 조회 중심으로 제한한다.

## 5. Simple Earn 공지 연동 설계

### 5.1 연동 목적

Binance Simple Earn의 APR은 상시 상품 수익률뿐 아니라 기간 한정 이벤트, 신규 사용자 이벤트, 특정 코인 캠페인에 의해 크게 달라질 수 있다. 따라서 Simple Earn 상품 데이터만 수집하면 실제 고APR 기회의 원인을 설명하기 어렵다.

공지 연동의 목적은 다음과 같다.

- Simple Earn 상품의 높은 APR이 일반 APR인지 이벤트 APR인지 구분한다.
- 이벤트 종료일, 참여 조건, 한도, 대상 코인을 함께 보여준다.
- 고APR 상품을 Futures 헤지 전략 후보로 볼 때 이벤트 지속 가능성을 판단한다.
- 이벤트 종료 전후 APR 급락 리스크를 사용자에게 알려준다.

### 5.2 WebSocket 가능성 검토

Binance 공지 페이지는 실시간 시세 데이터처럼 WebSocket 스트림을 제공하는 성격의 데이터가 아니다. 가격, 체결, 호가, 펀딩비 같은 시장 데이터는 WebSocket이 적합하지만, 공지사항은 문서형 콘텐츠이며 업데이트 빈도도 상대적으로 낮다.

따라서 공지 연동은 WebSocket이 아니라 다음 방식 중 하나를 우선 검토한다.

1. Binance Support announcement 페이지를 주기적으로 크롤링한다.
2. 크롤링 결과를 DB에 저장하고 이전 수집 결과와 비교해 신규 공지만 감지한다.
3. 추후 안정적인 공식 Announcement API가 확인되면 크롤러를 API adapter로 교체할 수 있게 수집 인터페이스를 분리한다.

### 5.3 후보 방식 비교

| 방식 | 장점 | 단점 | MVP 적합도 |
| --- | --- | --- | --- |
| 공식 Announcement API | 구조화된 데이터, 파싱 안정성 높음 | 공개 문서화 여부 확인 필요, 변경 가능성 있음 | 높음 |
| HTML 크롤링 | 구현이 단순하고 페이지 기준으로 빠르게 시작 가능 | DOM 변경에 취약, 차단/레이트리밋 가능성 | 중간 |
| 브라우저 렌더링 크롤링 | JS 렌더링 페이지에도 대응 가능 | 무겁고 운영 비용 증가 | 낮음 |
| RSS 또는 Sitemap 확인 | 가볍고 변경 감지에 유리 | Binance가 원하는 카테고리별 RSS를 제공하지 않을 수 있음 | 중간 |
| WebSocket | 실시간 감지 가능 | 공지 데이터에는 공식 스트림이 없을 가능성이 높음 | 낮음 |

### 5.4 MVP 권장안

MVP에서는 다음 접근을 권장한다.

1. Binance Simple Earn 공지 리스트 페이지를 주기적으로 수집한다.
2. 공지 제목, URL, 게시일, 카테고리, 요약 텍스트를 저장한다.
3. 신규 URL 또는 제목 해시가 발견되면 신규 공지로 판단한다.
4. 공지 상세 페이지를 수집해 관련 코인, 이벤트 기간, APR, 참여 조건을 추출한다.
5. 추출된 코인 심볼을 Simple Earn 상품 목록과 매칭한다.
6. 매칭된 상품에는 "관련 이벤트 있음", "이벤트 종료일", "이벤트 조건"을 표시한다.
7. 신규 공지가 발견되면 Telegram으로 알림을 보낸다.
8. 크롤링 실패 시 마지막 성공 데이터와 실패 시각을 표시한다.

공지 자체는 30분 간격으로 수집하되, APR 변동에 빠르게 대응하기 위해 Simple Earn Flexible 상품 데이터는 별도 collector에서 더 짧은 주기로 갱신한다. 사용자가 Simple Earn 화면을 열었을 때는 수동 새로고침으로 즉시 재조회할 수 있게 한다.

### 5.5 수집 주기

공지 데이터는 초 단위 실시간성이 필요하지 않다. 초기 기준은 다음과 같다.

- 공지 기본 수집 주기: 30분
- Simple Earn Flexible 상품 갱신 주기: 1분에서 5분 사이
- 사용자가 보는 화면의 수동 새로고침: 허용
- 실패 시 재시도: 1분 후 1회, 이후 다음 정기 수집까지 대기
- 동일 공지 중복 알림 방지: URL 또는 announcement ID 기준
- 신규 공지 발견 시 Telegram 알림 발송

공지 페이지는 일반 웹 페이지이므로 브라우저의 DOM 이벤트 리스너처럼 서버가 실시간 변경 이벤트를 받아오는 방식은 기대하기 어렵다. 대신 주기적 크롤링, 수동 새로고침, Simple Earn API의 빠른 갱신을 조합해 실질적인 대응 속도를 확보한다.

### 5.6 파싱 대상 필드

공지 리스트에서 수집할 필드는 다음과 같다.

- 공지 ID 또는 URL
- 제목
- 카테고리
- 게시일
- 상세 페이지 URL
- 수집 시각

공지 상세에서 추출할 필드는 다음과 같다.

- 관련 코인 심볼
- 이벤트 시작일
- 이벤트 종료일
- APR 또는 보상률
- 대상 상품 유형: Flexible 우선, Locked 및 Dual Investment는 후속 확장
- 참여 조건
- 개인별 한도
- 총 보상 풀
- 신규 사용자 한정 여부
- 국가 또는 계정 제한
- 원문 링크

### 5.7 설계 질문

공지 연동 방식을 확정하기 위해 다음 질문에 답해야 한다.

| 질문 | 선택지 또는 답변 방향 | 결정 상태 |
| --- | --- | --- |
| 공지 수집은 Binance Support 페이지 크롤링으로 시작할 것인가, 먼저 비공식/공식 API를 찾아볼 것인가? | 크롤링 우선. 추후 공식 API가 확인되면 adapter 교체 가능하게 설계 | 결정 |
| 공지 수집 주기는 어느 정도가 적절한가? | 공지는 30분 간격. Simple Earn 상품 데이터는 더 짧은 주기로 갱신 | 결정 |
| 신규 공지 알림도 보낼 것인가, 화면 표시만 할 것인가? | 신규 공지 발견 시 Telegram 알림 포함 | 결정 |
| 공지 상세 내용에서 APR과 이벤트 조건을 자동 파싱할 것인가? | 특정 토큰의 APR과 참여 조건 자동 파싱 | 결정 |
| 한국어 번역 요약이 필요한가? | 필요 / 불필요 / 추후 | 미정 |
| 크롤링 실패 시 어느 정도까지 허용할 것인가? | 마지막 성공 데이터 표시 / 오류 알림 / 기능 일시 비활성화 | 미정 |
| Binance 페이지 구조 변경에 대비한 fallback을 둘 것인가? | 필요 / MVP에서는 제외 | 미정 |
| 공지와 Simple Earn 상품 매칭 기준은 무엇으로 할 것인가? | 코인 심볼 / 상품 ID / 키워드 / 복합 기준 | 미정 |

## 6. Futures 정보 및 스테이킹+숏 전략 분석

### 6.1 목적

Simple Earn에서 높은 APR을 제공하는 코인에 대해 Futures 숏 포지션을 결합했을 때, 가격 변동을 헤지하면서 Earn 수익을 얻을 수 있는지 계산한다.

예시 전략:

- Spot 또는 Simple Earn으로 코인 보유
- 동일 수량만큼 USDT-M Perpetual Futures에서 숏 포지션 진입
- 코인 가격 상승/하락 노출은 줄이고, Earn APR에서 펀딩비와 수수료를 뺀 순수익을 노림

### 6.2 표시 정보

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

### 6.3 순수익 계산

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

### 6.4 시뮬레이션 입력값

사용자는 다음 값을 직접 조정할 수 있어야 한다.

- 투자 원금
- 헤지 비율: 50%, 75%, 100%, 사용자 지정
- 레버리지
- 예상 보유 기간
- 수수료율
- 예상 슬리피지
- 펀딩비 계산 기준: 현재값, 최근 24시간 평균, 최근 7일 평균

### 6.5 리스크 표시

대시보드는 수익률만 보여주지 않고 다음 리스크를 명확히 표시해야 한다.

- 펀딩비가 갑자기 불리하게 변할 수 있음
- Earn APR이 이벤트 종료 후 급락할 수 있음
- Locked 상품은 중도 상환 제약이 있을 수 있음
- 숏 포지션은 청산 위험이 있음
- 현물/선물 심볼, 계약 단위, 최소 주문 수량이 다를 수 있음
- 차익보다 수수료와 슬리피지가 클 수 있음
- Binance 지역 제한, 계정 등급, KYC 조건에 따라 상품 접근이 달라질 수 있음

### 6.6 참고 데이터 소스

- Binance USDⓈ-M Futures Funding Rate History  
  https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History
- Binance USDⓈ-M Futures Funding Info  
  https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Info

## 7. Arbitrage 모니터링

### 7.1 목적

Binance 내 다양한 페어 간 가격 차이를 실시간으로 감지하고, 수수료와 슬리피지를 고려한 뒤 실제 차익 가능성이 있을 때 알림을 보낸다.

### 7.2 모니터링 유형

초기에는 다음 유형을 고려한다.

#### 7.2.1 Spot 삼각 차익거래

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

#### 7.2.2 Spot-Futures 베이시스 차익

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

#### 7.2.3 Stablecoin 페어 차익

예시:

```text
USDT / USDC / FDUSD
```

필요 계산:

- 환산 가격
- 수수료
- 유동성
- 디페그 위험

### 7.3 알림 조건

사용자는 다음 조건을 설정할 수 있어야 한다.

- 최소 순수익률
- 최소 예상 수익금
- 최소 거래 가능 금액
- 특정 코인 제외
- 특정 페어만 포함
- 알림 쿨다운
- 동일 시그널 반복 방지

### 7.4 알림 채널

초기 알림 채널 후보는 다음과 같다.

- Telegram 메시지

MVP에서는 사용자가 이미 보유한 Telegram Bot을 우선 사용한다. Discord, 이메일, 브라우저 푸시, 모바일 푸시는 후속 확장 알림 채널로 둔다.

## 8. 화면 구성

### 8.1 Dashboard Home

전체 상태를 요약한다.

- 주요 코인 가격 카드
- 고APR Simple Earn 상위 상품
- 스테이킹+숏 예상 순APR 상위 후보
- 활성 arbitrage 시그널
- 시스템 상태: WebSocket, API rate limit, 마지막 동기화 시각

### 8.2 Market Watch

주요 코인의 실시간 가격, 변동률, 거래량, 미니 차트를 제공한다.

### 8.3 Simple Earn Screener

Simple Earn 상품을 테이블과 필터 중심으로 보여준다.

### 8.4 Earn Events

Binance 공지 중 Simple Earn 관련 이벤트를 목록으로 보여주고, 관련 상품과 연결한다.

### 8.5 Hedge Strategy Lab

고APR 상품을 선택해 Spot/Earn + Futures 숏 전략의 예상 수익과 위험을 시뮬레이션한다.

### 8.6 Arbitrage Monitor

차익거래 후보와 실시간 시그널을 보여준다.

### 8.7 Settings

다음 설정을 관리한다.

- API Key
- 감시 코인 목록
- 알림 채널
- 수수료율
- 최소 수익률 기준
- 리스크 한도
- 데이터 갱신 주기

## 9. 데이터 아키텍처 요구사항

### 9.1 데이터 수집

데이터 수집기는 다음 역할로 나눈다.

- Spot Market Collector
- Futures Market Collector
- Funding Rate Collector
- Simple Earn Collector
- Announcement Collector
- Arbitrage Engine
- Notification Worker
- Account Balance Collector

### 9.2 저장 데이터

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
- 계정 잔고 스냅샷
- Futures 포지션 스냅샷

### 9.3 데이터베이스 후보

MVP에서는 로컬 실행을 우선하므로 SQLite + 메모리 캐시로 시작한다.

후속 배포형 버전에서는 다음 구성을 검토한다.

- PostgreSQL: 상품, 공지, 시그널, 설정 저장
- Redis: 실시간 가격 캐시, WebSocket 상태, 알림 쿨다운

## 10. 비기능 요구사항

### 10.1 성능

- 주요 코인 가격은 1초 이내 지연으로 갱신한다.
- Simple Earn Flexible 상품은 1분에서 5분 간격으로 갱신한다.
- 공지는 30분 간격으로 갱신한다.
- Arbitrage 계산은 실시간 호가 기준으로 수행하되, 과도한 API 호출을 피한다.

### 10.2 안정성

- WebSocket 자동 재연결
- API rate limit 감지
- 데이터 수집 실패 시 재시도
- 오래된 데이터 표시 경고
- 알림 중복 방지

### 10.3 보안

- MVP에서는 API Key, API Secret, Telegram Bot Token, Telegram Chat ID를 로컬 `.env` 파일에 저장한다.
- `.env`는 git에 커밋하지 않도록 `.gitignore`에 포함한다.
- 클라이언트에 API Secret을 노출하지 않는다.
- 초기 버전에서는 읽기 전용 API Key만 사용한다.
- 실제 계정 잔고 연동은 허용하되 거래, 출금, 전송 권한은 사용하지 않는다.
- 거래 실행 권한은 기본적으로 비활성화한다.
- 로그에 API Key, Secret, 서명값을 기록하지 않는다.

Secret Manager는 AWS Secrets Manager, Google Secret Manager, Azure Key Vault, HashiCorp Vault처럼 API Key와 토큰을 중앙 보안 저장소에 보관하고 앱이 실행 시 권한을 받아 조회하는 방식이다. 서버 배포, 팀 운영, 권한 분리, 키 로테이션이 필요한 단계에서는 유리하지만, 로컬 개인용 MVP에서는 설정 부담이 크므로 `.env`를 기본으로 한다.

### 10.4 규정 및 책임

- 대시보드는 투자 조언이 아니라 데이터 분석 도구임을 명시한다.
- 자동 주문 기능을 추가할 경우 별도 리스크 동의와 안전장치를 둔다.
- Binance 상품 접근성은 국가, 계정, KYC 상태에 따라 달라질 수 있음을 표시한다.

## 11. MVP 범위

### 11.1 MVP에 포함

- 주요 코인 실시간 가격 대시보드
- Simple Earn Flexible 상품 목록 스크리너
- Simple Earn 공지 목록 연동
- 고APR 상품의 Futures 존재 여부 표시
- 펀딩비 및 예상 순APR 계산
- 기본 Spot-Futures 베이시스 모니터링
- Binance 내부 페어 중심 arbitrage 모니터링
- 실제 계정 잔고 조회 연동
- Telegram Bot 알림
- 로컬 환경에서 실행 가능한 웹 대시보드
- 한국어 UI

### 11.2 MVP에서 제외

- 자동 주문 실행
- 복수 거래소 간 차익거래
- Locked Simple Earn 우선 분석
- 영어 UI
- 고급 포트폴리오 리밸런싱
- 모바일 앱
- 세금 계산
- 완전 자동 청산 방어

## 12. 후속 확장 아이디어

- Binance 외 거래소와 가격 비교
- Locked Simple Earn 분석
- Discord, 이메일, 브라우저 푸시, 모바일 푸시 알림
- 실제 계정 포지션 기반 수익률 추적
- 전략별 백테스트
- 펀딩비 예측 모델
- APR 이벤트 종료 예측
- Telegram 봇에서 직접 쿼리
- 모바일 PWA
- 자동 주문 모듈
- 리스크 한도 초과 시 자동 알림 또는 포지션 축소

## 13. 초기 기술 스택 제안

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

- SQLite for local MVP
- PostgreSQL for deployed version
- Redis for deployed version and real-time cache

### Notification

- Telegram Bot API
- Discord Webhook for future expansion
- SMTP 또는 transactional email provider for future expansion

### UI

- 한국어 단일 UI
- 다국어 지원은 후속 확장

## 14. 핵심 성공 기준

이 프로젝트가 성공했다고 판단할 수 있는 기준은 다음과 같다.

- 주요 코인의 현재가가 안정적으로 실시간 갱신된다.
- Simple Earn 상품과 관련 이벤트를 한 화면에서 비교할 수 있다.
- 고APR 상품 중 Futures 헤지 가능 후보를 자동으로 분류한다.
- Earn APR, 펀딩비, 수수료를 반영한 예상 순APR을 계산한다.
- 차익거래 후보가 기준을 넘으면 즉시 알림을 받을 수 있다.
- 사용자가 실제 투자 전에 수익뿐 아니라 리스크를 함께 판단할 수 있다.

## 15. 오픈 질문

다음 항목은 구현 전 추가 결정이 필요하다.

| 질문 | 답변 | 설계 반영 |
| --- | --- | --- |
| 첫 MVP는 로컬 개인용 앱으로 만들 것인가, 서버 배포형 웹앱으로 만들 것인가? | 로컬 개인용 앱 우선. 사용자는 GitHub에서 clone해서 로컬 실행 가능하게 한다. 배포는 후속 검토. | SQLite + 로컬 실행 중심 MVP로 설계한다. Docker 또는 간단한 실행 스크립트는 후속 구현 단계에서 검토한다. |
| 알림 채널은 Telegram과 Discord 중 무엇을 우선할 것인가? | Telegram 우선. 사용자가 이미 만들어둔 봇을 활용한다. | Notification Worker의 1차 구현 대상을 Telegram Bot API로 고정한다. Discord는 확장 채널로 둔다. |
| Simple Earn은 Flexible만 먼저 볼 것인가, Locked까지 포함할 것인가? | Flexible 우선. 이벤트성 APR 변동과 자산 유동성 확보가 중요하다. | Simple Earn Collector는 Flexible API와 rate history를 우선 구현한다. Locked는 후속 확장으로 분리한다. |
| 투자 원금과 실제 계정 잔고를 연동할 것인가, 수동 입력으로 시작할 것인가? | 실제 계정 잔고 연동을 포함하면 좋다. | 읽기 전용 API Key로 Spot/Earn/Futures 잔고와 포지션 조회를 설계한다. 거래 및 출금 권한은 비활성화한다. |
| 차익거래는 Binance 내부 페어만 볼 것인가, 추후 타 거래소까지 확장할 것인가? | 빠른 대응을 위해 Binance 내부만 우선 본다. 다만 타 거래소 확장 가능성은 열어둔다. | Arbitrage Engine은 exchange adapter 구조를 고려하되 MVP adapter는 Binance만 구현한다. |
| 한국어 UI를 기본으로 할 것인가, 영어 UI도 함께 제공할 것인가? | 한국어만 있어도 된다. | MVP UI 문구, 알림 메시지, 설정 화면은 한국어 단일 언어로 작성한다. |
| API Key를 로컬 `.env`로 관리할 것인가, 별도 Secret Manager를 사용할 것인가? | 로컬 앱이므로 `.env` 우선. Secret Manager는 배포형 서비스나 팀 운영 단계에서 검토한다. | `.env.example`을 제공하고 실제 `.env`는 git에서 제외한다. API Key, API Secret, Telegram Bot Token, Telegram Chat ID를 환경변수로 읽는다. |
| Binance 공지 수집은 크롤링 우선으로 갈 것인가, API 우선으로 갈 것인가? | 실시간 이벤트 스트림이 없다면 크롤링만으로 시작한다. | Announcement Collector는 Binance Support 페이지 크롤링 adapter로 구현한다. 추후 공식 API adapter로 교체 가능하게 인터페이스를 분리한다. |
| 공지 수집 주기는 몇 분 단위가 적절한가? | 공지는 30분 간격. 단 APR 변동 대응을 위해 Simple Earn 상품 데이터는 더 빠르게 갱신한다. | 공지 collector는 30분 주기, Simple Earn Flexible collector는 1분에서 5분 주기로 분리한다. 화면에는 수동 새로고침을 제공한다. |
| 신규 공지 발견 시 알림을 보낼 것인가? | 알림을 보낸다. | 신규 공지 URL 또는 ID 감지 시 Telegram 알림을 발송하고 중복 발송을 방지한다. |
| 공지 상세에서 APR과 조건을 자동 파싱할 것인가? | 특정 토큰에 대한 APR과 조건을 파싱해서 보여준다. | 공지 상세 parser가 토큰 심볼, APR, 이벤트 기간, 참여 조건, 한도를 추출하고 Simple Earn 상품과 매칭한다. |
