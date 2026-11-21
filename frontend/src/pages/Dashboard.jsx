import { ArrowRight, BarChart3, Plus, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricsCards from "../components/MetricsCards.jsx";
import RequestHistory from "../components/RequestHistory.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { api } from "../services/api.js";

export default function Dashboard({ onNavigate, onOpen, onReplay, onCompare, onDelete, refreshKey }) {
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.analytics(), api.requests()])
      .then(([stats, history]) => { setAnalytics(stats); setRequests(history); setError(""); })
      .catch((err) => setError(err.message));
  }, [refreshKey]);
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  if (!analytics) return <LoadingState />;
  const live = analytics.live;
  const chartData = analytics.executions.filter((item) => !item.demo_mode).slice(-12).map((item, index) => ({
    label: `${item.execution_type === "replay" ? "R" : "Q"}${index + 1}`,
    latency: item.response_time_ms ?? 0,
    success: item.success,
  }));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700"><Zap size={11} />Gateway intelligence</div><h1 className="text-[26px] font-semibold tracking-tight text-slate-800">API Replay &amp; Intelligence</h1><p className="mt-1 text-sm text-slate-500">Record, replay, compare and debug your AI gateway requests.</p></div><button onClick={() => onNavigate("builder")} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"><Plus size={15} />New request</button></div>
    <div><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold text-slate-700">Live gateway metrics</h2><span className="text-[10px] text-slate-400">Measured only · excludes simulated demo records</span></div><MetricsCards metrics={live} /></div>
    {analytics.simulated.total_requests > 0 && <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs"><span className="font-medium text-amber-800">Demo data is isolated from live metrics.</span><span className="text-amber-700">{analytics.simulated.total_requests} simulated records · {analytics.simulated.execution_count} simulated executions</span></div>}
    {analytics.simulated.total_requests > 0 && <div><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold text-amber-800">Simulated demo metrics</h2><span className="text-[10px] text-amber-700">Illustrative only · not measured gateway performance</span></div><MetricsCards metrics={analytics.simulated} simulated /></div>}
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(270px,0.8fr)] gap-5 max-xl:grid-cols-1">
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-800">Execution performance</h2><p className="mt-1 text-[11px] text-slate-400">Live gateway response time, milliseconds</p></div><BarChart3 size={17} className="text-slate-400" /></div>
        {chartData.length ? <div className="mt-5 h-[210px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 4, right: 2, left: -18, bottom: 0 }}><CartesianGrid stroke="#eef0f5" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a1b3" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#98a1b3" }} /><Tooltip cursor={{ fill: "#f7f7fb" }} formatter={(value) => [`${value} ms`, "Latency"]} /><Bar dataKey="latency" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => <Cell key={index} fill={entry.success ? "#7564f5" : "#f17f85"} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="flex h-[210px] flex-col items-center justify-center text-center"><div className="text-xs font-medium text-slate-600">No live measurements yet</div><p className="mt-1 max-w-xs text-[10px] text-slate-400">Disable demo mode in the request builder and connect to a configured gateway to populate this chart.</p></div>}
      </section>
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-800">Execution outcomes</h2><p className="mt-1 text-[11px] text-slate-400">Live gateway runs only</p><div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-500 transition-all" style={{ width: `${live.successful + live.failed ? (live.successful / (live.successful + live.failed)) * 100 : 0}%` }} /><div className="bg-rose-400 transition-all" style={{ width: `${live.successful + live.failed ? (live.failed / (live.successful + live.failed)) * 100 : 0}%` }} /></div><div className="mt-4 flex justify-between text-[11px]"><span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Success <b className="ml-1 text-slate-700">{live.successful}</b></span><span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-rose-400" />Failed <b className="ml-1 text-slate-700">{live.failed}</b></span></div></section>
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1c2050] to-[#32267a] p-5 text-white"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-violet-200"><Zap size={17} /></div><h2 className="mt-5 text-base font-semibold">Run a replay</h2><p className="mt-2 text-xs leading-5 text-indigo-100/70">Inspect a previous response, edit its configuration and compare a fresh execution side by side.</p><button onClick={() => onNavigate("history")} className="mt-5 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-50">Browse request history <ArrowRight size={13} /></button><div className="mt-6 border-t border-white/10 pt-4 text-[10px] leading-4 text-indigo-100/60">Replay uses your current gateway configuration. API keys are held only in backend memory for this process.</div></section>
      </div>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-800">Recent requests</h2><p className="mt-1 text-[11px] text-slate-400">Latest recordings across live and simulated runs</p></div><button onClick={() => onNavigate("history")} className="flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:text-violet-900">View all <ArrowRight size={13} /></button></div><RequestHistory requests={requests} compact onOpen={onOpen} onReplay={onReplay} onCompare={onCompare} onDelete={onDelete} /></section>
  </div>;
}
