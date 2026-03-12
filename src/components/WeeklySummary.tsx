interface DeadlineItem {
  name: string;
  amount: number;
  deadline: string;
  status: string;
}

interface Props {
  summary: {
    commitsThisWeek: number;
    emailsSentThisWeek: number;
    deadlinesThisWeek: DeadlineItem[];
  };
}

export function WeeklySummary({ summary }: Props) {
  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">This Week</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2.5 rounded" style={{ background: "var(--surface-2)" }}>
          <div className="mono text-xl font-bold" style={{ color: "var(--green)" }}>
            {summary.commitsThisWeek}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Commits</div>
        </div>
        <div className="text-center p-2.5 rounded" style={{ background: "var(--surface-2)" }}>
          <div className="mono text-xl font-bold" style={{ color: "var(--orange)" }}>
            {summary.emailsSentThisWeek}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Emails Sent</div>
        </div>
      </div>

      {summary.deadlinesThisWeek.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-dim)" }}>
            Scholarship Deadlines This Week
          </div>
          <div className="space-y-1">
            {summary.deadlinesThisWeek.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
                style={{ background: "var(--surface-2)" }}
              >
                <span className="truncate">{d.name}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="mono" style={{ color: "var(--green)" }}>
                    ${d.amount.toLocaleString()}
                  </span>
                  <span className="mono" style={{ color: "var(--yellow)" }}>
                    {d.deadline}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.deadlinesThisWeek.length === 0 && (
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          No scholarship deadlines this week
        </p>
      )}
    </div>
  );
}
