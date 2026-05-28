import { useAprEventAlerts } from "../../hooks/useAprEventAlerts";
import { PanelHeader } from "../PanelHeader";

export function AlertSummaryPanel() {
  const { alerts, error, lastUpdatedAt } = useAprEventAlerts();

  return (
    <section className="panel alert-panel">
      <PanelHeader title="Telegram Alerts" subtitle={`APR 이벤트 알림 · ${lastUpdatedAt}`} action={`${alerts.length} active`} />
      {error ? <div className="inline-warning compact">알림 연결 실패: {error}</div> : null}
      <div className="alert-list">
        {alerts.length === 0 && !error ? <div className="empty-alert">최근 APR 이벤트 알림이 없습니다.</div> : null}
        {alerts.slice(0, 4).map((alert) => (
          <article className={`alert-card ${alert.level}`} key={alert.eventCode ?? alert.title}>
            <div>
              {alert.url ? (
                <a href={alert.url} target="_blank" rel="noreferrer"><strong>{alert.title}</strong></a>
              ) : (
                <strong>{alert.title}</strong>
              )}
              <p>{alert.body}</p>
            </div>
            <small>{alert.time}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
