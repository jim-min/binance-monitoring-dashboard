import { CandlestickChart, CircleDollarSign, Gauge, ShieldCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";
import type { Page } from "../../types";

type SidebarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
};

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
        </div>
        <div>
          <strong>Binance Monitor</strong>
          <small>Strategy Desk</small>
        </div>
      </div>

      <nav className="nav">
        <NavButton active={activePage === "overview"} icon={<Gauge size={18} />} label="개요" onClick={() => onNavigate("overview")} />
        <NavButton active={activePage === "markets"} icon={<CandlestickChart size={18} />} label="마켓" onClick={() => onNavigate("markets")} />
        <NavButton active={activePage === "earn"} icon={<CircleDollarSign size={18} />} label="Simple Earn" onClick={() => onNavigate("earn")} />
        <NavButton active={activePage === "hedge"} icon={<ShieldCheck size={18} />} label="헤지 전략" onClick={() => onNavigate("hedge")} />
        <NavButton active={activePage === "arbitrage"} icon={<Zap size={18} />} label="Arbitrage" onClick={() => onNavigate("arbitrage")} />
      </nav>

      <div className="sidebar-status">
        <span className="status-dot" />
        <div>
          <strong>시스템 정상<br/></strong>
          <small>시장, 수익률, 알림 상태 양호</small>
        </div>
      </div>
    </aside>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
