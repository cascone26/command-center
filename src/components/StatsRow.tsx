"use client";

interface Stats {
  activeProjects: number;
  pausedProjects: number;
  activeAutomations: number;
  healthyAgents: number;
  totalAgents: number;
  ideasCount: number;
  avgHealthScore: number;
}

function StatCard({
  label,
  value,
  sub,
  color,
  section,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  section: string;
}) {
  return (
    <div
      className="stat-card"
      onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" })}
    >
      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px", fontWeight: 500 }}>{label}</p>
      <p className="mono" style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StatsRow({
  stats,
  school,
  scholarships,
  emailCampaign,
  gsc,
}: {
  stats: Stats;
  school: { completedCourses: number; totalEstimated: number; gpa: string };
  scholarships: { totalCount: number; totalPipeline: number; applied: { count: number }; won: { count: number; amount: number } };
  emailCampaign: { sent: number; emailed: number };
  gsc: { clicks: number; impressions: number };
}) {
  return (
    <section id="overview" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
      <StatCard
        label="Active Projects"
        value={stats.activeProjects}
        sub={`${stats.pausedProjects} paused`}
        color="var(--accent)"
        section="projects"
      />
      <StatCard
        label="Automations"
        value={stats.activeAutomations}
        sub={`${stats.healthyAgents}/${stats.totalAgents} agents OK`}
        color="var(--cyan)"
        section="systems"
      />
      <StatCard
        label="Health Score"
        value={stats.avgHealthScore}
        sub="avg active"
        color={stats.avgHealthScore >= 80 ? "var(--green)" : stats.avgHealthScore >= 60 ? "var(--yellow)" : "var(--red)"}
        section="projects"
      />
      <StatCard
        label="Scholarships"
        value={scholarships.applied.count}
        sub={`$${(scholarships.totalPipeline / 1000).toFixed(0)}K pipeline`}
        color="var(--purple)"
        section="school"
      />
      <StatCard
        label="Emails Sent"
        value={emailCampaign.sent}
        sub={`${emailCampaign.emailed} contacted`}
        color="var(--orange)"
        section="business"
      />
      <StatCard
        label="SEO Clicks"
        value={gsc.clicks}
        sub={`${gsc.impressions} impressions`}
        color="var(--green)"
        section="business"
      />
    </section>
  );
}
