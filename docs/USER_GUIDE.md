# Binance Monitoring Dashboard 사용 설명서

이 문서는 Binance Monitoring Dashboard를 로컬에서 실행하고, 각 화면의 데이터를 해석하는 방법을 정리한 가이드입니다.

## 1. 서비스 목적

이 프로젝트는 Binance의 가격, Simple Earn, Futures funding fee, arbitrage 후보를 한 화면에서 모니터링하기 위한 로컬 대시보드입니다.

주요 목적은 다음과 같습니다.

- 메이저 코인의 실시간 가격 확인
- Simple Earn 상품의 APR, 구독 가능 여부, 이벤트성 고APR 후보 확인
- Simple Earn 보유 + Futures 숏 헤지 전략의 예상 수익률 비교
- Binance 내부 spot/futures 차익 기회 감시
- Telegram 알림 기반 시그널 수신

## 2. 실행 방법

프로젝트 루트에서 의존성을 설치합니다.

```bash
npm install
```

API 서버를 실행합니다.

```bash
npm run server:dev
```

프론트엔드 개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

```text
http://127.0.0.1:5173
```

## 3. .env 설정

프로젝트 루트에 `.env` 파일을 두고 아래 값을 설정합니다.

```env
BINANCE_API_KEY=
BINANCE_API_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
API_PORT=8787
```

`BINANCE_API_KEY`와 `BINANCE_API_SECRET`은 Simple Earn 데이터를 가져오기 위해 필요합니다. 현재 앱은 조회 목적이므로 Binance API key 권한은 읽기 전용으로 설정하는 것을 권장합니다.

`TELEGRAM_BOT_TOKEN`과 `TELEGRAM_CHAT_ID`는 알림 전송에 사용합니다.

## 4. 데이터 출처

### Market Watch

메이저 코인 가격은 Binance Spot WebSocket ticker stream을 기반으로 업데이트합니다.

사용 데이터:

- 현재가
- 24시간 등락률
- 거래대금
- 고가/저가
- 스프레드 추정값

### Simple Earn

Simple Earn 화면은 Binance signed API를 사용합니다.

사용 endpoint:

- Flexible: `/sapi/v1/simple-earn/flexible/list`
- Locked: `/sapi/v1/simple-earn/locked/list`

앱은 페이지네이션으로 가능한 상품을 수집한 뒤 아래 정보를 보여줍니다.

- 상품 유형
- 토큰
- 표시 APR
- Tier APR
- 구독 가능 여부
- 최소 구독 수량
- Hot 표시
- Product ID

### Hedge Strategy Lab

헤지 전략 페이지는 Simple Earn에 존재하면서 Binance USDT-M Perpetual Futures에도 상장된 코인만 후보로 표시합니다.

후보 생성 기준:

- Simple Earn 상품 목록에서 자산 추출
- Binance Futures exchangeInfo에서 USDT perpetual trading symbol 추출
- 두 목록의 base asset이 일치하는 코인만 표시

백테스트 데이터:

- Spot 가격: Binance Spot kline
- Futures 가격: Binance USDT-M Futures kline
- Funding fee: Binance Futures funding rate history
- Earn APR: 선택 코인의 Simple Earn 후보 APR 또는 사용자가 직접 입력한 값

계산에 반영되는 값:

- 투입 자금
- 백테스트 기간
- Earn APR
- 숏 헤지 비율
- Spot 수수료
- Futures 수수료
- 예상 슬리피지
- 과거 funding fee
- spot/futures 가격 변화

### Arbitrage Monitor

Arbitrage 화면은 Binance Spot/Futures bookTicker WebSocket을 기반으로 계산합니다.

감시 유형:

- Spot 삼각 차익
- Spot-Futures basis

Net 수익률은 gross 기회에서 거래 비용과 슬리피지 가정을 차감한 값입니다. 가능 규모는 현재 최우선 호가 수량을 기준으로 한 보수적 추정치입니다.

## 5. Hedge Strategy Lab 사용법

1. `대상 페어`를 선택합니다.
2. 검색창에 `TRX`, `TRXUSDT`처럼 코인명 또는 심볼을 입력할 수 있습니다.
3. 후보 목록은 Simple Earn과 Futures가 모두 있는 코인만 표시합니다.
4. 코인을 선택하면 해당 코인의 Simple Earn 최고 APR이 `Earn APR`에 자동 반영됩니다.
5. 투입 자금, 기간, 수수료, 슬리피지를 조정합니다.
6. 결과 카드에서 세 전략을 비교합니다.

전략별 의미:

- `Earn Only`: 현물을 보유하고 Earn 수익만 받는 경우
- `Short Only`: Futures 숏 포지션만 잡고 funding fee와 가격 손익을 보는 경우
- `Earn + Short`: 현물 Earn 수익을 받으면서 Futures 숏으로 가격 변동을 헤지하는 경우

손익 구성:

- Earn 이자 수익
- 현물 가격 손익
- Futures 숏 가격 손익
- 펀딩비 손익
- Spot 수수료
- Futures 수수료
- 예상 슬리피지

## 6. 결과 해석 시 주의사항

이 앱의 백테스트는 전략 비교를 위한 근사 계산입니다. 실제 매매 결과와 다를 수 있습니다.

주의해야 할 점:

- 실제 주문 체결가는 최우선 호가와 다를 수 있습니다.
- 슬리피지는 시장 상황에 따라 크게 달라질 수 있습니다.
- Funding fee는 미래에 같은 방향으로 유지된다는 보장이 없습니다.
- Simple Earn APR은 이벤트 종료, 한도 소진, Binance 정책 변경에 따라 빠르게 바뀔 수 있습니다.
- Futures 숏 포지션은 담보율, 레버리지, 청산 가격 관리가 필요합니다.
- 세금, 환전 비용, 입출금 수수료는 현재 계산에 포함하지 않습니다.

## 7. Telegram 알림

Telegram 설정이 완료되면 시그널이나 테스트 메시지를 봇으로 전송할 수 있습니다.

현재 프로젝트에서 사용하는 봇:

```text
@Tturu_news_bot
```

알림 기능은 이후 arbitrage 조건 충족, 고APR 이벤트 감지, funding fee 급변 감지 등에 연결할 수 있습니다.

## 8. AWS 배포 방향

로컬 사용이 안정화되면 Docker 기반으로 AWS EC2에 배포할 수 있습니다.

권장 방향:

- Dockerfile과 docker-compose 구성
- `.env`는 EC2 내부에 별도 배치
- API 서버와 프론트엔드를 같은 인스턴스에서 실행
- 보안 그룹에서 필요한 포트만 허용
- 이후 HTTPS, 인증, 로그 모니터링 추가

운영 단계에서는 Binance API key를 읽기 전용으로 유지하고, 가능하면 withdrawal 권한은 절대 부여하지 않는 것이 좋습니다.
