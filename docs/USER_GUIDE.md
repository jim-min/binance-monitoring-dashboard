# Binance Monitoring Dashboard 사용 설명서

이 문서는 Binance Monitoring Dashboard를 로컬에서 실행하고, 각 화면의 데이터를 해석하는 방법을 정리한 가이드입니다.

## 1. 서비스 목적

이 프로젝트는 Binance의 가격, Simple Earn, Futures funding fee, arbitrage 후보를 한 화면에서 모니터링하기 위한 로컬 대시보드입니다.

주요 목적은 다음과 같습니다.

- 메이저 코인의 실시간 가격 확인
- Binance Spot/Simple Earn 잔고 요약 확인
- Simple Earn 상품의 APR, 구독 가능 여부, 이벤트성 고APR 후보 확인
- Simple Earn 보유 + Futures 숏 헤지 전략의 예상 수익률 비교
- Binance 내부 spot/futures 차익 기회 감시
- Telegram 알림 기반 시그널 수신

## 2. 실행 방법

프로젝트 루트에서 의존성을 설치합니다.

```powershell
npm install
```

### 권장 실행 방식

내가 로컬에서 서버들을 띄울 때 쓰는 방식과 동일하게 실행하려면 아래 스크립트를 사용합니다. 이 스크립트는 API 서버와 Vite 프론트엔드 서버를 숨김 프로세스로 각각 실행하고, 로그를 `local-services/logs/` 아래에 남깁니다.

```powershell
.\local-services\start-dashboard-dev.cmd
```

브라우저에서 아래 주소로 접속합니다.

```text
http://127.0.0.1:5173/
```

API 상태 확인:

```text
http://127.0.0.1:8787/api/health
http://127.0.0.1:8787/api/config/status
```

### 터미널을 직접 열어 실행하는 방식

터미널을 직접 보고 싶다면 PowerShell 창을 2개 열고 프로젝트 루트에서 각각 실행합니다.

첫 번째 터미널:

```powershell
npm.cmd run server:dev
```

두 번째 터미널:

```powershell
npm.cmd run dev
```

Windows PowerShell에서 `npm run dev`가 정책 문제나 실행 파일 해석 문제로 잘 동작하지 않으면 `npm.cmd run dev`처럼 `npm.cmd`를 직접 호출합니다.

`npm run dev`는 프론트엔드만 실행합니다. 이 프로젝트의 실제 데이터 화면은 로컬 API 서버도 필요하므로 `server:dev`가 같이 떠 있어야 합니다.

### 부팅 자동 실행

컴퓨터가 켜질 때 자동으로 실행되는 항목은 텔레그램 뉴스 모니터만 담당합니다.

자동 실행 바로가기:

```text
C:\Users\jimin\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Binance Monitoring Stack.lnk
```

이 자동 실행은 `local-services/start-binance-stack.cmd`를 호출하며, Binance API 서버와 프론트엔드는 자동으로 띄우지 않습니다. 대시보드를 보고 싶을 때만 위의 `start-dashboard-dev.cmd` 또는 수동 터미널 방식으로 실행합니다.

## 3. .env 설정

프로젝트 루트에 `.env` 파일을 두고 아래 값을 설정합니다.

```env
BINANCE_API_KEY=
BINANCE_API_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
API_PORT=8787
```

`BINANCE_API_KEY`와 `BINANCE_API_SECRET`은 Simple Earn 데이터와 계정 잔고 요약을 가져오기 위해 필요합니다. 현재 앱은 조회 목적이므로 Binance API key 권한은 읽기 전용으로 설정하는 것을 권장합니다. 출금 권한은 절대 켜지 않는 것을 권장합니다.

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

### Portfolio

Portfolio 패널은 Binance API key를 사용해 계정 잔고를 읽어옵니다.

사용 endpoint:

- Spot account: `/api/v3/account`
- Simple Earn account summary: `/sapi/v1/simple-earn/account`
- Spot ticker price: `/api/v3/ticker/price`

