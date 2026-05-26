import { useMarketPrices } from "../hooks/useMarketPrices";
import { MiniChart } from "./MiniChart";
import { PanelHeader } from "./PanelHeader";

export function MarketPanel({ compact = false }: { compact?: boolean }) {
  const { coins, lastUpdatedAt, status, statusLabel } = useMarketPrices();

  return (
    <section className="panel market-panel">
      <PanelHeader title="Market Watch" subtitle={`메이저 코인 실시간 가격 · ${lastUpdatedAt}`} action={statusLabel} />
      <div className={`market-status ${status}`}>
        <span />
        Binance Spot WebSocket
      </div>
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
            {coin.updatedAt && <div className="coin-updated">Updated {coin.updatedAt}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}
