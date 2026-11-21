import { useEffect, useState } from "react";
import { AlertTriangle, GitCompareArrows } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Replay from "./pages/Replay.jsx";
import History from "./pages/History.jsx";
import ComparisonPanel from "./components/ComparisonPanel.jsx";
import { api } from "./services/api.js";
import LoadingState from "./components/LoadingState.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [requestId, setRequestId] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [health, setHealth] = useState("checking");
  const [comparisonError, setComparisonError] = useState("");
  const changed = () => setRefreshKey((value) => value + 1);
  useEffect(() => { api.health().then(() => setHealth("online")).catch(() => setHealth("offline")); }, []);
  const openRequest = (id) => { setRequestId(id); setPage("builder"); };
  const replayRequest = (id) => { setRequestId(id); setPage("builder"); };
  const showCompare = async (id) => {
    setPage("comparison"); setComparison(null); setComparisonError("");
    try { setComparison(await api.compare(id)); }
    catch (err) { setComparisonError(err.message); }
  };
  const navigate = (next) => {
    setPage(next === "settings" ? "builder" : next);
    if (next === "builder") setRequestId(null);
  };
  const title = page === "dashboard" ? "Overview" : page === "history" ? "Request history" : page === "comparison" ? "Replay comparison" : "Request builder";
  return <div className="min-h-screen bg-[#f5f6fa]">
    <Sidebar page={page} onNavigate={navigate} />
    <div className="ml-[248px] min-h-screen max-lg:ml-[76px]">
      <Navbar demoMode={false} />
      <main className="mx-auto max-w-[1500px] px-8 py-7 max-sm:px-4">
        <div className="mb-5 flex items-center justify-between"><div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{title}</div><div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${health === "online" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : health === "offline" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${health === "online" ? "bg-emerald-500" : health === "offline" ? "bg-rose-500" : "bg-slate-400"}`} />Replay API {health}</div></div>
        {page === "dashboard" && <Dashboard refreshKey={refreshKey} onNavigate={navigate} onOpen={openRequest} onReplay={replayRequest} onCompare={showCompare} onDelete={(id) => api.remove(id).then(changed)} />}
        {page === "builder" && <Replay requestId={requestId} onBack={() => setPage("history")} onChanged={changed} onCreated={setRequestId} />}
        {page === "history" && <History refreshKey={refreshKey} onOpen={openRequest} onReplay={replayRequest} onCompare={showCompare} />}
        {page === "comparison" && <div className="space-y-5"><div><h1 className="text-[26px] font-semibold tracking-tight text-slate-800">Replay comparison</h1><p className="mt-1 text-sm text-slate-500">Text, status, latency and token differences are computed from recorded results.</p></div>{comparisonError ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-medium text-amber-800"><AlertTriangle size={16} />{comparisonError}</div><p className="mt-1 text-xs text-amber-700">Select a request from history and replay it before comparing.</p></div> : comparison ? <><div className="flex items-center gap-2 text-xs text-slate-500"><GitCompareArrows size={14} />Request {comparison.request_id?.slice(0, 12)}</div><ComparisonPanel data={comparison} /></> : <LoadingState label="Calculating comparison…" />}</div>}
      </main>
      <footer className="px-8 pb-5 text-center text-[10px] text-slate-400 max-sm:px-4">Bifrost Request Replay · Independent recording and comparison workflow · Gateway caching and observability remain Bifrost features</footer>
    </div>
  </div>;
}
