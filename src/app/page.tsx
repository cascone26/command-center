import dashboardData from "@/data/dashboard-data.json";
import { Header } from "@/components/Header";
import { StatsRow } from "@/components/StatsRow";
import { ProjectGrid } from "@/components/ProjectGrid";
import { AgentPanel } from "@/components/AgentPanel";
import { CalendarView } from "@/components/CalendarView";
import { ScholarshipPanel } from "@/components/ScholarshipPanel";
import { EmailCampaign } from "@/components/EmailCampaign";
import { SEOPanel } from "@/components/SEOPanel";
import { SchoolPanel } from "@/components/SchoolPanel";
import { Heatmap } from "@/components/Heatmap";
import { ActivityFeed } from "@/components/ActivityFeed";
import { IdeasPanel } from "@/components/IdeasPanel";
import { QuickActions } from "@/components/QuickActions";
import { Notepad } from "@/components/Notepad";

export default function Home() {
  const d = dashboardData;

  return (
    <main className="min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto">
      <Header generatedAt={d.generatedAt} />
      <StatsRow stats={d.stats} school={d.school} scholarships={d.scholarships} emailCampaign={d.emailCampaign} gsc={d.gsc} />

      {/* Row 1: Projects + Right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
        <div className="lg:col-span-8">
          <ProjectGrid projects={d.projects} />
        </div>
        <div className="lg:col-span-4 space-y-3">
          <SchoolPanel school={d.school} />
          <CalendarView projects={d.projects} />
          <QuickActions />
        </div>
      </div>

      {/* Row 2: Scholarship + Email + SEO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        <ScholarshipPanel scholarships={d.scholarships} />
        <EmailCampaign data={d.emailCampaign} />
        <SEOPanel gsc={d.gsc} />
      </div>

      {/* Row 3: Agents + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
        <div className="lg:col-span-5">
          <AgentPanel agents={d.agents} />
        </div>
        <div className="lg:col-span-7">
          <Heatmap data={d.heatmap} />
        </div>
      </div>

      {/* Row 4: Activity + Ideas + Notepad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        <ActivityFeed projects={d.projects} activity={d.activity} />
        <IdeasPanel ideas={d.ideas} />
        <Notepad />
      </div>
    </main>
  );
}
