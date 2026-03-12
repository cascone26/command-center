"use client";
import { useState } from "react";

interface Props {
  scholarships: {
    statusCounts: Record<string, { count: number; amount: number }>;
    upcoming: { name: string; amount: number; deadline: string; status: string }[];
    totalPipeline: number;
    totalCount: number;
    applied: { count: number; amount: number };
    todo: { count: number; amount: number };
    won: { count: number; amount: number };
  };
}

function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export function ScholarshipPanel({ scholarships }: Props) {
  const [showAll, setShowAll] = useState(false);
  const s = scholarships;
  const displayed = showAll ? s.upcoming : s.upcoming.slice(0, 6);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Scholarships</span>
        <span className="stat-pill" style={{ background: "var(--yellow-dim)", color: "var(--yellow)" }}>
          ${(s.totalPipeline / 1000).toFixed(0)}K
        </span>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-1.5 rounded" style={{ background: "var(--surface-2)" }}>
          <div className="text-lg font-bold font-mono" style={{ color: "var(--yellow)" }}>{s.todo.count}</div>
          <div className="text-xs" style={{ color: "var(--text-dim)", fontSize: "10px" }}>To Apply</div>
        </div>
        <div className="text-center p-1.5 rounded" style={{ background: "var(--surface-2)" }}>
          <div className="text-lg font-bold font-mono" style={{ color: "var(--accent)" }}>{s.applied.count}</div>
          <div className="text-xs" style={{ color: "var(--text-dim)", fontSize: "10px" }}>Applied</div>
        </div>
        <div className="text-center p-1.5 rounded" style={{ background: "var(--surface-2)" }}>
          <div className="text-lg font-bold font-mono" style={{ color: "var(--green)" }}>{s.won.count}</div>
          <div className="text-xs" style={{ color: "var(--text-dim)", fontSize: "10px" }}>Won</div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-dim)" }}>Upcoming Deadlines</div>
      <div className="scroll-y space-y-1">
        {displayed.map((item, i) => {
          const days = daysUntil(item.deadline);
          const urgent = days <= 7;
          return (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded text-xs" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: item.status === "applied" ? "var(--accent)" : "var(--yellow)" }} />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-mono" style={{ color: "var(--green)" }}>${item.amount.toLocaleString()}</span>
                <span className="font-mono" style={{ color: urgent ? "var(--red)" : "var(--text-dim)" }}>
                  {days}d
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {s.upcoming.length > 6 && (
        <button onClick={() => setShowAll(!showAll)} className="text-xs mt-2 cursor-pointer hover:underline" style={{ color: "var(--accent)" }}>
          {showAll ? "Show less" : `+${s.upcoming.length - 6} more`}
        </button>
      )}
    </div>
  );
}
