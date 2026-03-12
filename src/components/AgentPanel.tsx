interface Agent {
  label: string;
  name: string;
  schedule: string;
  loaded: boolean;
  pid: number | null;
  lastExitStatus: number | null;
  healthy?: boolean;
}

export function AgentPanel({ agents }: { agents: Agent[] }) {
  const healthyCount = agents.filter((a) => a.healthy !== false).length;

  return (
    <div
      className="rounded-lg p-4 fade-in"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">LaunchAgents</h2>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: healthyCount === agents.length ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.15)",
            color: healthyCount === agents.length ? "var(--green)" : "var(--orange)",
          }}
        >
          {healthyCount}/{agents.length}
        </span>
      </div>

      <div className="space-y-2">
        {agents.map((agent) => {
          const isHealthy = agent.healthy !== false;
          return (
            <div
              key={agent.label}
              className="flex items-center justify-between py-1.5 px-2 rounded text-sm"
              style={{ background: "var(--surface-2)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: !agent.loaded
                      ? "var(--text-dim)"
                      : isHealthy
                      ? "var(--green)"
                      : "var(--red)",
                  }}
                />
                <span className="text-xs font-medium">{agent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {agent.schedule}
                </span>
                {agent.pid && (
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg)", color: "var(--green)" }}
                  >
                    PID {agent.pid}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
