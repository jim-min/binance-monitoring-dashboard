# 주요 시퀀스 다이어그램

## 1. Simple Earn 공지 감지 및 Telegram 알림

공지 데이터는 WebSocket이 아니라 30분 주기 크롤링으로 수집한다. 신규 공지가 발견되면 상세 페이지를 파싱하고 Telegram 알림을 보낸다.

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as Scheduler
    participant Ann as AnnouncementCollector
    participant Binance as Binance Support Page
    participant Parser as AnnouncementParser
    participant DB as SQLite
    participant Earn as SimpleEarnCollector
    participant Noti as Telegram NotificationWorker
    participant Bot as @Tturu_news_bot

    Scheduler->>Ann: run every 30 minutes
    Ann->>Binance: crawl announcement list
    Binance-->>Ann: announcement list HTML/data
    Ann->>DB: compare URL or announcement ID

    alt new announcement exists
        Ann->>Binance: crawl announcement detail
        Binance-->>Ann: detail content
        Ann->>Parser: parse token, APR, period, terms, limits
        Parser-->>Ann: structured event data
        Ann->>DB: save announcement and parsed terms
        Ann->>Earn: match by token symbol and product type
        Earn->>DB: update related event mapping
        Ann->>Noti: request new announcement alert
        Noti->>Bot: sendMessage(chat_id, alert)
        Bot-->>Noti: ok
    else no new announcement
        Ann->>DB: update last checked timestamp
    end
```

## 2. Simple Earn + Futures 숏 전략 분석

Flexible Earn 상품을 빠르게 갱신하고, Futures 펀딩비와 베이시스를 결합해 예상 순APR을 계산한다.

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as Scheduler
    participant Earn as SimpleEarnCollector
    participant Futures as FuturesCollector
    participant Spot as MarketCollector
    participant Analyzer as HedgeAnalyzer
    participant DB as SQLite
    participant Noti as Telegram NotificationWorker
    participant UI as Web Dashboard

    Scheduler->>Earn: fetch Flexible products every 1-5 minutes
    Earn->>DB: save APR, quota, subscription status
    Scheduler->>Futures: fetch funding rate and funding history
    Futures->>DB: save current and historical funding
    Spot->>DB: save spot price and basis inputs

    Analyzer->>DB: load high APR Earn products
    Analyzer->>DB: load spot price, futures price, funding
    Analyzer->>Analyzer: calculate net APR
    Analyzer->>Analyzer: estimate margin and liquidation risk
    Analyzer->>DB: save hedge candidates

    alt net APR exceeds threshold
        Analyzer->>Noti: send hedge opportunity alert
    end

    UI->>DB: query hedge candidates
    DB-->>UI: ranked opportunities and risks
```

## 3. Binance 내부 Arbitrage 감지

MVP에서는 Binance 내부 페어만 모니터링한다. 타 거래소는 후속 확장을 위해 exchange adapter 구조로 열어둔다.

```mermaid
sequenceDiagram
    autonumber
    participant WS as Spot/Futures WebSocket
    participant Market as MarketCollector
    participant Arb as ArbitrageEngine
    participant DB as SQLite
    participant Noti as Telegram NotificationWorker
    participant Bot as @Tturu_news_bot
    participant UI as Web Dashboard

    WS-->>Market: price/orderbook updates
    Market->>DB: save latest bid/ask and ticker
    Market->>Arb: publish market update
    Arb->>Arb: scan triangular pairs
    Arb->>Arb: scan spot-futures basis
    Arb->>Arb: subtract fees and slippage
    Arb->>DB: save signal candidate

    alt net profit exceeds threshold and cooldown passed
        Arb->>Noti: send arbitrage alert
        Noti->>Bot: sendMessage(chat_id, signal)
        Bot-->>Noti: ok
        Arb->>DB: mark alert sent
    else not actionable
        Arb->>DB: save as observation only
    end

    UI->>DB: query latest arbitrage signals
    DB-->>UI: active and historical signals
```
