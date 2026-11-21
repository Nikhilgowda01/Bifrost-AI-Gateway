import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import { formatLatency } from "../services/api";

export default function ResponseViewer({ execution, title = "Response", compact = false }) {
  const [copied, setCopied] = useState(false);
  if (!execution) return <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">No response captured.</div>;
  const copy = async () => {
    await navigator.clipboard.writeText(execution.response_text || JSON.stringify(execution.response, null, 2) || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">{execution.success ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-rose-500" />}{title}
        {execution.demo_mode && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">Simulated</span>}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400"><span>{execution.status_code ?? "No status"}</span><span>{formatLatency(execution.response_time_ms)}</span><button onClick={copy} className="flex items-center gap-1 hover:text-slate-700" title="Copy response"><Copy size={12} />{copied ? "Copied" : ""}</button></div>
    </div>
    {execution.error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">{execution.error}</div>}
    <pre className={`scrollbar-thin overflow-auto whitespace-pre-wrap break-words bg-[#111827] p-4 font-mono text-[11px] leading-5 text-slate-200 ${compact ? "max-h-44" : "max-h-[420px]"}`}>{execution.response_text || JSON.stringify(execution.response, null, 2) || "No response body"}</pre>
    {execution.token_usage && <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-500">{Object.entries(execution.token_usage).map(([key, value]) => <span key={key}><b className="font-semibold text-slate-700">{value}</b> {key.replace("_", " ")}</span>)}</div>}
  </section>;
}
