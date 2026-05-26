import type { Alert, ArbitrageSignal, Coin, EarnProduct } from "../types";

export const coins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: "68,420.12", change: 1.82, volume: "$24.8B", high: "69,110.00", low: "66,902.45", spread: "0.01%" },
  { symbol: "ETH", name: "Ethereum", price: "3,742.84", change: -0.46, volume: "$12.1B", high: "3,811.12", low: "3,690.20", spread: "0.02%" },
  { symbol: "SOL", name: "Solana", price: "168.38", change: 3.14, volume: "$3.7B", high: "171.40", low: "160.21", spread: "0.03%" },
  { symbol: "BNB", name: "BNB", price: "612.55", change: 0.68, volume: "$1.9B", high: "619.00", low: "602.44", spread: "0.02%" },
  { symbol: "TRX", name: "TRON", price: "0.1184", change: 2.27, volume: "$721M", high: "0.1201", low: "0.1157", spread: "0.04%" },
  { symbol: "XRP", name: "XRP", price: "0.6421", change: -1.09, volume: "$1.2B", high: "0.6570", low: "0.6328", spread: "0.03%" },
];

export const earnProducts: EarnProduct[] = [
  { symbol: "TRX", apr: "18.6%", baseApr: "3.2%", event: "Flexible 이벤트", status: "구독 가능", quota: "72%", futures: "TRXUSDT", netApr: "11.4%" },
  { symbol: "AXS", apr: "24.1%", baseApr: "4.8%", event: "신규 캠페인", status: "한도 임박", quota: "91%", futures: "AXSUSDT", netApr: "14.8%" },
  { symbol: "BNB", apr: "7.9%", baseApr: "1.4%", event: "Launchpool 연계", status: "구독 가능", quota: "64%", futures: "BNBUSDT", netApr: "5.1%" },
  { symbol: "XRP", apr: "10.3%", baseApr: "2.1%", event: "기간 한정", status: "구독 가능", quota: "58%", futures: "XRPUSDT", netApr: "7.2%" },
];

export const alerts: Alert[] = [
  { title: "TRX Simple Earn APR 상승", body: "Flexible APR 18.6%, 예상 순APR 11.4% 후보 감지", time: "방금", level: "success" },
  { title: "신규 Simple Earn 공지", body: "AXS 기간 한정 캠페인 조건 자동 파싱 완료", time: "8분 전", level: "info" },
  { title: "Funding fee 주의", body: "ETHUSDT 숏 기준 최근 8시간 펀딩비가 불리하게 전환", time: "22분 전", level: "warning" },
];

export const arbitrageRows: ArbitrageSignal[] = [
  { path: "USDT -> BNB -> XRP -> USDT", profit: "0.18%", size: "$4,200", status: "관찰" },
  { path: "SOL Spot <-> SOLUSDT Perp", profit: "0.31%", size: "$8,500", status: "알림 후보" },
  { path: "USDT -> BTC -> ETH -> USDT", profit: "0.07%", size: "$12,000", status: "수수료 미달" },
];
