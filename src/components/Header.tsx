export function Header({ generatedAt }: { generatedAt: string }) {
  const d = new Date(generatedAt);
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full pulse-soft" style={{ background: "var(--green)" }} />
        <h1 className="text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          COMMAND CENTER
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>
          {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
          {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
