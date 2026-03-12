"use client";

import { useState } from "react";

interface Project {
  id: number;
  title: string;
  type: string;
  category: string;
  path?: string;
  url?: string;
  status: string;
  checkIn: string;
  nextCheckIn: string | null;
  notes: string;
  lastCommit?: { hash: string; message: string; date: string } | null;
  gitStats?: { totalCommits: number } | null;
  statusSummary?: string | null;
  tags?: string[];
  streakCount?: number;
}

const categoryColors: Record<string, string> = {
  business: "#6366f1",
  school: "#eab308",
  family: "#22c55e",
};

const statusIcons: Record<string, { dot: string; label: string }> = {
  active: { dot: "var(--green)", label: "Active" },
  paused: { dot: "var(--yellow)", label: "Paused" },
  blocked: { dot: "var(--red)", label: "Blocked" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = projects.filter((p) => {
    if (filter !== "all" && p.category !== filter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  const categories = ["all", ...new Set(projects.map((p) => p.category))];
  const types = ["all", ...new Set(projects.map((p) => p.type))];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Projects</h2>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                style={{
                  background: filter === cat ? "var(--accent-glow)" : "var(--surface-2)",
                  color: filter === cat ? "var(--accent)" : "var(--text-dim)",
                  border: `1px solid ${filter === cat ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                style={{
                  background: typeFilter === t ? "var(--surface-2)" : "transparent",
                  color: typeFilter === t ? "var(--text)" : "var(--text-dim)",
                  border: `1px solid ${typeFilter === t ? "var(--border)" : "transparent"}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((project, i) => {
          const si = statusIcons[project.status] || statusIcons.active;
          const overdue = isOverdue(project.nextCheckIn);
          const isExpanded = expanded === project.id;

          return (
            <div
              key={project.id}
              className="rounded-lg p-4 fade-in cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                background: "var(--surface)",
                border: `1px solid ${overdue ? "var(--red)" : "var(--border)"}`,
                animationDelay: `${i * 50}ms`,
                borderLeft: `3px solid ${categoryColors[project.category] || "var(--border)"}`,
              }}
              onClick={() => setExpanded(isExpanded ? null : project.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full pulse-dot"
                    style={{ background: si.dot }}
                  />
                  <h3 className="font-semibold text-sm">{project.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {project.url && (
                    <a
                      href={`https://${project.url}`}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {project.url}
                    </a>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{ background: "var(--surface-2)" }}
                >
                  {project.category}
                </span>
                <span>{project.checkIn} check-in</span>
                {project.nextCheckIn && (
                  <span style={{ color: overdue ? "var(--red)" : "var(--text-dim)" }}>
                    {overdue ? "OVERDUE" : `due ${project.nextCheckIn}`}
                  </span>
                )}
              </div>

              {/* Last commit */}
              {project.lastCommit && (
                <div
                  className="mt-2 text-xs font-mono truncate"
                  style={{ color: "var(--text-dim)" }}
                >
                  {timeAgo(project.lastCommit.date)} — {project.lastCommit.message}
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {project.notes}
                  </p>
                  {project.path && (
                    <p className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>
                      {project.path}
                    </p>
                  )}
                  {project.gitStats && project.gitStats.totalCommits > 0 && (
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {project.gitStats.totalCommits} total commits
                    </p>
                  )}
                  {project.statusSummary && (
                    <div
                      className="text-xs p-2 rounded mt-2 whitespace-pre-wrap"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-dim)",
                        maxHeight: "200px",
                        overflow: "auto",
                      }}
                    >
                      {project.statusSummary}
                    </div>
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
