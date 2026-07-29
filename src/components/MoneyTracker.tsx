"use client";
import { useState } from "react";

/* ── Types ── */
interface PassiveService {
  name: string;
  device: string;
  status: "running" | "stopped" | "error";
  estMonthlyLow: number;
  estMonthlyHigh: number;
  totalEarned: number;
  lastCheck: string;
  containerType: "native" | "docker";
}

interface GumroadData {
  totalProducts: number;
  productsThisWeek: number;
  totalRevenue: number;
  autoposterStatus: "running" | "stopped";
  nextScheduledRun: string;
}

interface ApifyData {
  actorsPublished: number;
  totalRuns: number;
  storeRevenue: number;
}

interface LessonDraftData {
  mrr: number;
  subscribers: number;
  trafficThisWeek: number;
}

interface OtherIncome {
  tutoring: number;
  jobs: { name: string; monthly: number }[];
  dealScout: number;
}

interface DailyIncome {
  date: string;
  amount: number;
}

export interface MoneyTrackerData {
  passiveServices: PassiveService[];
  gumroad: GumroadData;
  apify: ApifyData;
  lessonDraft: LessonDraftData;
  otherIncome: OtherIncome;
  dailyTrend: DailyIncome[];
}

/* ── Helpers ── */
const deviceColors: Record<string, string> = {
  Mac: "var(--cyan)",
  HP: "var(--purple)",
  Aspire: "var(--orange)",
};

const deviceIcons: Record<string, string> = {
  Mac: "&#xF8FF;",
  HP: "&#x1F5A5;",
  Aspire: "&#x2699;",
};

function statusColor(s: string) {
  if (s === "running") return "var(--green)";
  if (s === "error") return "var(--red)";
  return "var(--yellow)";
}

function statusBg(s: string) {
  if (s === "running") return "var(--green-dim)";
  if (s === "error") return "var(--red-dim)";
  return "var(--yellow-dim)";
}

