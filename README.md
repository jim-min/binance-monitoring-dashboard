# Binance Monitoring Dashboard

Binance Monitoring Dashboard는 Binance의 시장 가격, Simple Earn 상품, Earn 이벤트 공지, Futures 펀딩비, 헤지 전략, arbitrage 기회를 한 곳에서 확인하는 로컬 대시보드입니다.

프론트엔드는 React + Vite + TypeScript로 구성되어 있고, 백엔드는 Node.js 로컬 API 서버로 Binance REST API, WebSocket, CMS 공지 데이터를 수집합니다. Telegram Bot을 통해 APR 이벤트 알림도 받을 수 있습니다.

## 주요 기능

- 주요 코인 실시간 가격 모니터링
- Binance Spot 및 Simple Earn 잔고 요약
- Simple Earn Flexible/Locked 상품 수집, 검색, 정렬
- Binance Earn 이벤트 공지 수집 및 APR 이벤트 분류
- APR 이벤트 Telegram 알림 및 앱 내부 알림 표시
- Simple Earn + Futures 숏 헤지 전략 백테스트
- Spot/Futures 가격, Funding Fee, Earn APR 히스토리 기반 전략 계산
- Binance 내부 arbitrage 기회 모니터링
- 한국어 UI

## 화면 구성

### Market Watch

주요 코인의 실시간 가격, 24시간 등락률, 거래량, 고가/저가, 스프레드 추정값을 표시합니다.

데이터는 Binance Spot WebSocket ticker stream을 기반으로 갱신합니다.

### Portfolio

Binance 읽기 전용 API key를 사용해 Spot 계정 잔고와 Simple Earn 계정 요약을 표시합니다.

표시 항목:

- Spot 추정 평가액
- Simple Earn 전체 평가액
- Flexible Earn 평가액
- Locked Earn 평가액
- 상위 Spot 보유 자산
- Binance 계정 상태

Spot 자산의 USDT 평가는 `ASSETUSDT` 가격을 우선 사용합니다. 해당 가격이 없으면 `ASSETBTC`와 `BTCUSDT`를 조합해 추정합니다. `LDUSDT`, `LDUSDC` 같은 Earn receipt token은 Simple Earn 평가액과 중복되지 않도록 Spot 목록에서 제외합니다.

### Simple Earn Screener

Binance Simple Earn 상품을 수집해 APR, 상품 유형, 구독 가능 여부, 한도, 이벤트 연관성 기준으로 확인할 수 있습니다.

사용 API:

- `/sapi/v1/simple-earn/flexible/list`
- `/sapi/v1/simple-earn/locked/list`

Flexible 상품과 Locked 상품을 함께 보여주며, 상품 수가 많아도 검색과 정렬로 원하는 코인을 빠르게 찾을 수 있습니다.

### Earn Events

Binance Support의 Latest Activities 공지를 가져와 Earn 이벤트를 표시합니다.

대상 페이지:

- https://www.binance.com/en/support/announcement/list/93

서버는 Binance CMS JSON endpoint에서 공지 목록을 가져오고, 상세 본문에서 토큰, 페어, APR/APY 문구, 보상 문구, 캠페인 기간을 파싱합니다. 상세 본문 조회가 실패하면 제목 기반 파싱으로 처리합니다.

Telegram 알림은 전체 공지가 아니라 APR/APY/Simple Earn/Flexible/Locked/Staking 계열 이벤트만 대상으로 합니다. 이미 보낸 공지 코드는 로컬 `.alert-state.json`에 저장해 중복 발송을 막습니다.

### Hedge Strategy Lab

Simple Earn으로 코인을 보유하고 동일 코인을 Futures에서 숏 포지션으로 헤지하는 전략을 계산합니다.

대상 코인은 아래 조건을 모두 만족하는 자산입니다.

- Simple Earn 상품 존재
- Binance Spot USDT 마켓 존재
- Binance USDT-M Perpetual Futures 마켓 존재

계산에 사용하는 데이터:

- Spot 가격 히스토리
- Futures 가격 히스토리
- Futures Funding Fee History
- Simple Earn APR 히스토리
- 수수료 입력값
- 슬리피지 입력값
- 숏 레버리지 입력값

표시 전략:

- `Earn Only`: 현물 보유 + Earn 수익
- `Short Only`: Futures 숏 포지션
- `Earn + Short`: 현물 Earn + Futures 숏 헤지

수익률은 기간 수익률, 필요 자본 기준 수익률, 연환산 수익률을 구분해 표시합니다. `Earn + Short` 전략에서는 Spot 투자금과 Short 명목가를 동일하게 유지하고, 레버리지는 Futures 증거금 계산에 반영합니다.

### Arbitrage Monitor

