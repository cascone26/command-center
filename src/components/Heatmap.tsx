"use client";

interface Props {
  data: Record<string, number>;
}

export function Heatmap({ data }: Props) {
  const days: { date: string; count: number; dayOfWeek: number }[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ date: dateStr, count: data[dateStr] || 0, dayOfWeek: d.getDay() });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const totalCommits = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  const weeks: (typeof days)[] = [];
  let currentWeek: typeof days = [];
  days.forEach((d, i) => {
    currentWeek.push(d);
    if (d.dayOfWeek === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  function intensity(count: number): string {
    if (count === 0) return "var(--surface-3)";
    const pct = count / maxCount;
    if (pct > 0.75) return "#22c55e";
    if (pct > 0.5) return "#16a34a";
    if (pct > 0.25) return "#15803d";
    return "#166534";
  }

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Activity (90 days)</span>
        <div className="flex gap-3">
          <span className="text-xs mono" style={{ color: "var(--green)" }}>
            {totalCommits} commits
          </span>
          <span className="text-xs mono" style={{ color: "var(--text-dim)" }}>
            {activeDays} active days
          </span>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {wi === 0 &&
              Array.from({ length: week[0]?.dayOfWeek || 0 }).map((_, i) => (
                <div key={`pad-${i}`} className="heatmap-cell" style={{ background: "transparent" }} />
              ))}
            {week.map((day) => (
              <div
                key={day.date}
                className="heatmap-cell"
                title={`${day.date}: ${day.count} commits`}
                style={{ background: intensity(day.count) }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-2 justify-end">
        <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>Less</span>
        {["var(--surface-3)", "#166534", "#15803d", "#16a34a", "#22c55e"].map((c, i) => (
          <div key={i} className="heatmap-cell" style={{ background: c }} />
        ))}
        <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>More</span>
      </div>
    </div>
  );
}
