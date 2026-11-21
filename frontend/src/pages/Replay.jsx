import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import ComparisonPanel from "../components/ComparisonPanel.jsx";
import RequestBuilder, { defaultRequestConfig } from "../components/RequestBuilder.jsx";
import ResponseViewer from "../components/ResponseViewer.jsx";
import { api } from "../services/api.js";
import LoadingState from "../components/LoadingState.jsx";

export default function Replay({ requestId, onBack, onChanged, onCreated }) {
  const [record, setRecord] = useState(null);
  const [config, setConfig] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    if (!requestId) {
      setRecord(null);
      setConfig(defaultRequestConfig);
      setComparison(null);
      return () => { active = false; };
    }
    api.request(requestId).then(async (value) => {
      if (!active) return;
      setRecord(value);
      setConfig({ ...value.executions[0].config, api_key: "" });
      if (value.executions.length > 1) {
        try {
          const result = await api.compare(requestId);
          if (active) setComparison(result);
        } catch (err) {
          if (active) setError(err.message);
        }
      } else {
        setComparison(null);
      }
    }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [requestId]);
  const execute = async (payload) => {
    setLoading(true); setError("");
    try {
      const result = await api.execute(payload);
      setRecord(await api.request(result.request_id));
      setConfig({ ...result.config, api_key: payload.api_key });
      onChanged();
      onCreated(result.request_id);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const replay = async (payload) => {
    if (!requestId) return execute(payload);
    setLoading(true); setError("");
    try {
      const result = await api.replay(requestId, {
        config: {
          base_url: payload.base_url, endpoint: payload.endpoint, model: payload.model,
          system_prompt: payload.system_prompt, user_prompt: payload.user_prompt,
          temperature: Number(payload.temperature), max_tokens: Number(payload.max_tokens),
          demo_mode: payload.demo_mode,
        },
        api_key: payload.api_key || undefined,
      });
      setComparison({ comparison: result.comparison, is_modified: result.is_modified });
      setRecord(await api.request(requestId));
      onChanged();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  if (requestId && !record && !error) return <LoadingState label="Loading recorded request…" />;
  const modified = record && config ? JSON.stringify(
    Object.fromEntries(Object.entries(config).filter(([key]) => key !== "api_key")),
  ) !== JSON.stringify(record.executions[0].config) : false;
  return <div className="space-y-5">
    <div className="flex items-center gap-3"><button onClick={onBack} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /></button><div><h1 className="text-xl font-semibold text-slate-800">{requestId ? "Replay request" : "Request builder"}</h1><p className="mt-1 text-xs text-slate-500">{requestId ? `Recording ${requestId.slice(0, 12)} · update fields to create a modified replay` : "Configure, execute and record an AI gateway request."}</p></div></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <RequestBuilder key={`${requestId || "new"}-${record?.id || ""}`} initialConfig={config} replayId={requestId} modified={modified} loading={loading} onChange={setConfig} onExecute={execute} onReplay={replay} />
    {record?.executions?.length === 1 && <section className="space-y-3"><h2 className="text-sm font-semibold text-slate-800">Recorded execution</h2><ResponseViewer execution={record.executions[0]} title="Original response" /></section>}
    {requestId && record?.executions?.length > 1 && <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-800">Latest replay comparison</h2><p className="mt-1 text-[11px] text-slate-400">Compared with the first recorded execution.</p></div><button onClick={() => api.compare(requestId).then((result) => setComparison(result)).catch((err) => setError(err.message))} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><RotateCcw size={13} />Refresh comparison</button></div><ComparisonPanel data={comparison || null} /></section>}
  </div>;
}
