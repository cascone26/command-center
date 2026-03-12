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

export function AgentPanel({ agents }: { agents: Agent[] }) {
  const [openLog, setOpenLog] = useState<string | null>(null);
  const healthy = agents.filter((a) => a.healthy !== false).length;

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

      <div className="space-y-1">
        {agents.map((a) => {
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
    </div>
  );
}
