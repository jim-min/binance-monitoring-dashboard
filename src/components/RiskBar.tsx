export function RiskBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="risk-bar">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <progress value={value} max={100} />
    </div>
  );
}
