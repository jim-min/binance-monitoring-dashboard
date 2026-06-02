import { Eye, ShieldCheck, Wallet } from "lucide-react";
import { useAccountPortfolio } from "../hooks/useAccountPortfolio";
import { PanelHeader } from "./PanelHeader";

const formatUsd = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: value >= 1000 ? 0 : 2,
}).format(value);

const formatAmount = (value: number) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: value >= 1 ? 4 : 8,
}).format(value);

export function PortfolioPanel() {
  const { portfolio, isLoading, error, lastUpdatedAt } = useAccountPortfolio();
  const earnReceiptBalances = portfolio?.balances.filter((balance) => balance.asset.startsWith("LD")) ?? [];
  const balances = portfolio?.balances.filter((balance) => !balance.asset.startsWith("LD")).slice(0, 6) ?? [];

  return (
    <section className="panel portfolio-panel">
      <PanelHeader title="Portfolio" subtitle={`Binance 잔고 요약 · ${lastUpdatedAt}`} action={isLoading ? "연동 중" : portfolio?.accountType ?? "Spot"} />
      {error ? <div className="inline-warning">Binance 잔고 연결 실패: {error}</div> : null}

      <div className="portfolio-total-card">
        <div>
          <small>총 추정 평가액</small>
          <strong>{formatUsd(portfolio?.totals.combinedUsdtValue ?? 0)}</strong>
          <span>Spot {formatUsd(portfolio?.totals.spotUsdtValue ?? 0)} · Earn {formatUsd(portfolio?.totals.simpleEarnUsdtValue ?? 0)}</span>
        </div>
        <span className="metric-icon"><Wallet size={20} /></span>
      </div>

      <div className="portfolio-split-grid">
        <div>
          <small>Flexible Earn</small>
          <strong>{formatUsd(portfolio?.simpleEarn.summary?.totalFlexibleAmountInUSDT ?? 0)}</strong>
        </div>
        <div>
          <small>Locked Earn</small>
          <strong>{formatUsd(portfolio?.simpleEarn.summary?.totalLockedInUSDT ?? 0)}</strong>
        </div>
      </div>

      <div className="portfolio-permission-row">
        <span><ShieldCheck size={15} />거래 {portfolio?.canTrade ? "가능" : "제한"}</span>
        <span><Eye size={15} />조회 전용 권장</span>
      </div>

      <div className="portfolio-balance-list">
        <div className="portfolio-balance-title">
          <strong>Spot 지갑 직접 잔고</strong>
          <small>Simple Earn 예치분은 위 Earn 평가액에 합산됩니다.</small>
        </div>
        {earnReceiptBalances.length > 0 ? (
          <div className="portfolio-earn-receipt-note">
            LDUSDT/LDUSDC 같은 Earn receipt token {earnReceiptBalances.length}개는 중복 계산을 피하기 위해 Spot 목록에서 제외했습니다.
          </div>
        ) : null}
        {balances.length === 0 && !error ? <div className="empty-alert">표시할 Spot 직접 잔고가 없습니다.</div> : null}
        {balances.map((balance) => (
          <article className="portfolio-balance-row" key={balance.asset}>
            <div>
              <strong>{balance.asset}</strong>
              <small>{formatAmount(balance.total)} total · {formatAmount(balance.free)} free</small>
            </div>
            <span>{formatUsd(balance.usdtValue)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
