import { Bell, ChevronDown, CircleHelp } from "lucide-react";

export default function Navbar({ demoMode }) {
  return (
    <header className="flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-8 max-sm:px-4">
      <div className="text-xs text-slate-400">Workspace <span className="mx-1.5 text-slate-300">/</span><span className="font-medium capitalize text-slate-600">Bifrost Replay</span></div>
      <div className="flex items-center gap-4">
        {demoMode && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Demo data</span>}
        <button className="text-slate-400 hover:text-slate-700" aria-label="Help"><CircleHelp size={17} /></button>
        <button className="relative text-slate-400 hover:text-slate-700" aria-label="Notifications"><Bell size={17} /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-violet-500" /></button>
        <button className="flex items-center gap-2 border-l border-slate-200 pl-4 text-xs font-medium text-slate-600"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-[11px] font-bold text-violet-700">N</span><span className="max-sm:hidden">Nikhil</span><ChevronDown size={13} className="text-slate-400 max-sm:hidden" /></button>
      </div>
    </header>
  );
}
