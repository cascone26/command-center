interface Project {
  id: number;
  title: string;
  status: string;
  nextCheckIn: string | null;
  healthScore: number;
  lastCommit?: { date: string } | null;
  url?: string;
}

interface Agent {
  name: string;
  loaded: boolean;
  healthy?: boolean;
  lastExitStatus: number | null;
}

interface ScholarshipDeadline {
  name: string;
  amount: number;
  deadline: string;
  status: string;
}

interface Props {
  projects: Project[];
  agents: Agent[];
  scholarships: { upcoming: ScholarshipDeadline[] };
  gsc: { healthStatus: string | null; clicks: number; impressions: number };
  emailCampaign: { errors: number };
}

interface Alert {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
}

export function Alerts({ projects, agents, scholarships, gsc, emailCampaign }: Props) {
  const alerts: Alert[] = [];
  const now = new Date();

  // Overdue check-ins
  projects.forEach((p) => {
    if (p.status !== "active" || !p.nextCheckIn) return;
    const due = new Date(p.nextCheckIn);
    const daysPast = Math.floor((now.getTime() - due.getTime()) / 86400000);
    if (daysPast > 7) {
      alerts.push({ severity: "critical", category: "Projects", message: `${p.title} check-in is ${daysPast} days overdue` });
    } else if (daysPast > 0) {
      alerts.push({ severity: "warning", category: "Projects", message: `${p.title} check-in is ${daysPast}d overdue` });
    }
  });

  // Low health scores
  projects.filter((p) => p.status === "active" && p.healthScore < 50).forEach((p) => {
    alerts.push({ severity: "critical", category: "Projects", message: `${p.title} health score is ${p.healthScore} — needs attention` });
  });
  projects.filter((p) => p.status === "active" && p.healthScore >= 50 && p.healthScore < 70).forEach((p) => {
    alerts.push({ severity: "warning", category: "Projects", message: `${p.title} health score is ${p.healthScore}` });
  });

  // Stale projects (no commits in 30+ days)
  projects.forEach((p) => {
    if (p.status !== "active" || !p.lastCommit?.date) return;
    const daysSince = Math.floor((now.getTime() - new Date(p.lastCommit.date).getTime()) / 86400000);
    if (daysSince > 30) {
      alerts.push({ severity: "warning", category: "Projects", message: `${p.title} has no commits in ${daysSince} days` });
    }
  });

  // Unhealthy agents
  agents.forEach((a) => {
    if (!a.loaded) {
      alerts.push({ severity: "critical", category: "Systems", message: `${a.name} is not loaded` });
    } else if (a.healthy === false) {
      alerts.push({ severity: "warning", category: "Systems", message: `${a.name} last exit was non-zero (${a.lastExitStatus})` });
    }
  });

  // Scholarship deadlines within 3 days
  scholarships.upcoming.forEach((s) => {
    const days = Math.ceil((new Date(s.deadline).getTime() - now.getTime()) / 86400000);
    if (days <= 3 && days >= 0 && s.status !== "applied") {
      alerts.push({ severity: "critical", category: "Scholarships", message: `${s.name} ($${s.amount.toLocaleString()}) due in ${days}d — not yet applied` });
    } else if (days <= 7 && days > 3 && s.status !== "applied") {
      alerts.push({ severity: "warning", category: "Scholarships", message: `${s.name} ($${s.amount.toLocaleString()}) due in ${days}d` });
    }
  });

  // SEO issues
  if (gsc.healthStatus === "FAIL") {
    alerts.push({ severity: "critical", category: "SEO", message: "SEO health check is failing" });
  }
  if (gsc.impressions === 0) {
    alerts.push({ severity: "warning", category: "SEO", message: "Zero impressions — indexing may be blocked" });
  }

  // Email errors
  if (emailCampaign.errors > 0) {
    alerts.push({ severity: "warning", category: "Outreach", message: `${emailCampaign.errors} email send errors` });
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  if (alerts.length === 0) {
    return (
      <div className="panel fade-up" style={{ borderColor: "rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
          <span className="panel-title">All Clear</span>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>No warnings or issues detected.</p>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const sevStyles = {
    critical: { bg: "var(--red-dim)", border: "rgba(239,68,68,0.2)", dot: "var(--red)", text: "var(--red)" },
    warning: { bg: "var(--yellow-dim)", border: "rgba(245,158,11,0.2)", dot: "var(--yellow)", text: "var(--yellow)" },
    info: { bg: "var(--cyan-dim)", border: "rgba(6,182,212,0.2)", dot: "var(--cyan)", text: "var(--cyan)" },
  };

  return (
    <div
      className="panel fade-up"
      style={{ borderColor: criticalCount > 0 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.2)" }}
    >
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full pulse-soft"
            style={{ background: criticalCount > 0 ? "var(--red)" : "var(--yellow)" }}
          />
          <span className="panel-title">Alerts</span>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="stat-pill" style={{ background: "var(--red-dim)", color: "var(--red)" }}>
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="stat-pill" style={{ background: "var(--yellow-dim)", color: "var(--yellow)" }}>
              {warningCount} warning
            </span>
          )}
        </div>
      </div>

      <div className="scroll-y space-y-1" style={{ maxHeight: "280px" }}>
        {alerts.map((alert, i) => {
          const s = sevStyles[alert.severity];
          return (
            <div
              key={i}
              className="flex items-start gap-2 text-xs py-2 px-2.5 rounded"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: s.dot }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="mono" style={{ fontSize: "9px", padding: "0 4px", borderRadius: "3px", background: "rgba(0,0,0,0.2)", color: s.text }}>
                    {alert.category}
                  </span>
                </div>
                <p className="mt-0.5" style={{ color: "var(--text)", fontSize: "11px" }}>
                  {alert.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
