import { Activity, ArrowRightLeft, LineChart, Radio, TriangleAlert } from "lucide-react";
import { PanelHeader } from "../components/PanelHeader";
import { useArbitrageMonitor } from "../hooks/useArbitrageMonitor";
import type { ArbitrageOpportunity, MarketConnectionStatus } from "../types";

export function ArbitragePage() {
  const { opportunities, liveCount, actionableCount, lastUpdatedAt, spotStatus, futuresStatus } = useArbitrageMonitor();

  return (
    <section className="panel page-panel">
      <PanelHeader title="Arbitrage Monitor" subtitle={`Binance 내부 ${opportunities.length}개 경로 실시간 감시 · ${lastUpdatedAt}`} action={`${actionableCount} alert`} />

      <div className="arb-summary-grid">
        <SummaryCard icon={<Radio size={18} />} label="Spot stream" value={statusLabel(spotStatus)} tone={spotStatus} />
        <SummaryCard icon={<Activity size={18} />} label="Futures stream" value={statusLabel(futuresStatus)} tone={futuresStatus} />
        <SummaryCard icon={<LineChart size={18} />} label="Live pairs" value={`${liveCount}/${opportunities.length}`} tone="live" />
        <SummaryCard icon={<TriangleAlert size={18} />} label="Actionable" value={`${actionableCount}`} tone={actionableCount > 0 ? "live" : "connecting"} />
      </div>

      <div className="arb-note">
        <strong>계산 기준</strong>
        <span>Spot 삼각 차익은 bid/ask와 3회 거래 비용을 반영하고, Spot-Futures 베이시스는 현물 매수 + Perp 숏 기준으로 계산합니다. 가능 규모는 현재 최우선 호가 수량 기준의 보수적 추정치입니다.</span>
      </div>

      <div className="arb-table-wrap">
        <table className="arb-table">
          <thead>
            <tr>
              <th>유형</th>
              <th>경로</th>
              <th>Legs</th>
              <th>Gross</th>
              <th>Net</th>
              <th>가능 규모</th>
              <th>상태</th>
              <th>업데이트</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((row) => (
              <ArbitrageRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: MarketConnectionStatus | "live" }) {
  return (
    <article className={`arb-summary-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function ArbitrageRow({ row }: { row: ArbitrageOpportunity }) {
  return (
    <tr>
      <td>
        <span className={`arb-type ${row.type}`}>
          <ArrowRightLeft size={14} />
          {row.type === "triangular" ? "Triangular" : "Basis"}
        </span>
      </td>
      <td>
        <strong className="arb-path">{row.path}</strong>
      </td>
      <td>
        <div className="arb-legs">
          {row.legs.map((leg) => <span key={leg}>{leg}</span>)}
        </div>
      </td>
      <td className={row.grossPct >= 0 ? "up" : "down"}>{formatPct(row.grossPct)}</td>
      <td className={row.netPct >= 0 ? "net-apr" : "down"}>{row.status === "waiting" ? "-" : formatPct(row.netPct)}</td>
      <td>{row.estimatedSize}</td>
      <td><span className={`arb-status ${row.status}`}>{statusText(row.status)}</span></td>
      <td>{row.updatedAt}</td>
    </tr>
  );
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}%`;
}

function statusText(status: ArbitrageOpportunity["status"]) {
  const labels: Record<ArbitrageOpportunity["status"], string> = {
    ready: "알림 후보",
    watching: "관찰",
    costly: "비용 미달",
    waiting: "대기",
  };
  return labels[status];
}

function statusLabel(status: MarketConnectionStatus) {
  const labels: Record<MarketConnectionStatus, string> = {
    connecting: "연결 중",
    live: "Live",
    reconnecting: "재연결",
    offline: "오프라인",
  };
  return labels[status];
}
