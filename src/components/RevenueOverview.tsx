"use client";

interface RevenueStream {
  name: string;
  url: string | null;
  status: "active" | "building" | "dormant";
  mrr: number;
  potential: string;
  nextAction: string;
}

interface RevenueData {
  streams: RevenueStream[];
  totalMRR: number;
  totalCosts: number;
  monthlyRevenue: number;
  netProfit: number;
  activeCount: number;
}

const statusConfig = {
  active: { label: "Active", color: "var(--green)", bg: "var(--green-dim)" },
  building: { label: "Building", color: "var(--yellow)", bg: "var(--yellow-dim)" },
  dormant: { label: "Dormant", color: "var(--text-dim)", bg: "var(--surface-3)" },
};

function MetricCard({ label, value, color, prefix = "$" }: { label: string; value: number | string; color: string; prefix?: string }) {
  return (
    <div className="stat-card" style={{ cursor: "default" }}>
      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px", fontWeight: 500 }}>{label}</p>
      <p className="mono" style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>
        {typeof value === "number" ? `${prefix}${value}` : value}
      </p>
    </div>
  );
}

export function RevenueOverview({ data }: { data: RevenueData }) {
  const profitColor = data.netProfit >= 0 ? "var(--green)" : "var(--red)";

  return (
    <div className="space-y-3">
      {/* Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total MRR" value={data.totalMRR} color="var(--green)" />
        <MetricCard label="Monthly Costs" value={data.totalCosts} color="var(--red)" />
        <MetricCard label="Net Profit" value={data.netProfit} color={profitColor} />
        <MetricCard label="Active Streams" value={data.activeCount} color="var(--accent)" prefix="" />
      </div>

      {/* Revenue Streams Table + Monthly P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Streams Table — 2 cols wide */}
        <div className="lg:col-span-2 panel fade-up">
          <div className="panel-header">
            <span className="panel-title">Revenue Streams</span>
            <span className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              {data.streams.length} streams
            </span>
          </div>

          {/* Table header */}
          <div
            className="grid gap-2 pb-2 mb-1"
            style={{
              gridTemplateColumns: "1fr 70px 120px 60px",
              borderBottom: "1px solid var(--border)",
              fontSize: "10px",
              color: "var(--text-dim)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>Stream</span>
            <span className="text-right">MRR</span>
            <span className="text-right">Potential</span>
            <span className="text-center">Status</span>
          </div>

          {/* Stream rows */}
          <div className="scroll-y" style={{ maxHeight: "280px" }}>
            {data.streams.map((stream) => {
              const sc = statusConfig[stream.status];
              return (
                <div
                  key={stream.name}
                  className="grid gap-2 items-center"
                  style={{
                    gridTemplateColumns: "1fr 70px 120px 60px",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div className="text-xs" style={{ color: "var(--text)", fontWeight: 500 }}>
                      {stream.name}
                    </div>
                    {stream.nextAction && (
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                        {stream.nextAction}
                      </div>
                    )}
                  </div>
                  <span
                    className="mono text-xs text-right"
                    style={{ color: stream.mrr > 0 ? "var(--green)" : "var(--text-dim)" }}
                  >
                    ${stream.mrr}
                  </span>
                  <span
                    className="mono text-right"
                    style={{ fontSize: "10px", color: "var(--text-mid)" }}
                  >
                    {stream.potential || "--"}
                  </span>
                  <div className="flex justify-center">
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: sc.bg,
                        color: sc.color,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly P&L */}
        <div className="panel fade-up">
          <div className="panel-header">
            <span className="panel-title">Monthly P&L</span>
          </div>

          <div className="space-y-4">
            {/* Visual bar comparison */}
            <div className="space-y-3">
              <PnlBar label="Revenue" amount={data.monthlyRevenue} max={Math.max(data.monthlyRevenue, data.totalCosts, 1)} color="var(--green)" />
              <PnlBar label="Costs" amount={data.totalCosts} max={Math.max(data.monthlyRevenue, data.totalCosts, 1)} color="var(--red)" />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>Revenue</span>
                <span className="mono text-xs" style={{ color: data.monthlyRevenue > 0 ? "var(--green)" : "var(--text-dim)" }}>
                  ${data.monthlyRevenue}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>Costs</span>
                <span className="mono text-xs" style={{ color: "var(--red)" }}>
                  -${data.totalCosts}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-xs font-medium" style={{ color: "var(--text-mid)" }}>Net Profit</span>
                <span className="mono text-sm font-bold" style={{ color: profitColor }}>
                  ${data.netProfit}/mo
                </span>
              </div>
            </div>

            {/* Stream breakdown by status */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                By Status
              </div>
              {(["active", "building", "dormant"] as const).map((status) => {
                const count = data.streams.filter((s) => s.status === status).length;
                const sc = statusConfig[status];
                return (
                  <div key={status} className="flex items-center justify-between" style={{ padding: "3px 0" }}>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: sc.color,
                          display: "inline-block",
                        }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-mid)" }}>{sc.label}</span>
                    </div>
                    <span className="mono text-xs" style={{ color: "var(--text)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PnlBar({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, (amount / max) * 100) : 2;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{label}</span>
        <span className="mono" style={{ fontSize: "11px", color }}>${amount}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