Binance 내부의 Spot 삼각 차익과 Spot-Futures basis 기회를 모니터링합니다.

Net 수익률은 gross 기회에서 거래 비용과 슬리피지 가정을 차감해 계산합니다. 가능 규모는 현재 최우선 호가 수량을 기준으로 보수적으로 추정합니다.

## 기술 스택

### Frontend

- React 19
- TypeScript
- Vite
- Lucide React icons
- CSS Modules 없이 전역 CSS 기반 스타일링

### Backend

- Node.js ESM
- Node built-in HTTP server
- Binance REST API
- Binance WebSocket Stream
- Binance CMS JSON endpoint
- Telegram Bot API

### Local Runtime

- PowerShell 실행 스크립트
- `.env` 기반 로컬 설정
- `.alert-state.json` 기반 Telegram 알림 중복 방지
- `local-services/telegram-news` 기반 Telegram 뉴스 모니터

### Test & Build

- Node built-in test runner
- TypeScript type check
- Vite production build

## 로컬 실행

프로젝트 루트에서 의존성을 설치합니다.

```powershell
npm install
```

권장 실행 방식:

```powershell
.\local-services\start-dashboard-dev.cmd
```

이 스크립트는 API 서버와 Vite 프론트엔드 서버를 숨김 프로세스로 실행합니다.

브라우저에서 접속:

```text
http://127.0.0.1:5173/
```

API 상태 확인:

```text
http://127.0.0.1:8787/api/health
http://127.0.0.1:8787/api/config/status
```

터미널을 직접 보고 싶다면 PowerShell 창을 2개 열고 프로젝트 루트에서 각각 실행합니다.

첫 번째 터미널:

```powershell
npm.cmd run server:dev
```

두 번째 터미널:

```powershell
npm.cmd run dev
```

`npm run dev`는 프론트엔드만 실행합니다. 잔고, Simple Earn, 공지, Telegram 알림, 헤지 백테스트 화면은 로컬 API 서버가 같이 떠 있어야 정상 동작합니다.

컴퓨터 부팅 시 자동 실행은 Telegram 뉴스 모니터만 담당합니다. Binance API 서버와 프론트엔드는 대시보드를 볼 때만 수동으로 실행합니다.

로그 위치:

```text
local-services/logs/
```

## 환경 변수

프로젝트 루트에 `.env` 파일을 두고 아래 값을 설정합니다.

```env
BINANCE_API_KEY=
BINANCE_API_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
API_PORT=8787
```

`BINANCE_API_KEY`와 `BINANCE_API_SECRET`은 Simple Earn 데이터와 계정 잔고 요약을 가져오기 위해 사용합니다. Binance API key 권한은 읽기 전용으로 설정합니다.

`TELEGRAM_BOT_TOKEN`과 `TELEGRAM_CHAT_ID`는 Telegram 알림 전송에 사용합니다.

## Telegram 테스트

API 서버가 실행 중일 때 아래 명령으로 테스트 메시지를 보낼 수 있습니다.

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8787/api/telegram/test" `
  -ContentType "application/json" `
  -Body '{"message":"Binance Monitoring Dashboard test"}'
```

사용 봇:

```text
@Tturu_news_bot
```

## 품질 확인

테스트 실행:

```powershell
npm.cmd test
```

프로덕션 빌드 확인:

```powershell
npm run build
```

커밋 전에는 테스트, 빌드, git 상태를 확인합니다.

```powershell
npm.cmd test
npm run build
git status --short
```

## 보안 원칙

- API Key, API Secret, Telegram Bot Token, Telegram Chat ID는 로컬 `.env`에 저장합니다.
- `.env`는 git에 커밋하지 않습니다.
- API Secret은 클라이언트에 노출하지 않습니다.
- Binance API key는 읽기 전용으로 사용합니다.
- 출금 권한은 사용하지 않습니다.
- 자동 주문 실행 권한은 사용하지 않습니다.
- 로그에 API Key, Secret, 서명값을 남기지 않습니다.

Telegram Bot Token은 비밀번호처럼 취급합니다. GitHub에 커밋하지 않고, 로그에도 남기지 않습니다.

## 리스크 고지

이 프로젝트는 투자 조언이나 자동매매 시스템이 아니라 모니터링 및 분석 도구입니다.

Simple Earn APR, Futures 펀딩비, 시장 가격, 유동성은 빠르게 변할 수 있습니다. 스테이킹+숏 전략은 펀딩비 역전, 청산, 락업, 슬리피지, 수수료, 이벤트 종료 등의 리스크를 포함합니다.

## 문서

- [요구 분석 문서](./REQUIREMENTS.md)
- [UML 및 아키텍처 문서](./ARCHITECTURE.md)
- [사용 설명서](./docs/USER_GUIDE.md)