function formatTime(iso: string) {
  if (!iso) return "--";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

/* ── Summary Card ── */
function SummaryCard({ label, value, sub, color, glow }: { label: string; value: string; sub?: string; color: string; glow?: boolean }) {
  return (
    <div
      className={`stat-card ${glow ? "glow" : ""}`}
      style={{
        cursor: "default",
        borderColor: glow ? color : undefined,
        borderWidth: glow ? "1px" : undefined,
      }}
    >
      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px", fontWeight: 500 }}>{label}</p>
      <p className="mono" style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      {sub && <p className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

/* ── Mini Trend Chart (SVG) ── */
function TrendChart({ data }: { data: DailyIncome[] }) {
  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const barW = 100 / data.length;

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Daily Income Trend</span>
        <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
          Last {data.length} days
        </span>
      </div>
      <svg viewBox={`0 0 ${data.length * 10} 50`} style={{ width: "100%", height: "80px" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = Math.max(2, (d.amount / maxVal) * 44);
          return (
            <g key={d.date}>
              <rect
                x={i * 10 + 1}
                y={48 - h}
                width={7}
                height={h}
                rx={1}
                fill="url(#barGrad)"
                style={{ transition: "height 0.4s ease" }}
              >
                <title>{d.date}: ${d.amount.toFixed(2)}</title>
              </rect>
            </g>
          );
        })}
        {/* baseline */}
        <line x1="0" y1="48" x2={data.length * 10} y2="48" stroke="var(--border)" strokeWidth="0.5" />
      </svg>
      <div className="flex justify-between" style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>
        <span>{data[0]?.date?.slice(5) || ""}</span>
        <span>{data[data.length - 1]?.date?.slice(5) || ""}</span>
      </div>
    </div>
  );
}

/* ── Passive Service Row ── */
function ServiceRow({ svc }: { svc: PassiveService }) {
  const isActive = svc.status === "running";

  return (
    <div
      className="grid items-center gap-3"
      style={{
        gridTemplateColumns: "1fr 70px 80px 80px 60px",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Name + Device */}
      <div className="flex items-center gap-2">
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: statusColor(svc.status),
            display: "inline-block",
            flexShrink: 0,
            boxShadow: isActive ? `0 0 6px ${statusColor(svc.status)}` : "none",
          }}
        />
        <div>
          <div className="text-xs" style={{ color: "var(--text)", fontWeight: 500 }}>{svc.name}</div>
          <div className="flex items-center gap-1" style={{ marginTop: "1px" }}>
            <span
              className="mono"
              style={{
                fontSize: "9px",
                padding: "0px 5px",
                borderRadius: "3px",
                background: "var(--surface-3)",
                color: deviceColors[svc.device] || "var(--text-dim)",
              }}
            >
              {svc.device}
            </span>
            <span className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
              {svc.containerType === "docker" ? "Docker" : "Native"}
            </span>
          </div>
        </div>
      </div>

      {/* Est. Monthly */}
      <span className="mono text-xs text-right" style={{ color: isActive ? "var(--green)" : "var(--text-dim)" }}>
        ${svc.estMonthlyLow}-{svc.estMonthlyHigh}
      </span>

      {/* Total Earned */}
      <span className="mono text-xs text-right" style={{ color: svc.totalEarned > 0 ? "var(--text)" : "var(--text-dim)" }}>
        ${svc.totalEarned.toFixed(2)}
      </span>

      {/* Last Check */}
      <span className="mono text-right" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
        {formatTime(svc.lastCheck)}
      </span>

      {/* Status Badge */}
      <div className="flex justify-center">
        <span
          className="mono"
          style={{
            fontSize: "9px",
            padding: "1px 6px",
            borderRadius: "4px",
            background: statusBg(svc.status),
            color: statusColor(svc.status),
            whiteSpace: "nowrap",
          }}
        >
          {svc.status}
        </span>
      </div>
    </div>
  );
}

/* ── Expandable Section ── */
function Section({ title, badge, defaultOpen, children }: { title: string; badge?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div className="panel fade-up" style={{ overflow: "hidden" }}>
      <button
        className="panel-header w-full"
        style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
        onClick={() => setOpen(!open)}
      >
        <span className="panel-title flex items-center gap-2">
          <span style={{ transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)", fontSize: "10px" }}>
            &#9654;
          </span>
          {title}
        </span>
        {badge && (
          <span className="mono" style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>
            {badge}
          </span>
        )}
      </button>
      <div
        style={{
          maxHeight: open ? "2000px" : "0",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function MoneyTracker({ data }: { data: MoneyTrackerData }) {
  const passiveMonthlyLow = data.passiveServices.filter((s) => s.status === "running").reduce((s, svc) => s + svc.estMonthlyLow, 0);
  const passiveMonthlyHigh = data.passiveServices.filter((s) => s.status === "running").reduce((s, svc) => s + svc.estMonthlyHigh, 0);
  const passiveMid = Math.round((passiveMonthlyLow + passiveMonthlyHigh) / 2);

  const activeJobsMonthly = data.otherIncome.jobs.reduce((s, j) => s + j.monthly, 0);
  const activeIncome = activeJobsMonthly + data.otherIncome.tutoring;

  const devicesEarning = new Set(data.passiveServices.filter((s) => s.status === "running").map((s) => s.device)).size;
  const totalRunning = data.passiveServices.filter((s) => s.status === "running").length;
  const totalServices = data.passiveServices.length;
  const totalPassiveEarned = data.passiveServices.reduce((s, svc) => s + svc.totalEarned, 0);

  const netMonthly = passiveMid + activeIncome + data.lessonDraft.mrr + data.gumroad.totalRevenue;

  return (
    <section id="money" className="space-y-3 mb-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}
      >
        <span style={{ color: "var(--green)", fontSize: "14px" }}>$</span>
        Money Tracker
      </h2>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Passive Income"
          value={`$${passiveMonthlyLow}-${passiveMonthlyHigh}`}
          sub="monthly estimate"
          color="var(--green)"
          glow
        />
        <SummaryCard
          label="Active Income"
          value={`$${activeIncome.toLocaleString()}`}
          sub="monthly jobs + tutoring"
          color="var(--cyan)"
        />
        <SummaryCard
          label="Devices Earning"
          value={`${devicesEarning}`}
          sub={`${totalRunning}/${totalServices} services`}
          color="var(--purple)"
        />
        <SummaryCard
          label="Total Earned"
          value={`$${totalPassiveEarned.toFixed(2)}`}
          sub="passive to date"
          color="var(--accent)"
        />
        <SummaryCard
          label="Net Monthly"
          value={`~$${netMonthly.toLocaleString()}`}
          sub="all streams"
          color="var(--green)"
          glow
        />
      </div>

      {/* ── Trend Chart + Passive Income ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Passive Income Table — 8 cols */}
        <div className="lg:col-span-8">
          <Section
            title="Passive Income Services"
            badge={`${totalRunning}/${totalServices} active`}
            defaultOpen
          >
            {/* Table header */}
            <div
              className="grid gap-3 pb-2 mb-1"
              style={{
                gridTemplateColumns: "1fr 70px 80px 80px 60px",
                borderBottom: "1px solid var(--border)",
                fontSize: "10px",
                color: "var(--text-dim)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span>Service</span>
              <span className="text-right">Est/mo</span>
              <span className="text-right">Earned</span>
              <span className="text-right">Checked</span>
              <span className="text-center">Status</span>
            </div>

            <div className="scroll-y" style={{ maxHeight: "400px" }}>
              {data.passiveServices.map((svc) => (
                <ServiceRow key={`${svc.name}-${svc.device}`} svc={svc} />
              ))}
            </div>

            {/* Totals row */}
            <div
              className="grid gap-3 pt-3 mt-1"
              style={{
                gridTemplateColumns: "1fr 70px 80px 80px 60px",
                borderTop: "1px solid var(--border-bright)",
              }}
            >
              <span className="text-xs font-semibold" style={{ color: "var(--text-mid)" }}>
                Total ({totalRunning} running)
              </span>
              <span className="mono text-xs text-right font-bold" style={{ color: "var(--green)" }}>
                ${passiveMonthlyLow}-{passiveMonthlyHigh}
              </span>
              <span className="mono text-xs text-right font-bold" style={{ color: "var(--text)" }}>
                ${totalPassiveEarned.toFixed(2)}
              </span>
              <span />
              <span />
            </div>
          </Section>
        </div>

        {/* Trend Chart + Device Breakdown — 4 cols */}
        <div className="lg:col-span-4 space-y-3">
          <TrendChart data={data.dailyTrend} />

          {/* Device breakdown */}
          <div className="panel fade-up">
            <div className="panel-header">
              <span className="panel-title">By Device</span>
            </div>
            {["Mac", "HP", "Aspire"].map((dev) => {
              const services = data.passiveServices.filter((s) => s.device === dev);
              const running = services.filter((s) => s.status === "running").length;
              const low = services.filter((s) => s.status === "running").reduce((s, v) => s + v.estMonthlyLow, 0);
              const high = services.filter((s) => s.status === "running").reduce((s, v) => s + v.estMonthlyHigh, 0);
              if (services.length === 0) return null;
              return (
                <div key={dev} className="flex items-center justify-between" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: deviceColors[dev],
                        display: "inline-block",
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--text-mid)" }}>{dev}</span>
                    <span className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                      {running}/{services.length}
                    </span>
                  </div>
                  <span className="mono text-xs" style={{ color: running > 0 ? "var(--green)" : "var(--text-dim)" }}>
                    ${low}-{high}/mo
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: Gumroad + Apify + LessonDraft ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Gumroad */}
        <Section title="Gumroad Products" badge={`$${data.gumroad.totalRevenue}`} defaultOpen>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Products Listed</div>
                <div className="mono text-lg font-bold">{data.gumroad.totalProducts}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>This Week</div>
                <div className="mono text-lg font-bold" style={{ color: data.gumroad.productsThisWeek > 0 ? "var(--green)" : "var(--text-dim)" }}>
                  +{data.gumroad.productsThisWeek}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Auto-poster</span>
                <span
                  className="mono"
                  style={{
                    fontSize: "9px",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: statusBg(data.gumroad.autoposterStatus),
                    color: statusColor(data.gumroad.autoposterStatus),
                  }}
                >
                  {data.gumroad.autoposterStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Next Run</span>
                <span className="mono" style={{ fontSize: "10px", color: "var(--text-mid)" }}>
                  {data.gumroad.nextScheduledRun ? formatTime(data.gumroad.nextScheduledRun) : "--"}
                </span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-mid)" }}>Total Revenue</span>
                <span className="mono text-sm font-bold" style={{ color: data.gumroad.totalRevenue > 0 ? "var(--green)" : "var(--text-dim)" }}>
                  ${data.gumroad.totalRevenue}
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* Apify */}
        <Section title="Apify Scrapers" badge={`$${data.apify.storeRevenue}`} defaultOpen>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Published</div>
                <div className="mono text-lg font-bold" style={{ color: "var(--accent)" }}>{data.apify.actorsPublished}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Total Runs</div>
                <div className="mono text-lg font-bold">{data.apify.totalRuns}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Revenue</div>
                <div className="mono text-lg font-bold" style={{ color: data.apify.storeRevenue > 0 ? "var(--green)" : "var(--text-dim)" }}>
                  ${data.apify.storeRevenue}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* LessonDraft */}
        <Section title="LessonDraft" badge={`$${data.lessonDraft.mrr}/mo`} defaultOpen>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>MRR</div>
                <div className="mono text-lg font-bold" style={{ color: data.lessonDraft.mrr > 0 ? "var(--green)" : "var(--text-dim)" }}>
                  ${data.lessonDraft.mrr}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Subscribers</div>
                <div className="mono text-lg font-bold" style={{ color: "var(--accent)" }}>{data.lessonDraft.subscribers}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Traffic/wk</div>
                <div className="mono text-lg font-bold">{data.lessonDraft.trafficThisWeek}</div>
              </div>
            </div>

            {/* MRR progress toward goal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Goal: $500 MRR</span>
                <span className="mono" style={{ fontSize: "10px", color: "var(--green)" }}>
                  {Math.round((data.lessonDraft.mrr / 500) * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (data.lessonDraft.mrr / 500) * 100)}%`, background: "var(--green)" }}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Row 3: Other Income ── */}
      <Section title="Other Income" badge={`$${activeIncome + data.otherIncome.dealScout}/mo`} defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jobs */}
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
              Jobs
            </div>
            {data.otherIncome.jobs.map((job) => (
              <div key={job.name} className="flex items-center justify-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-mid)" }}>{job.name}</span>
                <span className="mono text-xs" style={{ color: "var(--green)" }}>${job.monthly}/mo</span>
              </div>
            ))}
          </div>

          {/* Tutoring + Deal Scout */}
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
              Side Income
            </div>
            <div className="flex items-center justify-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--text-mid)" }}>Tutoring</span>
              <span className="mono text-xs" style={{ color: data.otherIncome.tutoring > 0 ? "var(--green)" : "var(--text-dim)" }}>
                ${data.otherIncome.tutoring}/mo
              </span>
            </div>
            <div className="flex items-center justify-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--text-mid)" }}>Deal Scout Flips</span>
              <span className="mono text-xs" style={{ color: data.otherIncome.dealScout > 0 ? "var(--green)" : "var(--text-dim)" }}>
                ${data.otherIncome.dealScout}/mo
              </span>
            </div>
          </div>
        </div>
      </Section>
    </section>
  );
}
