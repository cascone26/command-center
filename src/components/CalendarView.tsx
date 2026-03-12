"use client";

interface Project {
  id: number;
  title: string;
  nextCheckIn: string | null;
  status: string;
  category: string;
  checkIn: string;
}

const categoryColors: Record<string, string> = {
  business: "#6366f1",
  school: "#eab308",
  family: "#22c55e",
};

export function CalendarView({ projects }: { projects: Project[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get next 14 days
  const days: { date: Date; label: string; items: Project[] }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const items = projects.filter((p) => p.nextCheckIn === dateStr && p.status === "active");

    days.push({
      date: d,
      label:
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      items,
    });
  }

  // Also show overdue
  const overdue = projects.filter(
    (p) =>
      p.nextCheckIn &&
      new Date(p.nextCheckIn) < today &&
      p.status === "active"
  );

  return (
    <div
      className="rounded-lg p-4 fade-in"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-lg font-semibold mb-3">Upcoming</h2>

      {overdue.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--red)" }}>
            OVERDUE
          </div>
          {overdue.map((p) => (
            <div
              key={p.id}
              className="text-xs py-1 px-2 rounded mb-1 flex items-center justify-between"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <span>{p.title}</span>
              <span style={{ color: "var(--red)" }}>{p.nextCheckIn}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {days.map((day) => (
          <div key={day.date.toISOString()}>
            {day.items.length > 0 && (
              <div className="py-1">
                <div className="text-xs font-medium mb-1" style={{ color: "var(--text-dim)" }}>
                  {day.label}
                </div>
                {day.items.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs py-1 px-2 rounded mb-0.5 flex items-center gap-2"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: categoryColors[item.category] || "var(--border)" }}
                    />
                    <span>{item.title}</span>
                    <span className="ml-auto" style={{ color: "var(--text-dim)" }}>
                      {item.checkIn}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {days.every((d) => d.items.length === 0) && overdue.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-dim)" }}>
            Nothing scheduled in the next 2 weeks
          </p>
        )}
      </div>
    </div>
  );
}
