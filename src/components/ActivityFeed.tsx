interface Project {
  id: number;
  title: string;
  category: string;
  lastCommit?: { hash: string; message: string; date: string } | null;
}

const categoryColors: Record<string, string> = {
  business: "#6366f1",
  school: "#eab308",
  family: "#22c55e",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function ActivityFeed({ projects }: { projects: Project[] }) {
  const withCommits = projects
    .filter((p) => p.lastCommit?.date)
    .sort(
      (a, b) =>
        new Date(b.lastCommit!.date).getTime() -
        new Date(a.lastCommit!.date).getTime()
    )
    .slice(0, 12);

  return (
    <div
      className="rounded-lg p-4 fade-in"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>

      {withCommits.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-dim)" }}>
          No recent git activity
        </p>
      ) : (
        <div className="space-y-1">
          {withCommits.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 py-2 px-2 rounded text-xs"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{
                  background: categoryColors[p.category] || "var(--border)",
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.title}</span>
                  <span style={{ color: "var(--text-dim)" }}>
                    {timeAgo(p.lastCommit!.date)}
                  </span>
                </div>
                <p
                  className="font-mono truncate mt-0.5"
                  style={{ color: "var(--text-dim)" }}
                >
                  {p.lastCommit!.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
