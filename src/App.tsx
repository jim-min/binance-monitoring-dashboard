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
import { useEffect, useMemo, useState } from "react";
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

type Page = "overview" | "markets" | "earn" | "hedge" | "arbitrage";

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

const pagePaths: Record<Page, string> = {
  overview: "/",
  markets: "/markets",
  earn: "/earn",
  hedge: "/hedge",
  arbitrage: "/arbitrage",
};

const pageFromPath = (path: string): Page => {
  const found = (Object.entries(pagePaths) as Array<[Page, string]>).find(([, value]) => value === path);
  return found?.[0] ?? "overview";
};

export function App() {
  const [activePage, setActivePage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const pageTitle = useMemo(() => {
    const labels: Record<Page, string> = {
      overview: "Overview",
      markets: "Market Watch",
      earn: "Earn Screener",
      hedge: "Hedge Lab",
      arbitrage: "Arbitrage Monitor",
    };
    return labels[activePage];
  }, [activePage]);

  useEffect(() => {
    const handlePopState = () => setActivePage(pageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (page: Page) => {
    setActivePage(page);
    window.history.pushState({}, "", pagePaths[page]);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span />
          </div>
          <div>
            <strong>Binance Monitor</strong>
            <small>Strategy Desk</small>
          </div>
        </div>

        <nav className="nav">
          <NavButton active={activePage === "overview"} icon={<Gauge size={18} />} label="개요" onClick={() => navigate("overview")} />
          <NavButton active={activePage === "markets"} icon={<CandlestickChart size={18} />} label="마켓" onClick={() => navigate("markets")} />
          <NavButton active={activePage === "earn"} icon={<CircleDollarSign size={18} />} label="Simple Earn" onClick={() => navigate("earn")} />
          <NavButton active={activePage === "hedge"} icon={<ShieldCheck size={18} />} label="헤지 전략" onClick={() => navigate("hedge")} />
          <NavButton active={activePage === "arbitrage"} icon={<Zap size={18} />} label="Arbitrage" onClick={() => navigate("arbitrage")} />
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>시스템 정상</strong>
            <small>시장, 수익률, 알림 상태 양호</small>
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
            <span className="page-chip">{pageTitle}</span>
            <button className="icon-button" title="새로고침" type="button"><RefreshCcw size={18} /></button>
            <div className="alert-popover-wrap">
              <button className={`icon-button alert-trigger ${isAlertOpen ? "active" : ""}`} title="알림 기록" type="button" onClick={() => setIsAlertOpen((value) => !value)}>
                <Bell size={18} />
                <span>{alerts.length}</span>
              </button>
              {isAlertOpen && <AlertPopover onClose={() => setIsAlertOpen(false)} />}
            </div>
            <button className="pill-button"><Bot size={17} />@Tturu_news_bot</button>
            <button className="pill-button muted"><Server size={17} />Local</button>
          </div>
        </header>

        {activePage === "overview" && <OverviewPage />}
        {activePage === "markets" && <MarketsPage />}
        {activePage === "earn" && <EarnPage />}
        {activePage === "hedge" && <HedgePage />}
        {activePage === "arbitrage" && <ArbitragePage />}
      </section>
    </main>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function OverviewPage() {
  return (
    <>
      <section className="hero-band">
          <div className="hero-copy">
            <span className="eyebrow">실시간 모니터링</span>
            <h1>Earn APR, Funding Fee, Arbitrage를 한 화면에서 추적</h1>
            <p>고수익 Earn 기회와 헤지 비용을 함께 비교하고, 실행 가능한 시그널만 빠르게 확인합니다.</p>
          </div>
          <div className="hero-stats">
            <Metric label="감시 코인" value="38" trend="+6" />
            <Metric label="고APR 후보" value="12" trend="+3" />
            <Metric label="활성 시그널" value="4" trend="2 alert" />
          </div>
        </section>

        <section className="grid metrics-grid">
          <MetricCard icon={<Activity size={19} />} label="Market Stream" value="Live" detail="주요 코인 가격 갱신 중" tone="green" />
          <MetricCard icon={<Database size={19} />} label="Earn Screener" value="High APR" detail="이벤트 수익률 후보 추적" tone="yellow" />
          <MetricCard icon={<Wallet size={19} />} label="Portfolio" value="연동 대기" detail="잔고 기반 수익률 계산 준비" tone="blue" />
          <MetricCard icon={<Bell size={19} />} label="Alerts" value="Ready" detail="중요 시그널 즉시 전송" tone="green" />
        </section>

        <section className="content-grid">
          <MarketPanel compact />
          <AlertSummaryPanel />
        </section>
    </>
  );
}

function MarketsPage() {
  return <MarketPanel />;
}

function MarketPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className="panel market-panel">
            <PanelHeader title="Market Watch" subtitle="메이저 코인 실시간 가격" action="USDT 기준" />
            <div className={`coin-grid ${compact ? "" : "wide"}`}>
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
  );
}

function AlertSummaryPanel() {
  return (
    <section className="panel alert-panel">
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
  );
}

function AlertPopover({ onClose }: { onClose: () => void }) {
  return (
    <div className="alert-popover" role="dialog" aria-label="알림 기록">
      <div className="popover-header">
        <div>
          <strong>알림 기록</strong>
          <small>최근 시그널과 공지</small>
        </div>
        <button type="button" onClick={onClose}>닫기</button>
      </div>
      <div className="popover-list">
        {alerts.map((alert) => (
          <article className={`popover-alert ${alert.level}`} key={alert.title}>
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.body}</p>
            </div>
            <time>{alert.time}</time>
          </article>
        ))}
      </div>
    </div>
  );
}

function EarnPage() {
  return (
    <section className="panel page-panel">
          <PanelHeader title="Earn Opportunity Screener" subtitle="APR, 이벤트 조건, 헤지 비용을 함께 비교" action="APR 높은 순" />
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
  );
}

function HedgePage() {
  return (
    <section className="panel page-panel">
            <PanelHeader title="Hedge Strategy Lab" subtitle="Earn 수익과 숏 포지션 비용 비교" action="시뮬레이션" />
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
  );
}

function ArbitragePage() {
  return (
    <section className="panel page-panel">
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
