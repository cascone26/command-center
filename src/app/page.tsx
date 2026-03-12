import dashboardData from "@/data/dashboard-data.json";
import { StatsBar } from "@/components/StatsBar";
import { ProjectGrid } from "@/components/ProjectGrid";
import { AgentPanel } from "@/components/AgentPanel";
import { CalendarView } from "@/components/CalendarView";
import { IdeasPanel } from "@/components/IdeasPanel";
import { ActivityFeed } from "@/components/ActivityFeed";

export default function Home() {
  const data = dashboardData;
  const generatedDate = new Date(data.generatedAt);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
            Last updated:{" "}
            {generatedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-mono"
          style={{
            background: "var(--accent-glow)",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
          }}
        >
          v1.0
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={data.stats} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Projects — takes 2 cols */}
        <div className="lg:col-span-2">
          <ProjectGrid projects={data.projects} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <AgentPanel agents={data.agents} />
          <CalendarView projects={data.projects} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ActivityFeed projects={data.projects} />
        <IdeasPanel ideas={data.ideas} />
      </div>
    </main>
  );
}
