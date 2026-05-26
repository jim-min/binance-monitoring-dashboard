import { alerts } from "../../data/mock";
import { PanelHeader } from "../PanelHeader";

export function AlertSummaryPanel() {
  return (
    <section className="panel alert-panel">
      <PanelHeader title="Telegram Alerts" subtitle="실시간 감시 알림" action="3 active" />
      <div className="alert-list">
        {alerts.map((alert) => (
          <article className={`alert-card ${alert.level}`} key={alert.title}>
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.body}</p>
            </div>
            <small>{alert.time}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
