import type { Alert } from "../../types";

export function AlertPopover({ alerts, error, onClose }: { alerts: Alert[]; error?: string | null; onClose: () => void }) {
  return (
    <div className="alert-popover" role="dialog" aria-label="알림 기록">
      <div className="popover-header">
        <div>
          <strong>알림 기록</strong>
          <small>Binance APR 이벤트 공지</small>
        </div>
        <button type="button" onClick={onClose}>닫기</button>
      </div>
      <div className="popover-list">
        {error ? <div className="inline-warning compact">알림 연결 실패: {error}</div> : null}
        {alerts.length === 0 && !error ? <div className="empty-alert">APR 이벤트 알림이 없습니다.</div> : null}
        {alerts.map((alert) => (
          <article className={`popover-alert ${alert.level}`} key={alert.eventCode ?? alert.title}>
            <div>
              {alert.url ? (
                <a href={alert.url} target="_blank" rel="noreferrer"><strong>{alert.title}</strong></a>
              ) : (
                <strong>{alert.title}</strong>
              )}
              <p>{alert.body}</p>
            </div>
            <time>{alert.time}</time>
          </article>
        ))}
      </div>
    </div>
  );
}
