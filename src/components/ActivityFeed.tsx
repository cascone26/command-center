interface Project {
  id: number; title: string; category: string;
  lastCommit?: { hash: string; message: string; date: string } | null;
}
interface Activity {
  date: string; action: string; id: number; title: string; note: string | null;
}

const catColors: Record<string, string> = { business: "#6366f1", school: "#f59e0b", family: "#22c55e" };
const actionColors: Record<string, string> = {
  CHECKIN: "var(--green)", ADD: "var(--cyan)", REMOVE: "var(--red)", PAUSE: "var(--yellow)", RESUME: "var(--green)", SNOOZE: "var(--orange)",
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "now";
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function ActivityFeed({ projects, activity }: { projects: Project[]; activity: Activity[] }) {
  const gitActivity = projects
    .filter(p => p.lastCommit?.date)
    .sort((a, b) => new Date(b.lastCommit!.date).getTime() - new Date(a.lastCommit!.date).getTime())
    .slice(0, 8);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Activity</span>
      </div>

      {/* Tracker activity */}
      {activity.length > 0 && (
        <div className="mb-3">
          <div className="text-xs mb-1" style={{ color: "var(--text-dim)", fontSize: "10px" }}>TRACKER</div>
          <div className="space-y-0.5">
            {activity.slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded" style={{ background: "var(--surface-2)" }}>
                <span className="font-mono px-1 rounded" style={{ background: "var(--surface-3)", color: actionColors[a.action] || "var(--text-dim)", fontSize: "9px" }}>
                  {a.action}
                </span>
                <span className="truncate">{a.title}</span>
                <span className="ml-auto shrink-0 font-mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                  {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Git commits */}
      <div className="text-xs mb-1" style={{ color: "var(--text-dim)", fontSize: "10px" }}>RECENT COMMITS</div>
      <div className="scroll-y space-y-0.5" style={{ maxHeight: "200px" }}>
        {gitActivity.map(p => (
          <div key={p.id} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded" style={{ background: "var(--surface-2)" }}>
            <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: catColors[p.category] || "var(--border)" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ fontSize: "11px" }}>{p.title}</span>
                <span className="font-mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>{timeAgo(p.lastCommit!.date)}</span>
              </div>
              <p className="font-mono truncate" style={{ color: "var(--text-dim)", fontSize: "10px" }}>{p.lastCommit!.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
