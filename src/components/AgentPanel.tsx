"use client";
import { useState } from "react";

interface Agent {
  label: string;
  name: string;
  schedule: string;
  loaded: boolean;
  pid: number | null;
  lastExitStatus: number | null;
  healthy?: boolean;
  recentLog: string | null;
}

const GROUP_LABELS: Record<string, string> = {
  "com.cobo": "COBO",
  "com.lessondraft": "LessonDraft",
  "com.dealscout": "Deal Scout",
  "com.builtsimple": "BuiltSimple",
  "com.jacobcascone": "Scholarships",
  "com.scholarships": "Scholarships",
  "com.commandcenter": "Command Center",
  "com.atlas": "Atlas",
  "com.classpilot": "ClassPilot",
  "com.bandwidth": "Bandwidth",
  "com.grace": "Grace",
  "com.tracker": "Tracker",
  "com.tradovate": "Tradovate",
  "com.scones": "System",
};

function getGroup(label: string): string {
  for (const prefix of Object.keys(GROUP_LABELS)) {
    if (label.startsWith(prefix)) return prefix;
  }
  return "other";
}

function groupAgents(agents: Agent[]): { key: string; label: string; agents: Agent[] }[] {
  const map = new Map<string, Agent[]>();
  for (const a of agents) {
    const key = getGroup(a.label);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, agents]) => ({
      key,
      label: GROUP_LABELS[key] ?? key,
      agents,
    }));
}

export function AgentPanel({ agents }: { agents: Agent[] }) {
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const healthy = agents.filter((a) => a.healthy !== false).length;
  const groups = groupAgents(agents);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">LaunchAgents</span>
        <span
          className="stat-pill"
          style={{
            background: healthy === agents.length ? "var(--green-dim)" : "var(--yellow-dim)",
            color: healthy === agents.length ? "var(--green)" : "var(--yellow)",
          }}
        >
          {healthy}/{agents.length} healthy
        </span>
      </div>

      <div className="space-y-2">
        {groups.map(({ key, label, agents: groupAgents }) => {
          const groupHealthy = groupAgents.filter((a) => a.healthy !== false).length;
          const allHealthy = groupHealthy === groupAgents.length;
          const isCollapsed = collapsedGroups.has(key);

          return (
            <div key={key}>
              {/* Group header */}
              <div
                className="flex items-center justify-between py-1.5 px-2 rounded cursor-pointer text-xs"
                style={{ background: "var(--surface-1)" }}
                onClick={() => toggleGroup(key)}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{label}</span>
                </div>
                <span
                  className="mono px-1.5 py-0.5 rounded"
                  style={{
                    fontSize: "10px",
                    background: allHealthy ? "var(--green-dim)" : "var(--yellow-dim)",
                    color: allHealthy ? "var(--green)" : "var(--yellow)",
                  }}
                >
                  {groupHealthy}/{groupAgents.length}
                </span>
              </div>

              {/* Agent rows */}
              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5 ml-2">
                  {groupAgents.map((a) => {
                    const isHealthy = a.healthy !== false;
                    const isOpen = openLog === a.label;
                    return (
                      <div key={a.label}>
                        <div
                          className="flex items-center justify-between py-2 px-2.5 rounded text-xs cursor-pointer transition-colors"
                          style={{ background: "var(--surface-2)" }}
                          onClick={() => setOpenLog(isOpen ? null : a.label)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: !a.loaded
                                  ? "var(--text-dim)"
                                  : isHealthy
                                    ? "var(--green)"
                                    : "var(--red)",
                              }}
                            />
                            <span className="font-medium">{a.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="mono" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                              {a.schedule}
                            </span>
                            {a.pid && (
                              <span
                                className="mono px-1 py-0 rounded"
                                style={{ background: "var(--bg)", color: "var(--green)", fontSize: "10px" }}
                              >
                                PID {a.pid}
                              </span>
                            )}
                            {!a.loaded && (
                              <span
                                className="mono px-1 py-0 rounded"
                                style={{ background: "var(--red-dim)", color: "var(--red)", fontSize: "10px" }}
                              >
                                UNLOADED
                              </span>
                            )}
                          </div>
                        </div>
                        {isOpen && a.recentLog && <div className="log-viewer mt-1 mb-1">{a.recentLog}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
