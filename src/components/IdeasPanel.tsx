"use client";

import { useState } from "react";

interface Idea {
  name: string;
  description: string;
  section: string;
}

const sectionColors: Record<string, string> = {
  "Want to Build (Ready Now)": "var(--green)",
  "Want to Build (Need Hardware / Budget)": "var(--yellow)",
  "Niche / \"Nobody Else Has This\" Ideas": "var(--accent)",
};

export function IdeasPanel({ ideas }: { ideas: Idea[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? ideas : ideas.slice(0, 6);

  return (
    <div
      className="rounded-lg p-4 fade-in"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Ideas Backlog</h2>
        <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>
          {ideas.length} ideas
        </span>
      </div>

      <div className="space-y-2">
        {displayed.map((idea, i) => (
          <div
            key={i}
            className="py-2 px-3 rounded text-xs"
            style={{ background: "var(--surface-2)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: sectionColors[idea.section] || "var(--text-dim)",
                }}
              />
              <span className="font-medium">{idea.name}</span>
            </div>
            <p className="mt-1 ml-3.5" style={{ color: "var(--text-dim)" }}>
              {idea.description}
            </p>
          </div>
        ))}
      </div>

      {ideas.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs mt-3 cursor-pointer hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {showAll ? "Show less" : `Show all ${ideas.length}`}
        </button>
      )}
    </div>
  );
}
