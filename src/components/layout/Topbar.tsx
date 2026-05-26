import { Bell, Bot, RefreshCcw, Search, Server } from "lucide-react";
import { useState } from "react";
import { alerts } from "../../data/mock";
import { AlertPopover } from "../alerts/AlertPopover";

export function Topbar({ pageTitle }: { pageTitle: string }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={18} />
        <input placeholder="코인, 페어, 공지 검색" />
      </div>
      <div className="topbar-actions">
        <span className="page-chip">{pageTitle}</span>
        <button className="icon-button" title="새로고침" type="button"><RefreshCcw size={18} /></button>
        <div className="alert-popover-wrap">
          <button className={`icon-button alert-trigger ${isAlertOpen ? "active" : ""}`} title="알림 기록" type="button" onClick={() => setIsAlertOpen((value) => !value)}>
            <Bell size={18} />
            <span>{alerts.length}</span>
          </button>
          {isAlertOpen && <AlertPopover onClose={() => setIsAlertOpen(false)} />}
        </div>
        <button className="pill-button" type="button"><Bot size={17} />@Tturu_news_bot</button>
        <button className="pill-button muted" type="button"><Server size={17} />Local</button>
      </div>
    </header>
  );
}
