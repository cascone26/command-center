interface Agent {
  name: string;
  schedule: string;
  loaded: boolean;
  pid: number | null;
  healthy?: boolean;
  lastExitStatus: number | null;
  recentLog: string | null;
}

export function NotificationsLog({ agents }: { agents: Agent[] }) {
  // Extract recent events from agent logs
  const events: { agent: string; time: string; message: string; ok: boolean }[] = [];

  agents.forEach((a) => {
    if (!a.recentLog) return;
    const lines = a.recentLog.split("\n").filter(Boolean).slice(-3);
    lines.forEach((line) => {
      // Try to extract timestamp
      const tsMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]/);
      const ts = tsMatch ? tsMatch[1] : "";
      const isError = /error|fail|exception/i.test(line) && !/PASS/i.test(line);
      const cleanLine = line.replace(/\[[\d\-T:.Z]+\]\s*/, "").substring(0, 120);
      events.push({
        agent: a.name,
        time: ts,
        message: cleanLine,
        ok: !isError,
      });
    });
  });

  // Sort by time descending and take last 12
  const sorted = events
    .filter((e) => e.time)
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 12);

  // Unhealthy agents
  const unhealthy = agents.filter((a) => a.healthy === false || !a.loaded);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Notifications</span>
        {unhealthy.length > 0 && (
          <span className="stat-pill" style={{ background: "var(--red-dim)", color: "var(--red)" }}>
            {unhealthy.length} issue{unhealthy.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {unhealthy.length > 0 && (
        <div className="mb-3">
          {unhealthy.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-2 text-xs py-1.5 px-2 rounded mb-0.5"
              style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--red)" }} />
              <span>{a.name}</span>
              <span className="ml-auto mono" style={{ color: "var(--red)", fontSize: "10px" }}>
                {!a.loaded ? "UNLOADED" : "UNHEALTHY"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="scroll-y space-y-0.5" style={{ maxHeight: "220px" }}>
        {sorted.length > 0 ? (
          sorted.map((event, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs py-1.5 px-2 rounded"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                style={{ background: event.ok ? "var(--green)" : "var(--red)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ fontSize: "10px" }}>
                    {event.agent}
                  </span>
                  <span className="mono" style={{ color: "var(--text-dim)", fontSize: "9px" }}>
                    {event.time
                      ? new Date(event.time).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p
                  className="mono truncate"
                  style={{ color: "var(--text-dim)", fontSize: "10px", marginTop: "1px" }}
                >
                  {event.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-center py-3" style={{ color: "var(--text-dim)" }}>
            No recent agent activity with timestamps
          </p>
        )}
      </div>
    </div>
  );
}
