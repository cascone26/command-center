interface Stats {
  activeProjects: number;
  pausedProjects: number;
  activeAutomations: number;
  healthyAgents: number;
  totalAgents: number;
  ideasCount: number;
}

export function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "Active Projects", value: stats.activeProjects, color: "var(--green)" },
    { label: "Paused", value: stats.pausedProjects, color: "var(--yellow)" },
    { label: "Automations", value: stats.activeAutomations, color: "var(--accent)" },
    {
      label: "Agents Healthy",
      value: `${stats.healthyAgents}/${stats.totalAgents}`,
      color: stats.healthyAgents === stats.totalAgents ? "var(--green)" : "var(--orange)",
    },
    { label: "Ideas Backlog", value: stats.ideasCount, color: "var(--text-dim)" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg p-4 fade-in"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="text-2xl font-bold font-mono" style={{ color: item.color }}>
            {item.value}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
