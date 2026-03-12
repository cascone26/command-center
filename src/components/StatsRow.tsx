interface Props {
  stats: { activeProjects: number; pausedProjects: number; activeAutomations: number; healthyAgents: number; totalAgents: number; avgHealthScore: number };
  school: { completedCourses: number; totalEstimated: number; daysUntilGrad: number; gpa: string };
  scholarships: { totalCount: number; totalPipeline: number; applied: { count: number }; todo: { count: number } };
  emailCampaign: { sent: number; totalLeads: number; emailed: number };
  gsc: { clicks: number; impressions: number; healthStatus: string | null };
}

export function StatsRow({ stats, school, scholarships, emailCampaign, gsc }: Props) {
  const items = [
    { label: "ACTIVE", value: stats.activeProjects, sub: `${stats.pausedProjects} paused`, color: "var(--green)", bg: "var(--green-dim)" },
    { label: "AUTOMATIONS", value: stats.activeAutomations, sub: `${stats.healthyAgents}/${stats.totalAgents} agents`, color: "var(--cyan)", bg: "var(--cyan-dim)" },
    { label: "HEALTH", value: `${stats.avgHealthScore}%`, sub: "avg score", color: stats.avgHealthScore >= 80 ? "var(--green)" : stats.avgHealthScore >= 60 ? "var(--yellow)" : "var(--red)", bg: stats.avgHealthScore >= 80 ? "var(--green-dim)" : stats.avgHealthScore >= 60 ? "var(--yellow-dim)" : "var(--red-dim)" },
    { label: "SCHOOL", value: `${school.completedCourses}/${school.totalEstimated}`, sub: `${school.daysUntilGrad}d to grad`, color: "var(--purple)", bg: "var(--purple-dim)" },
    { label: "SCHOLARSHIPS", value: scholarships.totalCount, sub: `$${(scholarships.totalPipeline / 1000).toFixed(0)}K pipeline`, color: "var(--yellow)", bg: "var(--yellow-dim)" },
    { label: "OUTREACH", value: emailCampaign.sent, sub: `of ${emailCampaign.totalLeads} leads`, color: "var(--accent)", bg: "var(--accent-dim)" },
    { label: "SEO", value: gsc.clicks, sub: `${gsc.impressions} imp`, color: gsc.healthStatus === "PASS" ? "var(--green)" : "var(--yellow)", bg: gsc.healthStatus === "PASS" ? "var(--green-dim)" : "var(--yellow-dim)" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="panel fade-up flex flex-col justify-between"
          style={{ padding: "10px 12px", animationDelay: `${i * 40}ms`, borderColor: "transparent", background: "var(--surface)" }}
        >
          <div className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
            {item.label}
          </div>
          <div className="text-xl font-bold font-mono mt-1" style={{ color: item.color }}>
            {item.value}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
            {item.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
