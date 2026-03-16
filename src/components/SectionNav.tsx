"use client";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "alerts", label: "Alerts" },
  { id: "revenue", label: "Revenue" },
  { id: "projects", label: "Projects" },
  { id: "business", label: "Business" },
  { id: "school", label: "School" },
  { id: "health", label: "Health" },
  { id: "systems", label: "Systems" },
  { id: "notes", label: "Notes" },
];

export function SectionNav() {
  return (
    <nav className="nav-tabs mb-3">
      {sections.map((s) => (
        <button
          key={s.id}
          className="nav-tab"
          onClick={() => {
            document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
