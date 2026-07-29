"use client";
import { useState } from "react";

interface HealthCheck {
  url: string;
  status: number;
  responseTime: number;
  ok: boolean;
  error?: string;
  bodySize?: number;
  checkedAt: string;
}

interface SSLCheck {
  hostname: string;
  ssl: boolean;
  issuer?: string;
  validTo?: string;
  daysUntilExpiry?: number;
  expired?: boolean;
  warning?: boolean;
  error?: string;
}

interface DeployInfo {
  state: string;
  createdAt: string;
  url?: string;
  name?: string;
}

interface VercelDomain {
  name: string;
  expiresAt?: number;
  verified?: boolean;
}

interface HealthData {
  checkedAt: string;
  healthChecks: HealthCheck[];
  sslChecks: SSLCheck[];
  deploymentMap: Record<string, DeployInfo>;
  vercelDomains: VercelDomain[];
  summary: {
    total: number;
    up: number;
    down: number;
    avgResponseTime: number;
    sslValid: number;
    sslExpiring: number;
    sslInvalid: number;
  };
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function responseColor(ms: number): string {
  if (ms < 200) return "var(--green)";
  if (ms < 500) return "var(--yellow)";
  return "var(--orange)";
}

function sslColor(check: SSLCheck): string {
  if (!check.ssl || check.expired) return "var(--red)";
  if (check.warning) return "var(--yellow)";
  return "var(--green)";
}

function sslLabel(check: SSLCheck): string {
  if (!check.ssl) return "ERROR";
  if (check.expired) return "EXPIRED";
  if (check.warning) return "EXPIRING";
  return "VALID";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

type Tab = "uptime" | "ssl" | "domains";

export function ProjectHealth({ data }: { data: HealthData | null }) {
  const [tab, setTab] = useState<Tab>("uptime");

  if (!data) {
    return (
      <div className="panel fade-up">
        <div className="panel-header">
          <span className="panel-title">Project Health</span>
        </div>
        <div className="flex items-center justify-center py-8" style={{ color: "var(--text-dim)" }}>
          <p className="text-xs">
            No health data. Run <code className="mono" style={{ background: "var(--surface-3)", padding: "2px 6px", borderRadius: "4px" }}>healthcheck run</code> to generate.
          </p>
        </div>
      </div>
    );
  }

  const s = data.summary;

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Project Health</span>
        <div className="flex items-center gap-2">
          <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
            {timeAgo(data.checkedAt)}
          </span>
          <span
            className="stat-pill"
            style={{
              background: s.down === 0 ? "var(--green-dim)" : "var(--red-dim)",
              color: s.down === 0 ? "var(--green)" : "var(--red)",
            }}
          >
            {s.up}/{s.total} up
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="rounded-lg p-2 text-center" style={{ background: "var(--surface-2)" }}>
          <p className="mono" style={{ fontSize: "18px", fontWeight: 700, color: s.down === 0 ? "var(--green)" : "var(--red)" }}>
            {s.up}/{s.total}
          </p>
          <p style={{ fontSize: "9px", color: "var(--text-dim)" }}>Sites Up</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: "var(--surface-2)" }}>
          <p className="mono" style={{ fontSize: "18px", fontWeight: 700, color: responseColor(s.avgResponseTime) }}>
            {s.avgResponseTime}
          </p>
          <p style={{ fontSize: "9px", color: "var(--text-dim)" }}>Avg ms</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: "var(--surface-2)" }}>
          <p className="mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--green)" }}>
            {s.sslValid}
          </p>
          <p style={{ fontSize: "9px", color: "var(--text-dim)" }}>SSL Valid</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: "var(--surface-2)" }}>
          <p className="mono" style={{ fontSize: "18px", fontWeight: 700, color: s.sslExpiring > 0 ? "var(--yellow)" : "var(--text-dim)" }}>
            {s.sslExpiring}
          </p>
          <p style={{ fontSize: "9px", color: "var(--text-dim)" }}>SSL Warn</p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-3">
        {(["uptime", "ssl", "domains"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer"
            style={{
              background: tab === t ? "var(--surface-3)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--text-dim)",
              border: `1px solid ${tab === t ? "var(--border-bright)" : "transparent"}`,
            }}
          >
            {t === "uptime" ? "Uptime" : t === "ssl" ? "SSL Certs" : "Domains"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="scroll-y" style={{ maxHeight: "400px" }}>
        {tab === "uptime" && (
          <div className="space-y-1.5">
            {data.healthChecks.map((check) => {
              const deploy = data.deploymentMap[check.url];
              return (
                <div
                  key={check.url}
                  className="rounded-lg p-2.5"
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid ${check.ok ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: check.ok ? "var(--green)" : "var(--red)" }}
                      />
                      <a
                        href={`https://${check.url}`}
                        target="_blank"
                        rel="noopener"
                        className="text-sm font-medium subtle-link"
                      >
                        {check.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="health-badge"
                        style={{
                          background: check.ok ? "var(--green-dim)" : "var(--red-dim)",
                          color: check.ok ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {check.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    {/* Response time bar */}
                    <div className="flex items-center gap-1.5 flex-1">
                      <div style={{ width: "60px", height: "4px", background: "var(--surface-3)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, (check.responseTime / 1000) * 100)}%`,
                            height: "100%",
                            background: responseColor(check.responseTime),
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                      <span className="mono" style={{ color: responseColor(check.responseTime) }}>
                        {check.responseTime}ms
                      </span>
                    </div>

                    {check.bodySize !== undefined && (
                      <span className="mono">{formatBytes(check.bodySize)}</span>
                    )}

                    {deploy && (
                      <span className="mono">
                        deploy:{" "}
                        <span style={{ color: deploy.state === "READY" ? "var(--green)" : deploy.state === "ERROR" ? "var(--red)" : "var(--yellow)" }}>
                          {deploy.state}
                        </span>
                        {" "}{timeAgo(deploy.createdAt)}
                      </span>
                    )}

                    {check.error && (
                      <span style={{ color: "var(--red)" }}>{check.error}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "ssl" && (
          <div className="space-y-1.5">
            {data.sslChecks.map((ssl) => (
              <div
                key={ssl.hostname}
                className="rounded-lg p-2.5"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid ${ssl.ssl && !ssl.expired && !ssl.warning ? "var(--border)" : ssl.warning ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ssl.hostname}</span>
                  <span
                    className="health-badge"
                    style={{
                      background: `${sslColor(ssl)}15`,
                      color: sslColor(ssl),
                    }}
                  >
                    {sslLabel(ssl)}
                  </span>
                </div>
                {ssl.ssl ? (
                  <div className="flex items-center gap-3 mt-1.5" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    <span>Issuer: {ssl.issuer}</span>
                    <span className="mono">
                      Expires: {new Date(ssl.validTo!).toLocaleDateString()}
                    </span>
                    <span
                      className="mono"
                      style={{ color: sslColor(ssl) }}
                    >
                      {ssl.daysUntilExpiry}d left
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{ssl.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "domains" && (
          <div className="space-y-1.5">
            {data.vercelDomains.length > 0 ? (
              data.vercelDomains.map((d) => {
                const expiry = d.expiresAt ? new Date(d.expiresAt) : null;
                const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;
                const domainColor =
                  daysLeft !== null && daysLeft < 30
                    ? "var(--red)"
                    : daysLeft !== null && daysLeft < 90
                      ? "var(--yellow)"
                      : "var(--green)";

                return (
                  <div
                    key={d.name}
                    className="rounded-lg p-2.5"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{d.name}</span>
                      <div className="flex items-center gap-2">
                        {d.verified !== undefined && (
                          <span
                            className="health-badge"
                            style={{
                              background: d.verified ? "var(--green-dim)" : "var(--red-dim)",
                              color: d.verified ? "var(--green)" : "var(--red)",
                            }}
                          >
                            {d.verified ? "verified" : "unverified"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                      {expiry ? (
                        <>
                          <span>Expires: {expiry.toLocaleDateString()}</span>
                          <span className="mono" style={{ color: domainColor }}>
                            {daysLeft}d left
                          </span>
                        </>
                      ) : (
                        <span>No expiry data (Vercel-managed subdomain)</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: "var(--text-dim)" }}>
                No Vercel domain data. Set VERCEL_TOKEN in .env.local to enable.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
