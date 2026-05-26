import { alerts } from "../../data/mock";

export function AlertPopover({ onClose }: { onClose: () => void }) {
  return (
    <div className="alert-popover" role="dialog" aria-label="알림 기록">
      <div className="popover-header">
        <div>
          <strong>알림 기록</strong>
          <small>최근 시그널과 공지</small>
        </div>
        <button type="button" onClick={onClose}>닫기</button>
      </div>
      <div className="popover-list">
        {alerts.map((alert) => (
          <article className={`popover-alert ${alert.level}`} key={alert.title}>
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.body}</p>
            </div>
            <time>{alert.time}</time>
          </article>
        ))}
      </div>
    </div>
  );
}
