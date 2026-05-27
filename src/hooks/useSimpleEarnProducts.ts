import { useEffect, useMemo, useState } from "react";
import { earnProducts } from "../data/mock";
import type { SimpleEarnProduct } from "../types";

type ApiEarnProduct = {
  productType?: "FLEXIBLE" | "LOCKED";
  asset: string;
  productId: string;
  latestAnnualPercentageRate: string;
  tierAnnualPercentageRate?: Record<string, string>;
  canPurchase: boolean;
  canRedeem: boolean;
  isSoldOut: boolean;
  hot: boolean;
  minPurchaseAmount: string;
  status: string;
  projectId?: string;
  detail?: {
    asset: string;
    rewardAsset?: string;
    duration?: number;
    renewable?: boolean;
    isSoldOut?: boolean;
    apr?: string;
    status?: string;
  };
  quota?: {
    minimum?: string;
    totalPersonalQuota?: string;
  };
};

const API_BASE_URL = "http://127.0.0.1:8787";

const toPercent = (value: number) => `${(value * 100).toFixed(value >= 0.1 ? 2 : 3)}%`;

const mapApiProduct = (product: ApiEarnProduct): SimpleEarnProduct => {
  if (product.productType === "LOCKED") {
    return {
      productType: "LOCKED",
      asset: product.detail?.asset ?? "-",
      productId: product.projectId ?? "-",
      apr: Number(product.detail?.apr ?? 0),
      tierApr: product.quota?.totalPersonalQuota ? `개인 한도 ${product.quota.totalPersonalQuota}` : "-",
      canPurchase: product.detail?.status === "PURCHASING" && !product.detail?.isSoldOut,
      canRedeem: false,
      isSoldOut: Boolean(product.detail?.isSoldOut),
      hot: false,
      minPurchaseAmount: product.quota?.minimum ?? "0",
      status: product.detail?.status ?? "-",
      duration: product.detail?.duration ? `${product.detail.duration}일` : "-",
      rewardAsset: product.detail?.rewardAsset ?? product.detail?.asset ?? "-",
    };
  }

  const tierEntries = product.tierAnnualPercentageRate ? Object.entries(product.tierAnnualPercentageRate) : [];
  const tierApr = tierEntries.length > 0
    ? tierEntries.map(([range, rate]) => `${range}: ${toPercent(Number(rate))}`).join(" / ")
    : "-";

  return {
    productType: "FLEXIBLE",
    asset: product.asset,
    productId: product.productId,
    apr: Number(product.latestAnnualPercentageRate),
    tierApr,
    canPurchase: product.canPurchase,
    canRedeem: product.canRedeem,
    isSoldOut: product.isSoldOut,
    hot: product.hot,
    minPurchaseAmount: product.minPurchaseAmount,
    status: product.status,
    duration: "Flexible",
    rewardAsset: product.asset,
  };
};

const fallbackProducts: SimpleEarnProduct[] = earnProducts.map((product) => ({
  productType: "FLEXIBLE",
  asset: product.symbol,
  productId: `${product.symbol}001`,
  apr: Number.parseFloat(product.apr) / 100,
  tierApr: product.baseApr,
  canPurchase: product.status !== "한도 임박",
  canRedeem: true,
  isSoldOut: false,
  hot: product.event !== "-",
  minPurchaseAmount: "0",
  status: product.status,
  duration: "Flexible",
  rewardAsset: product.symbol,
}));

export function useSimpleEarnProducts() {
  const [products, setProducts] = useState<SimpleEarnProduct[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("-");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/simple-earn/products`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.msg ?? payload.error ?? "Simple Earn fetch failed");
        }

        const rows = Array.isArray(payload.rows) ? payload.rows.map(mapApiProduct) : [];
        setProducts(rows);
        setLastUpdatedAt(new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Simple Earn fetch failed");
          setProducts(fallbackProducts);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 180000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const hotCount = useMemo(() => products.filter((product) => product.hot).length, [products]);
  const purchasableCount = useMemo(() => products.filter((product) => product.canPurchase && !product.isSoldOut).length, [products]);

  return {
    products,
    isLoading,
    error,
    lastUpdatedAt,
    hotCount,
    purchasableCount,
  };
}
