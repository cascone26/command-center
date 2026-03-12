interface Props {
  data: {
    totalLeads: number;
    withEmail: number;
    emailed: number;
    followedUp: number;
    sent: number;
    errors: number;
    recentSends: { id: number; name: string; email: string; sentAt: string }[];
  };
}

export function EmailCampaign({ data }: Props) {
  const d = data;
  const emailPct = d.withEmail > 0 ? Math.round((d.emailed / d.withEmail) * 100) : 0;

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Email Campaign</span>
        <span className="stat-pill" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
          {d.sent} sent
        </span>
      </div>

      {/* Funnel */}
      <div className="space-y-2 mb-3">
        <FunnelRow label="Total Leads" value={d.totalLeads} max={d.totalLeads} color="var(--text-dim)" />
        <FunnelRow label="With Email" value={d.withEmail} max={d.totalLeads} color="var(--cyan)" />
        <FunnelRow label="Contacted" value={d.emailed} max={d.withEmail} color="var(--accent)" />
        <FunnelRow label="Followed Up" value={d.followedUp} max={d.emailed || 1} color="var(--yellow)" />
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--text-dim)" }}>Outreach Progress</span>
          <span className="font-mono" style={{ color: "var(--accent)" }}>{emailPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${emailPct}%`, background: "var(--accent)" }} />
        </div>
      </div>

      {/* Recent sends */}
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-dim)" }}>Recent Sends</div>
      <div className="scroll-y space-y-1" style={{ maxHeight: "120px" }}>
        {d.recentSends.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded" style={{ background: "var(--surface-2)" }}>
            <span className="truncate">{s.name}</span>
            <span className="font-mono shrink-0 ml-2" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
              {new Date(s.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0" style={{ color: "var(--text-dim)", fontSize: "11px" }}>{label}</span>
      <div className="flex-1 progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono w-12 text-right" style={{ color, fontSize: "11px" }}>{value.toLocaleString()}</span>
    </div>
  );
}
