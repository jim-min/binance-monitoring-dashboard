export function MiniChart({ positive }: { positive: boolean }) {
  const points = positive ? "0,34 18,28 36,30 54,16 72,20 90,8 108,12" : "0,10 18,15 36,13 54,21 72,18 90,29 108,26";

  return (
    <svg className="mini-chart" viewBox="0 0 108 40" role="img" aria-label="price sparkline">
      <polyline points={points} fill="none" stroke={positive ? "var(--green)" : "var(--red)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
