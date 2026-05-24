import {
  Activity,
  Bell,
  Bot,
  CandlestickChart,
  ChevronDown,
  CircleDollarSign,
  Database,
  Gauge,
  LineChart,
  LockKeyhole,
  RefreshCcw,
  Search,
  Server,
  ShieldCheck,
  Star,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

type Coin = {
  symbol: string;
  name: string;
  price: string;
  change: number;
  volume: string;
  high: string;
  low: string;
  spread: string;
};

type EarnProduct = {
  symbol: string;
  apr: string;
  baseApr: string;
  event: string;
  status: string;
  quota: string;
  futures: string;
  netApr: string;
};

type Alert = {
  title: string;
  body: string;
  time: string;
  level: "info" | "warning" | "success";
};

const coins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: "68,420.12", change: 1.82, volume: "$24.8B", high: "69,110.00", low: "66,902.45", spread: "0.01%" },
  { symbol: "ETH", name: "Ethereum", price: "3,742.84", change: -0.46, volume: "$12.1B", high: "3,811.12", low: "3,690.20", spread: "0.02%" },
  { symbol: "SOL", name: "Solana", price: "168.38", change: 3.14, volume: "$3.7B", high: "171.40", low: "160.21", spread: "0.03%" },
  { symbol: "BNB", name: "BNB", price: "612.55", change: 0.68, volume: "$1.9B", high: "619.00", low: "602.44", spread: "0.02%" },
  { symbol: "TRX", name: "TRON", price: "0.1184", change: 2.27, volume: "$721M", high: "0.1201", low: "0.1157", spread: "0.04%" },
  { symbol: "XRP", name: "XRP", price: "0.6421", change: -1.09, volume: "$1.2B", high: "0.6570", low: "0.6328", spread: "0.03%" },
];

const earnProducts: EarnProduct[] = [
  { symbol: "TRX", apr: "18.6%", baseApr: "3.2%", event: "Flexible 이벤트", status: "구독 가능", quota: "72%", futures: "TRXUSDT", netApr: "11.4%" },
  { symbol: "AXS", apr: "24.1%", baseApr: "4.8%", event: "신규 캠페인", status: "한도 임박", quota: "91%", futures: "AXSUSDT", netApr: "14.8%" },
  { symbol: "BNB", apr: "7.9%", baseApr: "1.4%", event: "Launchpool 연계", status: "구독 가능", quota: "64%", futures: "BNBUSDT", netApr: "5.1%" },
  { symbol: "XRP", apr: "10.3%", baseApr: "2.1%", event: "기간 한정", status: "구독 가능", quota: "58%", futures: "XRPUSDT", netApr: "7.2%" },
];

const alerts: Alert[] = [
  { title: "TRX Simple Earn APR 상승", body: "Flexible APR 18.6%, 예상 순APR 11.4% 후보 감지", time: "방금", level: "success" },
  { title: "신규 Simple Earn 공지", body: "AXS 기간 한정 캠페인 조건 자동 파싱 완료", time: "8분 전", level: "info" },
  { title: "Funding fee 주의", body: "ETHUSDT 숏 기준 최근 8시간 펀딩비가 불리하게 전환", time: "22분 전", level: "warning" },
];

const arbitrageRows = [
  { path: "USDT → BNB → XRP → USDT", profit: "0.18%", size: "$4,200", status: "관찰" },
  { path: "SOL Spot ↔ SOLUSDT Perp", profit: "0.31%", size: "$8,500", status: "알림 후보" },
  { path: "USDT → BTC → ETH → USDT", profit: "0.07%", size: "$12,000", status: "수수료 미달" },
];

