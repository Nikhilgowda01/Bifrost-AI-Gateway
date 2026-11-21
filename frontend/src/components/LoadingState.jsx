export default function LoadingState({ label = "Loading your workspace…" }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
      {label}
    </div>
  );
}
