import { AlertSummaryPanel } from "../components/alerts/AlertSummaryPanel";
import { MarketPanel } from "../components/MarketPanel";
import { Metric } from "../components/Metric";
import { PortfolioPanel } from "../components/PortfolioPanel";
import { useAprEventAlerts } from "../hooks/useAprEventAlerts";
import { useMarketPrices } from "../hooks/useMarketPrices";
import { useSimpleEarnProducts } from "../hooks/useSimpleEarnProducts";

export function OverviewPage() {
  const { coins, statusLabel } = useMarketPrices();
  const { products, hotCount, purchasableCount } = useSimpleEarnProducts();
  const { alerts } = useAprEventAlerts();
  const highAprCount = products.filter((product) => product.apr >= 0.05 && product.canPurchase && !product.isSoldOut).length;
  const uniqueEarnAssets = new Set(products.map((product) => product.asset)).size;

  return (
    <>
      <section className="hero-band">
        <div className="hero-copy">
          <span className="eyebrow">실시간 모니터링</span>
          <h1>Earn APR, Funding Fee, Arbitrage를 한 화면에서 추적</h1>
          <p>고수익 Earn 기회와 헤지 비용을 함께 비교하고, 실행 가능한 시그널만 빠르게 확인합니다.</p>
        </div>
        <div className="hero-stats">
          <Metric label="감시 코인" value={`${coins.length}`} trend={statusLabel} />
          <Metric label="고APR 후보" value={`${highAprCount}`} trend={`구독 가능 ${purchasableCount} · 자산 ${uniqueEarnAssets}`} />
          <Metric label="활성 시그널" value={`${alerts.length}`} trend={`APR 이벤트 ${hotCount} hot`} />
        </div>
      </section>

      <section className="content-grid">
        <MarketPanel compact />
        <PortfolioPanel />
      </section>

      <section className="grid">
        <AlertSummaryPanel />
      </section>
    </>
  );
}
