import { Braces, Eye, EyeOff, Play, RotateCcw, Save, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";

const defaults = {
  base_url: "http://localhost:8080",
  endpoint: "/v1/chat/completions",
  model: "openai/gpt-4o-mini",
  api_key: "",
  system_prompt: "You are a helpful assistant.",
  user_prompt: "Explain what an AI gateway does in one sentence.",
  temperature: 0.2,
  max_tokens: 512,
  demo_mode: true,
};

export const defaultRequestConfig = defaults;

export default function RequestBuilder({ initialConfig, onExecute, onReplay, onChange, loading = false, replayId, modified = false }) {
  const [form, setForm] = useState({ ...defaults, ...(initialConfig || {}) });
  const [showKey, setShowKey] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const update = (key, value) => setForm((current) => {
    const next = { ...current, [key]: value };
    onChange?.(next);
    return next;
  });
  const preview = useMemo(() => ({
    model: form.model,
    messages: [
      { role: "system", content: form.system_prompt },
      { role: "user", content: form.user_prompt },
    ],
    temperature: Number(form.temperature),
    max_tokens: Number(form.max_tokens),
  }), [form]);
  const payload = { ...form, temperature: Number(form.temperature), max_tokens: Number(form.max_tokens) };
  const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:border-violet-400 focus:outline-none";
  const label = "mb-1.5 block text-[11px] font-medium text-slate-600";

  return <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-5 max-xl:grid-cols-1">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(27,39,68,0.03)]">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-800">Request configuration</h2><p className="mt-1 text-[11px] text-slate-400">Configure an OpenAI-compatible chat completion request.</p></div><span className="rounded-lg bg-violet-50 p-2 text-violet-600"><Braces size={16} /></span></div>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <div><label className={label}>Gateway base URL</label><input className={field} value={form.base_url} onChange={(e) => update("base_url", e.target.value)} placeholder="http://localhost:8080" /></div>
        <div><label className={label}>API endpoint</label><input className={field} value={form.endpoint} onChange={(e) => update("endpoint", e.target.value)} placeholder="/v1/chat/completions" /></div>
        <div><label className={label}>Model</label><input className={field} value={form.model} onChange={(e) => update("model", e.target.value)} placeholder="openai/gpt-4o-mini" /></div>
        <div><label className={label}>Gateway API key <span className="text-slate-400">(optional)</span></label><div className="relative"><input className={`${field} pr-9`} type={showKey ? "text" : "password"} value={form.api_key} onChange={(e) => update("api_key", e.target.value)} placeholder="Bifrost virtual key" autoComplete="off" /><button onClick={() => setShowKey(!showKey)} className="absolute right-2.5 top-2.5 text-slate-400">{showKey ? <EyeOff size={14} /> : <Eye size={14} />}</button></div><p className="mt-1 text-[9px] text-slate-400">Sent to the local backend only; never recorded in SQLite.</p></div>
      </div>
      <div className="mt-4"><label className={label}>System prompt</label><textarea className={`${field} min-h-[72px] resize-y`} value={form.system_prompt} onChange={(e) => update("system_prompt", e.target.value)} /></div>
      <div className="mt-3"><label className={label}>User prompt</label><textarea className={`${field} min-h-[100px] resize-y`} value={form.user_prompt} onChange={(e) => update("user_prompt", e.target.value)} /></div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div><label className={label}>Temperature <span className="text-slate-400">{form.temperature}</span></label><input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={(e) => update("temperature", e.target.value)} className="w-full accent-violet-600" /><div className="flex justify-between text-[9px] text-slate-400"><span>Precise</span><span>Creative</span></div></div>
        <div><label className={label}>Maximum tokens</label><input type="number" min="1" max="200000" className={field} value={form.max_tokens} onChange={(e) => update("max_tokens", e.target.value)} /></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.demo_mode} onChange={(e) => update("demo_mode", e.target.checked)} className="accent-violet-600" />Simulated demo mode <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">Not a live call</span></label>
        <div className="flex gap-2">
          <button disabled={loading} onClick={() => onExecute(payload)} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 disabled:opacity-50"><Play size={14} fill="currentColor" />{loading ? "Running…" : "Execute & record"}</button>
          {replayId && <button disabled={loading} onClick={() => onReplay(payload)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RotateCcw size={13} />{modified ? "Replay changes" : "Replay request"}</button>}
        </div>
      </div>
      {replayId && <div className={`mt-3 flex items-center gap-2 text-[10px] ${modified ? "text-amber-700" : "text-slate-400"}`}><Save size={12} />{modified ? "Configuration differs from the original; this will be stored as a modified replay." : "Configuration matches the recorded original."}</div>}
    </div>
    <div className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(27,39,68,0.03)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><WandSparkles size={14} className="text-violet-600" />Request preview</div><button onClick={() => setShowPreview(!showPreview)} className="text-slate-400">{showPreview ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
      {showPreview && <><div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[10px] text-slate-500"><span>POST {form.endpoint}</span><span>application/json</span></div><pre className="scrollbar-thin max-h-[440px] overflow-auto bg-[#111827] p-4 font-mono text-[10px] leading-5 text-slate-200">{JSON.stringify(preview, null, 2)}</pre><div className="border-t border-slate-100 px-4 py-3 text-[10px] leading-4 text-slate-400">Authorization is added server-side when a key is provided. Keys are not included in this preview or saved request.</div></>}
    </div>
  </div>;
}
