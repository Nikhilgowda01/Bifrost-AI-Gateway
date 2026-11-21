import { Activity, AlertTriangle, CircleAlert, Clock3, Layers3, RotateCcw } from "lucide-react";

const cards = [
  { key: "total_requests", label: "Recorded requests", icon: Layers3, color: "violet" },
  { key: "total_replays", label: "Replay executions", icon: RotateCcw, color: "blue" },
  { key: "successful", label: "Successful requests", icon: Activity, color: "green" },
  { key: "failed", label: "Failed requests", icon: AlertTriangle, color: "rose" },
  { key: "avg_response_time_ms", label: "Avg. response time", icon: Clock3, color: "orange" },
];

const styles = {
  violet: "bg-violet-50 text-violet-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function MetricsCards({ metrics, simulated = false }) {
  return <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
    {cards.map(({ key, label, icon: Icon, color }) => {
      const value = metrics?.[key];
      const display = key === "avg_response_time_ms"
        ? value == null ? "—" : `${Number(value).toFixed(1)} ms`
        : (value ?? 0).toLocaleString();
      return <div key={key} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(27,39,68,0.03)]">
        <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[color]}`}><Icon size={17} /></span></div>
        <div className="mt-4 flex items-end justify-between"><span className="text-[26px] font-semibold tracking-tight text-slate-800">{display}</span><span className={`mb-1 inline-flex items-center gap-1 text-[10px] ${simulated ? "text-amber-600" : "text-slate-400"}`}><CircleAlert size={11} />{simulated ? "Simulated" : "Measured"}</span></div>
      </div>;
    })}
  </div>;
}