export function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span />
          </div>
          <div>
            <strong>Binance Monitor</strong>
            <small>Local MVP</small>
          </div>
        </div>

        <nav className="nav">
          <a className="nav-item active" href="#overview"><Gauge size={18} />개요</a>
          <a className="nav-item" href="#markets"><CandlestickChart size={18} />마켓</a>
          <a className="nav-item" href="#earn"><CircleDollarSign size={18} />Simple Earn</a>
          <a className="nav-item" href="#hedge"><ShieldCheck size={18} />헤지 전략</a>
          <a className="nav-item" href="#arbitrage"><Zap size={18} />Arbitrage</a>
          <a className="nav-item" href="#alerts"><Bell size={18} />알림</a>
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>Collector 정상</strong>
            <small>가격 1초, Earn 3분, 공지 30분</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="코인, 페어, 공지 검색" />
          </div>
          <div className="topbar-actions">
            <button className="icon-button" title="새로고침"><RefreshCcw size={18} /></button>
            <button className="pill-button"><Bot size={17} />@Tturu_news_bot</button>
            <button className="pill-button muted"><Server size={17} />Local</button>
          </div>
        </header>

        <section className="hero-band" id="overview">
          <div className="hero-copy">
            <span className="eyebrow">실시간 모니터링</span>
            <h1>Earn APR, Funding Fee, Arbitrage를 한 화면에서 추적</h1>
            <p>Simple Earn Flexible과 Futures 데이터를 결합해 스테이킹+숏 후보를 빠르게 찾고 Telegram으로 알림을 보냅니다.</p>
          </div>
          <div className="hero-stats">
            <Metric label="감시 코인" value="38" trend="+6" />
            <Metric label="고APR 후보" value="12" trend="+3" />
            <Metric label="활성 시그널" value="4" trend="2 alert" />
          </div>
        </section>

        <section className="grid metrics-grid">
          <MetricCard icon={<Activity size={19} />} label="Spot WebSocket" value="Live" detail="최근 업데이트 0.8초 전" tone="green" />
          <MetricCard icon={<Database size={19} />} label="Simple Earn" value="3분 주기" detail="Flexible 상품 우선" tone="yellow" />
          <MetricCard icon={<Wallet size={19} />} label="계정 잔고" value="Read-only" detail="주문/출금 권한 제외" tone="blue" />
          <MetricCard icon={<Bell size={19} />} label="Telegram" value="Ready" detail="@Tturu_news_bot 연결 예정" tone="green" />
        </section>

        <section className="content-grid">
          <section className="panel market-panel" id="markets">
            <PanelHeader title="Market Watch" subtitle="메이저 코인 실시간 가격" action="USDT 기준" />
            <div className="coin-grid">
              {coins.map((coin) => (
                <article className="coin-tile" key={coin.symbol}>
                  <div className="coin-head">
                    <div className="coin-icon">{coin.symbol.slice(0, 1)}</div>
                    <div>
                      <strong>{coin.symbol}</strong>
                      <small>{coin.name}</small>
                    </div>
                    <span className={coin.change >= 0 ? "change up" : "change down"}>
                      {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="price-row">${coin.price}</div>
                  <MiniChart positive={coin.change >= 0} />
                  <div className="coin-meta">
                    <span>Vol {coin.volume}</span>
                    <span>Spread {coin.spread}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel alert-panel" id="alerts">
            <PanelHeader title="Telegram Alerts" subtitle="실시간 감시 알림" action="3 active" />
            <div className="alert-list">
              {alerts.map((alert) => (
                <article className={`alert-card ${alert.level}`} key={alert.title}>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.body}</p>
                  </div>
                  <small>{alert.time}</small>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="panel" id="earn">
          <PanelHeader title="Simple Earn Flexible Screener" subtitle="공지 이벤트와 Futures 헤지 가능 여부를 함께 표시" action="APR 높은 순" />
          <div className="toolbar">
            <button className="filter active">Flexible</button>
            <button className="filter">Futures 있음</button>
            <button className="filter">이벤트 APR</button>
            <button className="filter">구독 가능</button>
            <button className="filter right"><ChevronDown size={16} />최소 순APR 5%</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>토큰</th>
                  <th>표시 APR</th>
                  <th>기본 APR</th>
                  <th>이벤트</th>
                  <th>상태</th>
                  <th>한도</th>
                  <th>Futures</th>
                  <th>예상 순APR</th>
                </tr>
              </thead>
              <tbody>
                {earnProducts.map((product) => (
                  <tr key={product.symbol}>
                    <td><span className="asset-symbol"><Star size={14} />{product.symbol}</span></td>
                    <td className="apr">{product.apr}</td>
                    <td>{product.baseApr}</td>
                    <td>{product.event}</td>
                    <td><span className="badge">{product.status}</span></td>
                    <td>{product.quota}</td>
                    <td>{product.futures}</td>
                    <td className="net-apr">{product.netApr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bottom-grid">
          <section className="panel" id="hedge">
            <PanelHeader title="Hedge Strategy Lab" subtitle="Earn + Futures 숏 예상 수익" action="Read-only" />
            <div className="strategy-card">
              <div className="strategy-main">
                <span className="coin-icon large">T</span>
                <div>
                  <strong>TRX Flexible + TRXUSDT Short</strong>
                  <p>Earn APR 18.6% - Funding 연율 5.7% - 비용 1.5%</p>
                </div>
              </div>
              <div className="strategy-score">
                <small>예상 순APR</small>
                <strong>11.4%</strong>
              </div>
            </div>
            <div className="risk-bars">
              <RiskBar label="펀딩비 위험" value={44} />
              <RiskBar label="청산 위험" value={28} />
              <RiskBar label="이벤트 종료 위험" value={72} />
            </div>
          </section>

          <section className="panel" id="arbitrage">
            <PanelHeader title="Arbitrage Monitor" subtitle="Binance 내부 페어 우선" action="쿨다운 적용" />
            <div className="signal-list">
              {arbitrageRows.map((row) => (
                <article className="signal-row" key={row.path}>
                  <LineChart size={18} />
                  <div>
                    <strong>{row.path}</strong>
                    <small>가능 수량 {row.size}</small>
                  </div>
                  <span>{row.profit}</span>
                  <em>{row.status}</em>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function PanelHeader({ title, subtitle, action }: { title: string; subtitle: string; action: string }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <button className="small-button">{action}</button>
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="hero-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{trend}</span>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function MiniChart({ positive }: { positive: boolean }) {
  const points = positive ? "0,34 18,28 36,30 54,16 72,20 90,8 108,12" : "0,10 18,15 36,13 54,21 72,18 90,29 108,26";
  return (
    <svg className="mini-chart" viewBox="0 0 108 40" role="img" aria-label="price sparkline">
      <polyline points={points} fill="none" stroke={positive ? "var(--green)" : "var(--red)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RiskBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="risk-bar">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <progress value={value} max={100} />
    </div>
  );
}
