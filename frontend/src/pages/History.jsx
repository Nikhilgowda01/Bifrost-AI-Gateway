import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import LoadingState from "../components/LoadingState.jsx";
import RequestHistory from "../components/RequestHistory.jsx";

export default function History({ onOpen, onReplay, onCompare, refreshKey }) {
  const [requests, setRequests] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const refresh = () => api.requests().then(setRequests).catch((err) => setError(err.message));
  useEffect(() => { refresh(); }, [refreshKey]);
  const filtered = useMemo(() => (requests || []).filter((item) =>
    `${item.id} ${item.model} ${item.endpoint}`.toLowerCase().includes(query.toLowerCase())), [requests, query]);
  const deleteRequest = async (id) => {
    if (!window.confirm(`Delete request ${id.slice(0, 12)} and all of its replay records?`)) return;
    try { await api.remove(id); await refresh(); } catch (err) { setError(err.message); }
  };
  if (!requests && !error) return <LoadingState />;
  return <div className="space-y-5">
    <div><h1 className="text-[26px] font-semibold tracking-tight text-slate-800">Request history</h1><p className="mt-1 text-sm text-slate-500">Browse recorded calls, replay a configuration or inspect a comparison.</p></div>
    {error && <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-800">{requests?.length || 0} recordings</h2><p className="mt-1 text-[11px] text-slate-400">API keys are never included in stored configuration.</p></div><div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search model or request ID" className="w-60 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400 max-sm:w-48" /></div></div><RequestHistory requests={filtered} onOpen={onOpen} onReplay={onReplay} onCompare={onCompare} onDelete={deleteRequest} /></section>
  </div>;
}
