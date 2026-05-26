import { PanelHeader } from "../components/PanelHeader";
import { RiskBar } from "../components/RiskBar";

export function HedgePage() {
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
