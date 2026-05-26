import { LineChart } from "lucide-react";
import { PanelHeader } from "../components/PanelHeader";
import { arbitrageRows } from "../data/mock";

export function ArbitragePage() {
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
