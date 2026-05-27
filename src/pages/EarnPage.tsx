import { RefreshCcw, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { PanelHeader } from "../components/PanelHeader";
import { SortMenu } from "../components/SortMenu";
import { useSimpleEarnProducts } from "../hooks/useSimpleEarnProducts";
import type { SimpleEarnProduct } from "../types";

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

export function EarnPage() {
  const { products, isLoading, error, lastUpdatedAt, hotCount, purchasableCount } = useSimpleEarnProducts();
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
