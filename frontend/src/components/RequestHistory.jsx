import { ArrowRight, GitCompareArrows, RotateCcw, Trash2 } from "lucide-react";
import { formatDate, formatLatency } from "../services/api";

export default function RequestHistory({ requests, onOpen, onReplay, onCompare, onDelete, compact = false }) {
  if (!requests?.length) return <div className="px-5 py-12 text-center"><div className="text-sm font-medium text-slate-700">No requests recorded yet</div><p className="mt-1 text-xs text-slate-400">Execute or simulate a request to create your first recording.</p></div>;
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left">
      <thead><tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        <th className="px-5 py-3">Request / model</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Response time</th><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Replays</th><th className="px-4 py-3 text-right">Actions</th>
      </tr></thead>
      <tbody>{requests.slice(0, compact ? 5 : undefined).map((item) => <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
        <td className="px-5 py-3"><button className="text-left" onClick={() => onOpen(item.id)}><div className="font-mono text-[10px] text-violet-700">{item.id.slice(0, 12)}</div><div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">{item.model}{item.demo_mode && <span className="rounded bg-amber-50 px-1 text-[9px] uppercase text-amber-700">Demo</span>}</div><div className="mt-0.5 text-[10px] text-slate-400">{item.endpoint}</div></button></td>
        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${item.last_success ? "bg-emerald-50 text-emerald-700" : item.last_success === false ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${item.last_success ? "bg-emerald-500" : item.last_success === false ? "bg-rose-500" : "bg-slate-400"}`} />{item.last_status_code ?? "—"} · {item.last_success ? "Success" : "Failed"}</span></td>
        <td className="px-4 py-3 text-xs text-slate-600">{formatLatency(item.last_response_time_ms)}</td>
        <td className="px-4 py-3 text-[10px] text-slate-500">{formatDate(item.last_executed_at || item.created_at)}</td>
        <td className="px-4 py-3 text-xs text-slate-600">{item.replay_count}</td>
        <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
          <button title="Open request" onClick={() => onOpen(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600"><ArrowRight size={14} /></button>
          <button title="Replay request" onClick={() => onReplay(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><RotateCcw size={14} /></button>
          <button title="Compare latest replay" onClick={() => onCompare(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600"><GitCompareArrows size={14} /></button>
          {!compact && <button title="Delete request" onClick={() => onDelete(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>}
        </div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
