import { Activity, BarChart3, Calculator, RefreshCcw, Shield, TrendingDown, Wallet } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { PanelHeader } from "../components/PanelHeader";
import { RiskBar } from "../components/RiskBar";
import { useStrategyBacktest } from "../hooks/useStrategyBacktest";
import type { StrategyBacktest, StrategyResult } from "../types";

const SYMBOLS = ["TRXUSDT", "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT"];

const formatUsd = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
}).format(value);

const formatPct = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;

const formatNumber = (value: number, digits = 4) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: digits,
}).format(value);

function NumericField({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="strategy-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

function ResultCard({
  icon,
  title,
  description,
  result,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  result?: StrategyResult;
}) {
  const pnl = result?.pnl ?? 0;

  return (
    <article className={`strategy-result-card ${pnl >= 0 ? "positive" : "negative"}`}>
      <div className="strategy-result-head">
        <span className="metric-icon">{icon}</span>
        <div>
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
      </div>
      <div className="strategy-result-value">
        <strong>{formatPct(result?.annualizedApr ?? 0)}</strong>
        <span>{formatUsd(pnl)} / 기간 수익률 {formatPct(result?.periodReturnPct ?? 0)}</span>
      </div>
    </article>
  );
}

function ComponentRow({ label, value, tone }: { label: string; value: number; tone?: "cost" | "gain" }) {
  const isCost = tone === "cost" || value < 0;

  return (
    <div className="strategy-component-row">
      <span>{label}</span>
      <strong className={isCost ? "down" : "up"}>{formatUsd(value)}</strong>
    </div>
  );
}

function StrategyTimeline({ data }: { data: StrategyBacktest }) {
  const rows = data.series.slice(-8);
  const values = data.series.flatMap((row) => [row.earnOnlyPnl, row.shortOnlyPnl, row.combinedPnl]);
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);

  return (
    <div className="strategy-timeline">
      {rows.map((row) => {
        const date = new Date(row.time).toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        });

        return (
          <div className="timeline-row" key={row.time}>
            <time>{date}</time>
            <span style={{ width: `${Math.max(Math.abs(row.earnOnlyPnl) / max * 100, 2)}%` }} className={row.earnOnlyPnl >= 0 ? "gain" : "loss"} />
            <span style={{ width: `${Math.max(Math.abs(row.shortOnlyPnl) / max * 100, 2)}%` }} className={row.shortOnlyPnl >= 0 ? "gain short" : "loss short"} />
            <span style={{ width: `${Math.max(Math.abs(row.combinedPnl) / max * 100, 2)}%` }} className={row.combinedPnl >= 0 ? "gain combined" : "loss combined"} />
            <strong>{formatUsd(row.combinedPnl)}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function HedgePage() {
  const [symbol, setSymbol] = useState("TRXUSDT");
  const [principal, setPrincipal] = useState(10000);
  const [days, setDays] = useState(30);
  const [earnAprPct, setEarnAprPct] = useState(18.6);
  const [hedgeRatioPct, setHedgeRatioPct] = useState(100);
  const [spotFeeBps, setSpotFeeBps] = useState(10);
  const [futuresFeeBps, setFuturesFeeBps] = useState(5);
  const [slippageBps, setSlippageBps] = useState(2);
  const { data, isLoading, error } = useStrategyBacktest({
    symbol,
    principal,
    days,
    earnAprPct,
    hedgeRatioPct,
    spotFeeBps,
    futuresFeeBps,
    slippageBps,
  });

  const risk = useMemo(() => {
    const fundingRisk = Math.min(Math.abs(data?.funding.annualizedFundingPct ?? 0) * 100, 100);
    const basisRisk = Math.min(Math.abs((data?.market.spotMovePct ?? 0) - (data?.market.futuresMovePct ?? 0)) * 450, 100);
    const costRisk = Math.min((spotFeeBps + futuresFeeBps * 2 + slippageBps * 4) * 1.4, 100);

    return {
      fundingRisk: Math.round(fundingRisk),
      basisRisk: Math.round(basisRisk),
      costRisk: Math.round(costRisk),
    };
  }, [data, futuresFeeBps, slippageBps, spotFeeBps]);

  return (
    <section className="panel page-panel">
      <PanelHeader title="Hedge Strategy Lab" subtitle="Earn APR, 숏 펀딩비, 거래 비용을 같은 기준으로 비교" action={isLoading ? "계산 중" : "백테스트"} />

      <div className="strategy-lab-grid">
        <aside className="strategy-controls">
          <div className="strategy-control-title">
            <Calculator size={18} />
            <strong>전략 입력값</strong>
          </div>

          <label className="strategy-field">
            <span>대상 페어</span>
            <select value={symbol} onChange={(event) => setSymbol(event.target.value)}>
              {SYMBOLS.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>

          <NumericField label="투입 자금" value={principal} min={100} step={100} suffix="USDT" onChange={setPrincipal} />
          <NumericField label="백테스트 기간" value={days} min={1} max={180} step={1} suffix="일" onChange={setDays} />
          <NumericField label="Earn APR" value={earnAprPct} min={0} step={0.1} suffix="%" onChange={setEarnAprPct} />
          <NumericField label="숏 헤지 비율" value={hedgeRatioPct} min={0} max={200} step={5} suffix="%" onChange={setHedgeRatioPct} />
          <NumericField label="Spot 수수료" value={spotFeeBps} min={0} step={1} suffix="bps" onChange={setSpotFeeBps} />
          <NumericField label="Futures 수수료" value={futuresFeeBps} min={0} step={1} suffix="bps" onChange={setFuturesFeeBps} />
          <NumericField label="슬리피지" value={slippageBps} min={0} step={1} suffix="bps" onChange={setSlippageBps} />

          <div className="strategy-note">
            <Shield size={16} />
            <span>가격 히스토리와 펀딩 히스토리 기준의 추정값입니다. 실제 주문 체결, 담보율, 청산 가격은 별도 리스크 계산이 필요합니다.</span>
          </div>
        </aside>

        <div className="strategy-workspace">
          {error ? (
            <div className="inline-warning">백테스트 데이터를 불러오지 못했습니다: {error}</div>
          ) : null}

          <div className="strategy-results-grid">
            <ResultCard icon={<Wallet size={20} />} title="Earn Only" description="현물 보유 + Earn 수익" result={data?.results.earnOnly} />
            <ResultCard icon={<TrendingDown size={20} />} title="Short Only" description="선물 숏 + 펀딩비" result={data?.results.shortOnly} />
            <ResultCard icon={<Shield size={20} />} title="Earn + Short" description="Earn 수익 + 가격 헤지" result={data?.results.earnPlusShort} />
          </div>

          <div className="strategy-detail-grid">
            <article className="strategy-section">
              <div className="strategy-section-head">
                <BarChart3 size={18} />
                <strong>손익 구성</strong>
              </div>
              <ComponentRow label="Earn 이자 수익" value={data?.components.earnPnl ?? 0} tone="gain" />
              <ComponentRow label="현물 가격 손익" value={data?.components.spotPricePnl ?? 0} />
              <ComponentRow label="Futures 숏 가격 손익" value={data?.components.shortPricePnl ?? 0} />
              <ComponentRow label="펀딩비 손익" value={data?.components.fundingPnl ?? 0} />
              <ComponentRow label="Spot 수수료" value={-(data?.components.spotFees ?? 0)} tone="cost" />
              <ComponentRow label="Futures 수수료" value={-(data?.components.futuresFees ?? 0)} tone="cost" />
              <ComponentRow label="예상 슬리피지" value={-((data?.components.spotSlippage ?? 0) + (data?.components.futuresSlippage ?? 0))} tone="cost" />
            </article>

            <article className="strategy-section">
              <div className="strategy-section-head">
                <Activity size={18} />
                <strong>시장 조건</strong>
              </div>
              <div className="market-breakdown">
                <div>
                  <small>Spot 진입가</small>
                  <strong>{formatNumber(data?.market.entrySpot ?? 0)}</strong>
                </div>
                <div>
                  <small>Spot 종료가</small>
                  <strong>{formatNumber(data?.market.exitSpot ?? 0)}</strong>
                </div>
                <div>
                  <small>Futures 진입가</small>
                  <strong>{formatNumber(data?.market.entryFutures ?? 0)}</strong>
                </div>
                <div>
                  <small>Futures 종료가</small>
                  <strong>{formatNumber(data?.market.exitFutures ?? 0)}</strong>
                </div>
                <div>
                  <small>펀딩 횟수</small>
                  <strong>{data?.funding.count ?? 0}</strong>
                </div>
                <div>
                  <small>평균 펀딩</small>
                  <strong>{formatPct(data?.funding.averageFundingRate ?? 0, 4)}</strong>
                </div>
              </div>
            </article>
          </div>

          <article className="strategy-section">
            <div className="strategy-section-head">
              <RefreshCcw size={18} />
              <strong>최근 누적 손익 흐름</strong>
              <div className="timeline-legend">
                <span>Earn</span>
                <span>Short</span>
                <span>Combined</span>
              </div>
            </div>
            {data ? <StrategyTimeline data={data} /> : <div className="strategy-empty">백테스트 데이터를 기다리는 중입니다.</div>}
          </article>

          <div className="risk-bars strategy-risk-bars">
            <RiskBar label="펀딩비 방향 위험" value={risk.fundingRisk} />
            <RiskBar label="Spot/Futures 괴리 위험" value={risk.basisRisk} />
            <RiskBar label="비용 민감도" value={risk.costRisk} />
          </div>
        </div>
      </div>
    </section>
  );
}
