"use client";

const actions = [
  { label: "Refresh Data", icon: "↻", desc: "Regenerate dashboard", cmd: "cd ~/projects/command-center && npm run generate" },
  { label: "GSC Check", icon: "◎", desc: "Run SEO check", cmd: "~/tools/gsc/daily-check.sh" },
  { label: "Tracker", icon: "▸", desc: "Open tracker", cmd: "tracker" },
  { label: "Send Emails", icon: "✉", desc: "Run email batch", cmd: "node ~/projects/lead-scraper/scripts/send-emails.js --limit 15" },
];

export function QuickActions() {
  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Quick Actions</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map(a => (
          <div
            key={a.label}
            className="rounded-md p-2 text-center cursor-default group"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            title={a.cmd}
          >
            <div className="text-base">{a.icon}</div>
            <div className="text-xs font-medium mt-0.5">{a.label}</div>
            <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>{a.desc}</div>
          </div>
        ))}
      </div>
      <p className="text-center mt-2" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
        Run commands in terminal — hover for cmd
      </p>
    </div>
  );
}