표시 정보:

- Spot 추정 평가액
- Simple Earn 추정 평가액
- Flexible Earn 평가액
- Locked Earn 평가액
- 상위 Spot 보유 자산
- Binance account type과 거래 가능 상태

Spot 자산의 USDT 평가는 `ASSETUSDT` 가격을 우선 사용합니다. 해당 가격이 없으면 `ASSETBTC`와 `BTCUSDT`를 조합해 추정하고, 가격 경로가 없으면 0으로 표시합니다. 따라서 실제 Binance 앱의 총 평가액과 약간 다를 수 있습니다.

현재 포함하지 않는 항목:

- Futures 포지션
- Margin 계정
- Funding 수익 미수금
- 전체 통합 계정 평가액
- 세금, 입출금 수수료, 체결 비용

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

### Earning Events

Earning Events 영역은 Binance 공지 페이지의 실제 데이터를 서버에서 가져와 표시합니다.

사용 source:

- `https://www.binance.com/en/support/announcement/list/93`
- 내부 CMS JSON endpoint: `/bapi/composite/v1/public/cms/article/list/query`
- 상세 본문 endpoint: `/bapi/composite/v1/public/cms/article/detail/query`

서버는 공지 목록을 가져온 뒤 최신 일부 공지는 상세 본문까지 조회합니다. 본문에서 아래 후보 정보를 파싱합니다.

- 토큰
- 거래 페어
- APR/APY 문구
- 보상 문구
- 캠페인 기간

Binance CMS는 특정 `pageSize` 값만 허용하므로 서버에서 요청 크기를 `5`, `10`, `20` 중 하나로 정규화합니다. 상세 본문이 빈 응답을 반환하면 제목 기반 파싱으로 fallback합니다.

### Hedge Strategy Lab

헤지 전략 페이지는 Simple Earn에 존재하면서 Binance USDT-M Perpetual Futures와 Spot USDT 시장에도 상장된 코인만 후보로 표시합니다.

후보 생성 기준:

- Simple Earn 상품 목록에서 자산 추출
- Binance Futures exchangeInfo에서 USDT perpetual trading symbol 추출
- Binance Spot exchangeInfo에서 Spot USDT trading symbol 추출
- 세 목록의 base asset과 symbol이 일치하는 코인만 표시

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

현재 구현된 자동 알림은 APR 이벤트 알림입니다.

APR 이벤트 알림 기준:

- Binance Earning Events 중 `APR`, `APY`, `Simple Earn`, `Flexible Product`, `Locked Product`, `staking` 계열 문구가 포함된 이벤트
- 일반 trading tournament, zero fee campaign, 단순 rewards 이벤트는 Telegram APR 알림 대상에서 제외

앱 내부 알림창과 메인 화면의 `Telegram Alerts` 패널도 같은 APR 이벤트 alert API를 사용합니다.

중복 발송 방지:

- 이미 Telegram으로 보낸 공지 코드는 로컬 `.alert-state.json`에 저장합니다.
- `.alert-state.json`은 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다.
- 서버를 재시작해도 기존에 보낸 APR 이벤트는 다시 보내지 않는 것을 목표로 합니다.

후속 연결 후보:

- arbitrage 조건 충족 알림
- funding fee 급변 알림
- Simple Earn APR 급변 알림

## 8. AWS 배포 방향

로컬 사용이 안정화되면 Docker 기반으로 AWS EC2에 배포할 수 있습니다.

권장 방향:

- Dockerfile과 docker-compose 구성
- `.env`는 EC2 내부에 별도 배치
- API 서버와 프론트엔드를 같은 인스턴스에서 실행
- 보안 그룹에서 필요한 포트만 허용
- 이후 HTTPS, 인증, 로그 모니터링 추가

운영 단계에서는 Binance API key를 읽기 전용으로 유지하고, 가능하면 withdrawal 권한은 절대 부여하지 않는 것이 좋습니다.
