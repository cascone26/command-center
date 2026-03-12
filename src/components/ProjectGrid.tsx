"use client";
import { useState, useEffect } from "react";

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
  healthScore: number;
}

const catColors: Record<string, string> = {
  business: "var(--accent)",
  school: "var(--yellow)",
  family: "var(--green)",
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function healthColor(s: number): string {
  if (s >= 80) return "var(--green)";
  if (s >= 60) return "var(--yellow)";
  return "var(--red)";
}

const OVERRIDES_KEY = "cc-project-overrides";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [overrides, setOverrides] = useState<Record<number, { notes?: string }>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(OVERRIDES_KEY);
      if (stored) setOverrides(JSON.parse(stored));
    } catch {}
  }, []);

  function saveOverride(id: number, notes: string) {
    const next = { ...overrides, [id]: { ...overrides[id], notes } };
    setOverrides(next);
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
    setEditing(null);
  }

  const cats = ["all", ...Array.from(new Set(projects.map((p) => p.category)))];
  const filtered = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Projects</span>
        <div className="flex gap-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer"
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
          const displayNotes = overrides[p.id]?.notes ?? p.notes;
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
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        p.status === "active"
                          ? "var(--green)"
                          : p.status === "paused"
                            ? "var(--yellow)"
                            : "var(--red)",
                    }}
                  />
                  <span className="text-sm font-medium">{p.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.url && (
                    <a
                      href={`https://${p.url}`}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {p.url}
                    </a>
                  )}
                  <span
                    className="health-badge"
                    style={{
                      background: `${healthColor(p.healthScore)}15`,
                      color: healthColor(p.healthScore),
                    }}
                  >
                    {p.healthScore}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-2 mt-1.5 text-xs"
                style={{ color: "var(--text-dim)", fontSize: "11px" }}
              >
                <span className="px-1 py-0 rounded" style={{ background: "var(--surface-3)" }}>
                  {p.type}
                </span>
                {p.lastCommit && <span>{timeAgo(p.lastCommit.date)}</span>}
                {p.gitStats && p.gitStats.totalCommits > 0 && (
                  <span className="mono">{p.gitStats.totalCommits} commits</span>
                )}
                {overdue && <span style={{ color: "var(--red)" }}>OVERDUE</span>}
              </div>

              {p.lastCommit && (
                <div
                  className="mt-1 text-xs mono truncate"
                  style={{ color: "var(--text-dim)", fontSize: "10px" }}
                >
                  {p.lastCommit.message}
                </div>
              )}

              {isOpen && (
                <div
                  className="mt-2 pt-2 space-y-1.5"
                  style={{ borderTop: "1px solid var(--border)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2">
                    {editing === p.id ? (
                      <div className="flex-1">
                        <textarea
                          className="w-full text-xs rounded p-2 outline-none resize-none"
                          style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border-bright)",
                            color: "var(--text)",
                            fontSize: "11px",
                          }}
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveOverride(p.id, editText);
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1">
                          <button className="edit-btn" style={{ color: "var(--green)" }} onClick={() => saveOverride(p.id, editText)}>save</button>
                          <button className="edit-btn" onClick={() => setEditing(null)}>cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs flex-1" style={{ color: "var(--text-mid)" }}>
                        {displayNotes}
                      </p>
                    )}
                    {editing !== p.id && (
                      <button
                        className="edit-btn shrink-0"
                        onClick={() => { setEditing(p.id); setEditText(displayNotes); }}
                      >
                        edit
                      </button>
                    )}
                  </div>
                  {p.path && (
                    <p className="text-xs mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                      {p.path}
                    </p>
                  )}
                  {p.statusSummary && (
                    <div className="log-viewer mt-1" style={{ maxHeight: "150px" }}>
                      {p.statusSummary}
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
