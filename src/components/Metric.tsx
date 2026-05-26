import type { ReactNode } from "react";

export function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="hero-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{trend}</span>
    </div>
  );
}

export function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}
