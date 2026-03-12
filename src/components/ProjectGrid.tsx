"use client";
import { useState } from "react";

interface Project {
  id: number; title: string; type: string; category: string; path?: string; url?: string;
  status: string; checkIn: string; nextCheckIn: string | null; notes: string;
  lastCommit?: { hash: string; message: string; date: string } | null;
  gitStats?: { totalCommits: number } | null;
  statusSummary?: string | null;
  healthScore: number;
}

const catColors: Record<string, string> = { business: "#6366f1", school: "#f59e0b", family: "#10b981" };

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

function healthColor(s: number): string {
  if (s >= 80) return "var(--green)";
  if (s >= 60) return "var(--yellow)";
  return "var(--red)";
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const cats = ["all", ...Array.from(new Set(projects.map(p => p.category)))];
  const filtered = filter === "all" ? projects : projects.filter(p => p.category === filter);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Projects</span>
        <div className="flex gap-1">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="text-xs px-2 py-0.5 rounded-md transition-all cursor-pointer"
              style={{
                background: filter === c ? "var(--surface-3)" : "transparent",
                color: filter === c ? "var(--text)" : "var(--text-dim)",
                border: `1px solid ${filter === c ? "var(--border-bright)" : "transparent"}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((p, i) => {
          const overdue = p.nextCheckIn && new Date(p.nextCheckIn) < new Date();
          const isOpen = expanded === p.id;
          return (
            <div
              key={p.id}
              className="rounded-lg p-3 cursor-pointer transition-all fade-up"
              style={{
                background: "var(--surface-2)",
                border: `1px solid ${overdue ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                borderLeft: `3px solid ${catColors[p.category] || "var(--border)"}`,
                animationDelay: `${i * 30}ms`,
              }}
              onClick={() => setExpanded(isOpen ? null : p.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === "active" ? "var(--green)" : p.status === "paused" ? "var(--yellow)" : "var(--red)" }} />
                  <span className="text-sm font-medium">{p.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.url && (
                    <a href={`https://${p.url}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                      {p.url}
                    </a>
                  )}
                  <span className="health-badge" style={{ background: `${healthColor(p.healthScore)}15`, color: healthColor(p.healthScore) }}>
                    {p.healthScore}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: "var(--text-dim)", fontSize: "11px" }}>
                <span className="px-1 py-0 rounded" style={{ background: "var(--surface-3)" }}>{p.type}</span>
                {p.lastCommit && <span>{timeAgo(p.lastCommit.date)} ago</span>}
                {p.gitStats && p.gitStats.totalCommits > 0 && <span>{p.gitStats.totalCommits} commits</span>}
                {overdue && <span style={{ color: "var(--red)" }}>OVERDUE</span>}
              </div>

              {p.lastCommit && (
                <div className="mt-1 text-xs font-mono truncate" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                  {p.lastCommit.message}
                </div>
              )}

              {isOpen && (
                <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--text-mid)" }}>{p.notes}</p>
                  {p.path && <p className="text-xs font-mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>{p.path}</p>}
                  {p.statusSummary && (
                    <div className="log-viewer mt-1" style={{ maxHeight: "150px" }}>{p.statusSummary}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
