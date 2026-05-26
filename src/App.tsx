import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { ArbitragePage } from "./pages/ArbitragePage";
import { EarnPage } from "./pages/EarnPage";
import { HedgePage } from "./pages/HedgePage";
import { MarketsPage } from "./pages/MarketsPage";
import { OverviewPage } from "./pages/OverviewPage";
import { pageFromPath, pageLabels, pagePaths } from "./routes";
import type { Page } from "./types";

export function App() {
  const [activePage, setActivePage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const pageTitle = useMemo(() => pageLabels[activePage], [activePage]);

  useEffect(() => {
    const handlePopState = () => setActivePage(pageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (page: Page) => {
    setActivePage(page);
    window.history.pushState({}, "", pagePaths[page]);
  };

  return (
    <main className="app-shell">
      <Sidebar activePage={activePage} onNavigate={navigate} />

      <section className="workspace">
        <Topbar pageTitle={pageTitle} />

        {activePage === "overview" && <OverviewPage />}
        {activePage === "markets" && <MarketsPage />}
        {activePage === "earn" && <EarnPage />}
        {activePage === "hedge" && <HedgePage />}
        {activePage === "arbitrage" && <ArbitragePage />}
      </section>
    </main>
  );
}
