import { Activity, Bell, Database, Wallet } from "lucide-react";
import { AlertSummaryPanel } from "../components/alerts/AlertSummaryPanel";
import { MarketPanel } from "../components/MarketPanel";
import { Metric, MetricCard } from "../components/Metric";

export function OverviewPage() {
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
