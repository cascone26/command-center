interface Project {
  id: number;
  title: string;
  nextCheckIn: string | null;
  status: string;
  category: string;
  checkIn: string;
}

const catColors: Record<string, string> = {
  business: "var(--accent)",
  school: "var(--yellow)",
  family: "var(--green)",
};

export function CalendarView({ projects }: { projects: Project[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = projects.filter(
    (p) => p.nextCheckIn && new Date(p.nextCheckIn) < today && p.status === "active"
  );

  const days: { label: string; items: Project[] }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const items = projects.filter((p) => p.nextCheckIn === dateStr && p.status === "active");
    if (items.length > 0) {
      days.push({
        label:
          i === 0
            ? "Today"
            : i === 1
              ? "Tomorrow"
              : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        items,
      });
    }
  }

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Upcoming Check-ins</span>
        {overdue.length > 0 && (
          <span className="stat-pill" style={{ background: "var(--red-dim)", color: "var(--red)" }}>
            {overdue.length} overdue
          </span>
        )}
      </div>

      {overdue.length > 0 && (
        <div className="mb-2">
          {overdue.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded mb-0.5"
              style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <span>{p.title}</span>
              <span className="mono" style={{ color: "var(--red)" }}>
                {p.nextCheckIn}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="scroll-y space-y-2" style={{ maxHeight: "200px" }}>
        {days.map((day, i) => (
          <div key={i}>
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
              {day.label}
            </div>
            {day.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-xs py-1 px-2 rounded mb-0.5"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: catColors[item.category] || "var(--border)" }}
                />
                <span>{item.title}</span>
                <span className="ml-auto mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                  {item.checkIn}
                </span>
              </div>
            ))}
          </div>
        ))}
        {days.length === 0 && overdue.length === 0 && (
          <p className="text-xs text-center py-3" style={{ color: "var(--text-dim)" }}>
            Clear for 2 weeks
          </p>
        )}
      </div>
    </div>
  );
}
