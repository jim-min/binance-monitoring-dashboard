import { ExternalLink, RefreshCcw, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { PanelHeader } from "../components/PanelHeader";
import { SortMenu } from "../components/SortMenu";
import { useEarningEvents } from "../hooks/useEarningEvents";
import { useSimpleEarnProducts } from "../hooks/useSimpleEarnProducts";
import type { EarningEvent, SimpleEarnProduct } from "../types";

type EarnSortKey = "apr" | "asset" | "minPurchaseAmount" | "status";
type EarnTypeFilter = "ALL" | "FLEXIBLE" | "LOCKED";

const formatApr = (apr: number) => `${(apr * 100).toFixed(apr >= 0.1 ? 2 : 3)}%`;

const earnSortOptions: { value: EarnSortKey; label: string }[] = [
  { value: "apr", label: "APR 높은 순" },
  { value: "asset", label: "자산명" },
  { value: "minPurchaseAmount", label: "최소 구독 수량" },
  { value: "status", label: "상태" },
];

const statusText = (product: SimpleEarnProduct) => {
  if (product.isSoldOut) {
    return "매진";
  }
  if (product.canPurchase) {
    return "구독 가능";
  }
  return product.status || "제한";
};

const eventTypeLabel: Record<EarningEvent["type"], string> = {
  earn: "Earn",
  fee: "Fee",
  trading: "Trading",
  launch: "Launch",
  event: "Event",
};

const eventTypeClass: Record<EarningEvent["type"], string> = {
  earn: "earn",
  fee: "fee",
  trading: "trading",
  launch: "launch",
  event: "event",
};

const formatEventDate = (releaseDate: number) => new Date(releaseDate).toLocaleString("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function EarningEventCard({ event }: { event: EarningEvent }) {
  const highlights = [
    ...event.apr.map((item) => ({ label: "APR", value: item })),
    ...event.rewards.map((item) => ({ label: "Reward", value: item })),
    ...event.periods.map((item) => ({ label: "Period", value: item })),
  ].slice(0, 3);

  return (
    <article className="earning-event-card">
      <div className="earning-event-head">
        <span className={`event-type ${eventTypeClass[event.type]}`}>{eventTypeLabel[event.type]}</span>
        <time>{formatEventDate(event.releaseDate)}</time>
      </div>
      <a href={event.url} target="_blank" rel="noreferrer">
        <strong>{event.title}</strong>
        <ExternalLink size={14} />
      </a>
      <div className="event-chip-row">
        {event.assets.slice(0, 5).map((asset) => <span key={asset}>{asset}</span>)}
        {event.pairs.slice(0, 3).map((pair) => <span key={pair}>{pair}</span>)}
      </div>
      {highlights.length > 0 ? (
        <div className="event-highlight-list">
          {highlights.map((item) => (
            <p key={`${item.label}-${item.value}`}>
              <small>{item.label}</small>
              <span>{item.value}</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="event-excerpt">{event.excerpt}</p>
      )}
    </article>
  );
}

export function EarnPage() {
  const { products, isLoading, error, lastUpdatedAt, hotCount, purchasableCount } = useSimpleEarnProducts();
  const {
    events,
    isLoading: isEventLoading,
    error: eventError,
    lastUpdatedAt: eventsUpdatedAt,
    sourceUrl,
    earnRelatedCount,
  } = useEarningEvents();
  const [sortKey, setSortKey] = useState<EarnSortKey>("apr");
  const [typeFilter, setTypeFilter] = useState<EarnTypeFilter>("ALL");
  const [onlyPurchasable, setOnlyPurchasable] = useState(false);
  const [onlyHot, setOnlyHot] = useState(false);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (typeFilter !== "ALL" && product.productType !== typeFilter) {
        return false;
      }
      if (onlyPurchasable && (!product.canPurchase || product.isSoldOut)) {
        return false;
      }
      if (onlyHot && !product.hot) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === "apr") {
        return b.apr - a.apr;
      }
      if (sortKey === "minPurchaseAmount") {
        return Number(a.minPurchaseAmount) - Number(b.minPurchaseAmount);
      }
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
  }, [onlyHot, onlyPurchasable, products, sortKey, typeFilter]);

  const flexibleCount = useMemo(() => products.filter((product) => product.productType === "FLEXIBLE").length, [products]);
  const lockedCount = useMemo(() => products.filter((product) => product.productType === "LOCKED").length, [products]);
  const assetCount = useMemo(() => new Set(products.map((product) => product.asset)).size, [products]);

  return (
    <section className="panel page-panel">
      <PanelHeader title="Earn Opportunity Screener" subtitle={`Simple Earn 전체 ${products.length}개 · 자산 ${assetCount}개 · ${lastUpdatedAt}`} action={isLoading ? "갱신 중" : `${purchasableCount} available`} />
      {error && <div className="inline-warning">Simple Earn API 연결 실패: {error}. 임시 데이터를 표시합니다.</div>}
      {eventError && <div className="inline-warning">Earning Event 공지 연결 실패: {eventError}</div>}
      <div className="earn-summary-grid">
        <div>
          <small>전체 상품</small>
          <strong>{products.length}</strong>
        </div>
        <div>
          <small>자산 수</small>
          <strong>{assetCount}</strong>
        </div>
        <div>
          <small>Flexible</small>
          <strong>{flexibleCount}</strong>
        </div>
        <div>
          <small>Locked</small>
          <strong>{lockedCount}</strong>
        </div>
        <div>
          <small>구독 가능</small>
          <strong>{purchasableCount}</strong>
        </div>
        <div>
          <small>Hot 표시</small>
          <strong>{hotCount}</strong>
        </div>
        <div>
          <small>표시 중</small>
          <strong>{visibleProducts.length}</strong>
        </div>
      </div>
      <section className="earning-events-panel">
        <div className="earning-events-header">
          <div>
            <span className="eyebrow">Binance Announcement</span>
            <h3>Earning Events</h3>
            <p>Latest Activities 공지에서 토큰, APR, 보상, 캠페인 기간 후보를 파싱합니다. {eventsUpdatedAt}</p>
          </div>
          <a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">
            <Sparkles size={16} />
            {isEventLoading ? "불러오는 중" : `${events.length}개 · Earn 관련 ${earnRelatedCount}개`}
          </a>
        </div>
        <div className="earning-event-grid">
          {events.slice(0, 6).map((event) => <EarningEventCard event={event} key={event.code} />)}
        </div>
      </section>
      <div className="toolbar">
        <button className={`filter ${typeFilter === "ALL" ? "active" : ""}`} type="button" onClick={() => setTypeFilter("ALL")}>전체</button>
        <button className={`filter ${typeFilter === "FLEXIBLE" ? "active" : ""}`} type="button" onClick={() => setTypeFilter("FLEXIBLE")}>Flexible</button>
        <button className={`filter ${typeFilter === "LOCKED" ? "active" : ""}`} type="button" onClick={() => setTypeFilter("LOCKED")}>Locked</button>
        <button className={`filter ${onlyHot ? "active" : ""}`} type="button" onClick={() => setOnlyHot((value) => !value)}>Hot</button>
        <button className={`filter ${onlyPurchasable ? "active" : ""}`} type="button" onClick={() => setOnlyPurchasable((value) => !value)}>구독 가능</button>
        <button className="filter" type="button"><RefreshCcw size={15} />3분 자동 갱신</button>
        <SortMenu className="right" value={sortKey} options={earnSortOptions} onChange={setSortKey} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>유형</th>
              <th>토큰</th>
              <th>보상 자산</th>
              <th>표시 APR</th>
              <th>Tier APR</th>
              <th>기간</th>
              <th>Hot</th>
              <th>상태</th>
              <th>최소 구독</th>
              <th>상환</th>
              <th>Product ID</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr key={product.productId}>
                <td><span className={`badge product-type ${product.productType.toLowerCase()}`}>{product.productType === "FLEXIBLE" ? "Flexible" : "Locked"}</span></td>
                <td><span className="asset-symbol"><Star size={14} />{product.asset}</span></td>
                <td>{product.rewardAsset}</td>
                <td className="apr">{formatApr(product.apr)}</td>
                <td className="tier-cell">{product.tierApr}</td>
                <td>{product.duration}</td>
                <td>{product.hot ? <span className="badge hot">Hot</span> : "-"}</td>
                <td><span className={`badge ${product.canPurchase && !product.isSoldOut ? "" : "muted"}`}>{statusText(product)}</span></td>
                <td>{product.minPurchaseAmount}</td>
                <td>{product.canRedeem ? "가능" : "제한"}</td>
                <td>{product.productId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
