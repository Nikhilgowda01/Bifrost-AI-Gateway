import { ArrowDown, ArrowUp, Check, CircleAlert, Minus } from "lucide-react";
import ResponseViewer from "./ResponseViewer.jsx";
import { formatLatency } from "../services/api";

export default function ComparisonPanel({ data }) {
  if (!data) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Choose a request with at least one replay to compare its outputs.</div>;
  const comparison = data.comparison || data;
  const original = comparison.original;
  const replay = comparison.replay;
  const delta = comparison.response_time_delta_ms;
  return <div className="space-y-5">
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${comparison.identical ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${comparison.identical ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{comparison.identical ? <Check size={18} /> : <CircleAlert size={18} />}</span>
        <div><div className="text-sm font-semibold text-slate-800">{comparison.identical ? "Outputs are identical" : "Output changed"}</div><div className="mt-0.5 text-xs text-slate-500">{data.is_modified ? "Modified replay · request configuration changed" : "Exact replay · original configuration reused"}</div></div>
      </div>
      <div className="flex gap-5 text-xs"><div className="text-right"><div className="text-slate-400">Status</div><div className="mt-1 font-semibold text-slate-700">{comparison.status_code_diff.original ?? "—"} <span className="mx-1 text-slate-300">→</span> {comparison.status_code_diff.replay ?? "—"}</div></div><div className="text-right"><div className="text-slate-400">Latency delta</div><div className="mt-1 flex items-center justify-end gap-1 font-semibold text-slate-700">{delta == null ? "Unavailable" : <>{delta > 0 ? <ArrowUp size={12} /> : delta < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}{Math.abs(delta).toFixed(1)} ms</>}</div></div></div>
    </div>
    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      <ResponseViewer execution={original} title="Original response" />
      <ResponseViewer execution={replay} title="Replay response" />
    </div>
    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold text-slate-700">Text diff</div><div className="mt-2 text-[11px] text-slate-400">{comparison.text_changed ? "Line-based diff — no AI-generated interpretation." : "No text differences detected."}</div>
        {comparison.text_diff.length > 0 && <pre className="scrollbar-thin mt-3 max-h-56 overflow-auto rounded-lg bg-[#111827] p-3 font-mono text-[10px] leading-5 text-slate-200">{comparison.text_diff.map((line, index) => <div key={`${index}-${line}`} className={line.startsWith("+") && !line.startsWith("+++") ? "text-emerald-300" : line.startsWith("-") && !line.startsWith("---") ? "text-rose-300" : "text-slate-400"}>{line}</div>)}</pre>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold text-slate-700">Token usage delta</div>{comparison.token_usage_diff ? <div className="mt-4 space-y-3">{Object.entries(comparison.token_usage_diff).map(([key, value]) => <div key={key} className="flex items-center justify-between text-xs"><span className="text-slate-500">{key.replace("_", " ")}</span><span className={`font-semibold ${value > 0 ? "text-orange-600" : value < 0 ? "text-emerald-600" : "text-slate-600"}`}>{value > 0 ? "+" : ""}{value}</span></div>)}</div> : <div className="mt-3 text-xs text-slate-400">Unavailable — token usage was not returned by both executions.</div>}</div>
    </div>
    <div className="text-right text-[10px] text-slate-400">Original: {formatLatency(original.response_time_ms)} · Replay: {formatLatency(replay.response_time_ms)}</div>
  </div>;
}
