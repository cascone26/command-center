"use client";
import { useState } from "react";

interface Idea { name: string; description: string; section: string; }

const sectionColors: Record<string, string> = {
  "Want to Build (Ready Now)": "var(--green)",
  "Want to Build (Need Hardware / Budget)": "var(--yellow)",
};

export function IdeasPanel({ ideas }: { ideas: Idea[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? ideas : ideas.slice(0, 5);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Ideas Backlog</span>
        <span className="stat-pill" style={{ background: "var(--surface-3)", color: "var(--text-dim)" }}>{ideas.length}</span>
      </div>

      <div className="scroll-y space-y-1" style={{ maxHeight: showAll ? "400px" : "280px" }}>
        {displayed.map((idea, i) => (
          <div key={i} className="py-1.5 px-2 rounded text-xs" style={{ background: "var(--surface-2)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full shrink-0" style={{ background: sectionColors[idea.section] || "var(--accent)" }} />
              <span className="font-medium" style={{ fontSize: "11px" }}>{idea.name}</span>
            </div>
            <p className="ml-2.5 mt-0.5" style={{ color: "var(--text-dim)", fontSize: "10px" }}>{idea.description}</p>
          </div>
        ))}
      </div>

      {ideas.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="text-xs mt-2 cursor-pointer hover:underline" style={{ color: "var(--accent)" }}>
          {showAll ? "Collapse" : `+${ideas.length - 5} more`}
        </button>
      )}
    </div>
  );
}
