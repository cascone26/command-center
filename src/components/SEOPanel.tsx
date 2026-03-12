interface KeywordEntry {
  position: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
}

interface SitemapHealth {
  lastRun: string;
  totalSitemapUrls: number;
  summary: { indexed: number; notIndexed: number; blocked: number; totalChecked: number } | null;
}

interface AIRecEntry {
  date: string;
  results: { model: string; prompt: string; mentioned: boolean; position: number | null; error?: string }[];
}

interface Props {
  gsc: {
    tracker: {
      first_indexed: string;
      first_impression: string;
      first_click: string;
      last_indexed_count: number;
      last_impressions: number;
      last_check: string;
    } | null;
    clicks: number;
    impressions: number;
    ctr: string;
    position: string;
    dailyData: { date: string; clicks: number; impressions: number }[];
    healthStatus: string | null;
  };
  seoTools?: {
    rankTracker: { date: string; keywords: Record<string, KeywordEntry> } | null;
    sitemapHealth: SitemapHealth | null;
    aiRecommendations: AIRecEntry | null;
  };
}

export function SEOPanel({ gsc, seoTools }: Props) {
  const maxImp = Math.max(...gsc.dailyData.map((d) => d.impressions), 1);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">SEO / GSC</span>
        <span
          className="stat-pill"
          style={{
            background: gsc.healthStatus === "PASS" ? "var(--green-dim)" : "var(--yellow-dim)",
            color: gsc.healthStatus === "PASS" ? "var(--green)" : "var(--yellow)",
          }}
        >
          {gsc.healthStatus || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <MetricBox label="Clicks" value={String(gsc.clicks)} color="var(--green)" />
        <MetricBox label="Impressions" value={String(gsc.impressions)} color="var(--cyan)" />
        <MetricBox label="CTR" value={gsc.ctr} color="var(--yellow)" />
        <MetricBox label="Position" value={gsc.position} color="var(--accent)" />
      </div>

      {gsc.dailyData.length > 0 && (
        <div className="mb-3">
          <div className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>
            Last 7 Days
          </div>
          <div className="mini-bar">
            {gsc.dailyData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
                <div
                  className="mini-bar-col w-full"
                  style={{
                    height: `${Math.max(2, (d.impressions / maxImp) * 36)}px`,
                    background: d.clicks > 0 ? "var(--green)" : "var(--accent)",
                    opacity: d.impressions > 0 ? 1 : 0.2,
                  }}
                />
                <span style={{ fontSize: "8px", color: "var(--text-dim)" }}>
                  {new Date(d.date + "T12:00:00").getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-dim)" }}>
        Milestones
      </div>
      <div className="space-y-1">
        <Milestone label="First Indexed" value={gsc.tracker?.first_indexed || "None"} />
        <Milestone label="First Impression" value={gsc.tracker?.first_impression || "None"} />
        <Milestone label="First Click" value={gsc.tracker?.first_click || "None"} />
        <Milestone label="Indexed Pages" value={String(gsc.tracker?.last_indexed_count || 0)} />
      </div>

      {gsc.tracker?.last_check && (
        <div className="text-xs mt-2 mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
          Last check:{" "}
          {new Date(gsc.tracker.last_check).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      )}

      {seoTools?.sitemapHealth?.summary && (
        <>
          <div className="text-xs font-medium mt-3 mb-1.5" style={{ color: "var(--text-dim)" }}>
            Sitemap Health
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MetricBox label="Indexed" value={String(seoTools.sitemapHealth.summary.indexed)} color="var(--green)" />
            <MetricBox label="Not Indexed" value={String(seoTools.sitemapHealth.summary.notIndexed)} color="var(--yellow)" />
            <MetricBox label="Blocked" value={String(seoTools.sitemapHealth.summary.blocked)} color="var(--red, #f87171)" />
            <MetricBox label="Total URLs" value={String(seoTools.sitemapHealth.totalSitemapUrls)} color="var(--text-dim)" />
          </div>
        </>
      )}

      {seoTools?.rankTracker?.keywords && (
        <>
          <div className="text-xs font-medium mt-3 mb-1.5" style={{ color: "var(--text-dim)" }}>
            Keyword Rankings{" "}
            <span className="mono" style={{ fontSize: "9px" }}>({seoTools.rankTracker.date})</span>
          </div>
          <div className="space-y-1">
            {Object.entries(seoTools.rankTracker.keywords).slice(0, 6).map(([kw, data]) => (
              <div
                key={kw}
                className="flex items-center justify-between text-xs py-1 px-2 rounded"
                style={{ background: "var(--surface-2)" }}
              >
                <span style={{ color: "var(--text-dim)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw}</span>
                <span className="mono" style={{ color: data.position ? "var(--green)" : "var(--text-dim)" }}>
                  {data.position ? `#${data.position}` : "--"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {seoTools?.aiRecommendations && (
        <>
          <div className="text-xs font-medium mt-3 mb-1.5" style={{ color: "var(--text-dim)" }}>
            AI Recommendations{" "}
            <span className="mono" style={{ fontSize: "9px" }}>({seoTools.aiRecommendations.date})</span>
          </div>
          {(() => {
            const results = seoTools.aiRecommendations.results;
            const mentioned = results.filter((r) => r.mentioned).length;
            const errored = results.filter((r) => r.error).length;
            const total = results.length;
            return (
              <div className="grid grid-cols-3 gap-2">
                <MetricBox label="Mentioned" value={String(mentioned)} color={mentioned > 0 ? "var(--green)" : "var(--text-dim)"} />
                <MetricBox label="Tested" value={String(total)} color="var(--cyan)" />
                <MetricBox label="Errors" value={String(errored)} color={errored > 0 ? "var(--red, #f87171)" : "var(--text-dim)"} />
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-1.5 rounded" style={{ background: "var(--surface-2)" }}>
      <div className="text-base font-bold mono" style={{ color }}>
        {value}
      </div>
      <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>{label}</div>
    </div>
  );
}

function Milestone({ label, value }: { label: string; value: string }) {
  const achieved = value !== "None" && value !== "0";
  return (
    <div
      className="flex items-center justify-between text-xs py-1 px-2 rounded"
      style={{ background: "var(--surface-2)" }}
    >
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="mono" style={{ color: achieved ? "var(--green)" : "var(--text-dim)" }}>
        {achieved ? value : "--"}
      </span>
    </div>
  );
}
