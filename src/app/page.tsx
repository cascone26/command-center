import dashboardData from "@/data/dashboard-data.json";
import { Header } from "@/components/Header";
import { SectionNav } from "@/components/SectionNav";
import { StatsRow } from "@/components/StatsRow";
import { WeeklySummary } from "@/components/WeeklySummary";
import { ProjectGrid } from "@/components/ProjectGrid";
import { Heatmap } from "@/components/Heatmap";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CalendarView } from "@/components/CalendarView";
import { EmailCampaign } from "@/components/EmailCampaign";
import { SEOPanel } from "@/components/SEOPanel";
import { BlogStats } from "@/components/BlogStats";
import { MonthlyCosts } from "@/components/MonthlyCosts";
import { Income } from "@/components/Income";
import { SchoolPanel } from "@/components/SchoolPanel";
import { ScholarshipPanel } from "@/components/ScholarshipPanel";
import { GoalTracker } from "@/components/GoalTracker";
import { AgentPanel } from "@/components/AgentPanel";
import { NotificationsLog } from "@/components/NotificationsLog";
import { IdeasPanel } from "@/components/IdeasPanel";
import { Notepad } from "@/components/Notepad";

export default function Home() {
  const d = dashboardData;

  return (
    <main className="min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto">
      {/* Header + Search */}
      <Header
        generatedAt={d.generatedAt}
        data={{
          projects: d.projects as { title: string; url?: string; status: string; category: string }[],
          ideas: d.ideas,
          agents: d.agents as { name: string; healthy: boolean; schedule: string }[],
          scholarships: d.scholarships,
        }}
      />

      {/* Section Navigation */}
      <SectionNav />

      {/* Stats Row */}
      <StatsRow
        stats={d.stats}
        school={d.school}
        scholarships={d.scholarships}
        emailCampaign={d.emailCampaign}
        gsc={d.gsc}
      />

      {/* Weekly Summary */}
      <section id="weekly" className="mb-3">
        <WeeklySummary summary={d.weeklySummary} />
      </section>

      {/* ── PROJECTS ── */}
      <section id="projects" className="space-y-3 mb-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8">
            <ProjectGrid projects={d.projects as Parameters<typeof ProjectGrid>[0]["projects"]} />
          </div>
          <div className="lg:col-span-4 space-y-3">
            <CalendarView projects={d.projects as Parameters<typeof CalendarView>[0]["projects"]} />
            <ActivityFeed
              projects={d.projects as Parameters<typeof ActivityFeed>[0]["projects"]}
              activity={d.activity}
            />
          </div>
        </div>
        <Heatmap data={d.heatmap} />
      </section>

      {/* ── BUSINESS ── */}
      <section id="business" className="space-y-3 mb-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}
        >
          Business
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <EmailCampaign data={d.emailCampaign} />
          <SEOPanel gsc={d.gsc} />
          <BlogStats stats={d.blogStats} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MonthlyCosts defaults={d.monthlyCosts} />
          <Income />
        </div>
      </section>

      {/* ── SCHOOL ── */}
      <section id="school" className="space-y-3 mb-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}
        >
          School
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <SchoolPanel school={d.school} />
          <ScholarshipPanel scholarships={d.scholarships} />
          <GoalTracker />
        </div>
      </section>

      {/* ── SYSTEMS ── */}
      <section id="systems" className="space-y-3 mb-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}
        >
          Systems
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AgentPanel agents={d.agents as Parameters<typeof AgentPanel>[0]["agents"]} />
          <NotificationsLog agents={d.agents as Parameters<typeof NotificationsLog>[0]["agents"]} />
        </div>
      </section>

      {/* ── NOTES ── */}
      <section id="notes" className="space-y-3 mb-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}
        >
          Notes & Ideas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IdeasPanel ideas={d.ideas} />
          <Notepad />
        </div>
      </section>
    </main>
  );
}
