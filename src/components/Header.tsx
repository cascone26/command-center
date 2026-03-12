"use client";
import { useState, useRef, useEffect } from "react";

interface SearchableItem {
  type: string;
  label: string;
  sublabel?: string;
  section?: string;
}

export function Header({
  generatedAt,
  data,
}: {
  generatedAt: string;
  data: {
    projects: { title: string; url?: string; status: string; category: string }[];
    ideas: { name: string; description: string; section: string }[];
    agents: { name: string; healthy: boolean; schedule: string }[];
    scholarships: { upcoming: { name: string; deadline: string; amount: number }[] };
  };
}) {
  const d = new Date(generatedAt);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allItems: SearchableItem[] = [
    ...data.projects.map((p) => ({ type: "Project", label: p.title, sublabel: p.url || p.category, section: "projects" })),
    ...data.ideas.map((i) => ({ type: "Idea", label: i.name, sublabel: i.description, section: "projects" })),
    ...data.agents.map((a) => ({ type: "Agent", label: a.name, sublabel: a.schedule, section: "systems" })),
    ...data.scholarships.upcoming.map((s) => ({
      type: "Scholarship",
      label: s.name,
      sublabel: `$${s.amount.toLocaleString()} - ${s.deadline}`,
      section: "school",
    })),
  ];

  const filtered = query.length > 1
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 12)
    : [];

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full pulse-soft" style={{ background: "var(--green)" }} />
        <h1 className="text-lg font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          COMMAND CENTER
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={ref}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-dim)"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {focused && filtered.length > 0 && (
            <div className="search-results">
              {filtered.map((item, i) => (
                <div
                  key={i}
                  className="search-result-item"
                  onClick={() => {
                    if (item.section) {
                      document.getElementById(item.section)?.scrollIntoView({ behavior: "smooth" });
                    }
                    setQuery("");
                    setFocused(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="mono"
                      style={{
                        fontSize: "9px",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        background: "var(--surface-3)",
                        color: "var(--text-dim)",
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 500 }}>{item.label}</span>
                  </div>
                  {item.sublabel && (
                    <p style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px", marginLeft: "42px" }}>
                      {item.sublabel.substring(0, 80)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="mono text-xs" style={{ color: "var(--text-dim)" }}>
          {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
          {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
