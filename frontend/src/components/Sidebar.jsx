import {
  Activity, BarChart3, Boxes, ChevronLeft, Clock3, GitCompareArrows, LayoutDashboard,
  Settings2, WandSparkles,
} from "lucide-react";

const links = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "builder", label: "Request builder", icon: WandSparkles },
  { id: "history", label: "Request history", icon: Clock3 },
  { id: "comparison", label: "Replay comparison", icon: GitCompareArrows },
];

export default function Sidebar({ page, onNavigate }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-[#10152a] px-4 py-5 text-white max-lg:w-[76px] max-lg:px-3">
      <div className="flex items-center gap-3 px-2 pb-9">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-950/30">
          <Boxes size={21} />
        </div>
        <div className="max-lg:hidden">
          <div className="text-[13px] font-bold tracking-[0.12em]">BIFROST</div>
          <div className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-slate-400">REQUEST REPLAY</div>
        </div>
      </div>
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-lg:hidden">Workspace</div>
      <nav className="space-y-1">
        {links.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${page === id ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}>
            <Icon size={18} strokeWidth={1.8} /><span className="max-lg:hidden">{label}</span>
            {page === id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 max-lg:hidden" />}
          </button>
        ))}
      </nav>
      <div className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-lg:hidden">Insights</div>
      <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100">
        <BarChart3 size={18} strokeWidth={1.8} /><span className="max-lg:hidden">Analytics</span>
      </button>
      <div className="mt-auto">
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 max-lg:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200"><Activity size={14} className="text-emerald-400" /> Replay engine ready</div>
          <p className="mb-0 mt-2 text-[11px] leading-4 text-slate-400">Your records stay in your local SQLite database.</p>
        </div>
        <button onClick={() => onNavigate("settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100">
          <Settings2 size={18} strokeWidth={1.8} /><span className="max-lg:hidden">Settings</span>
        </button>
        <div className="mt-3 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/20 text-xs font-semibold text-indigo-200">BR</div>
          <div className="max-lg:hidden"><div className="text-xs font-medium text-slate-200">Local workspace</div><div className="mt-0.5 text-[10px] text-slate-500">Developer mode</div></div>
          <ChevronLeft size={15} className="ml-auto text-slate-600 max-lg:hidden" />
        </div>
      </div>
    </aside>
  );
}
