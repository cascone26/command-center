#!/usr/bin/env node
/**
 * Aggregates data from tracker, STATUS.md files, automated processes,
 * and IDEAS.md into a single dashboard-data.json for the command center.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HOME = process.env.HOME || "/Users/scones";

function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return null;
  }
}

function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, "utf-8");
  } catch {
    return null;
  }
}

function getGitLastCommit(projectPath) {
  const expanded = projectPath.replace("~", HOME);
  try {
    const result = execSync(
      `git -C "${expanded}" log -1 --format="%H|%s|%ai" 2>/dev/null`,
      { encoding: "utf-8" }
    ).trim();
    if (!result) return null;
    const [hash, message, date] = result.split("|");
    return { hash, message, date };
  } catch {
    return null;
  }
}

function getGitStats(projectPath) {
  const expanded = projectPath.replace("~", HOME);
  try {
    const count = execSync(
      `git -C "${expanded}" rev-list --count HEAD 2>/dev/null`,
      { encoding: "utf-8" }
    ).trim();
    return { totalCommits: parseInt(count) || 0 };
  } catch {
    return { totalCommits: 0 };
  }
}

function readStatusMd(projectPath) {
  const expanded = projectPath.replace("~", HOME);
  const statusPath = path.join(expanded, "STATUS.md");
  const content = readFile(statusPath);
  if (!content) return null;
  // Extract first 500 chars as summary
  return content.substring(0, 500);
}

function getLaunchAgentStatus(label) {
  try {
    const result = execSync(`launchctl list "${label}" 2>/dev/null`, {
      encoding: "utf-8",
    });
    const pidMatch = result.match(/"PID"\s*=\s*(\d+)/);
    const statusMatch = result.match(/"LastExitStatus"\s*=\s*(\d+)/);
    return {
      loaded: true,
      pid: pidMatch ? parseInt(pidMatch[1]) : null,
      lastExitStatus: statusMatch ? parseInt(statusMatch[1]) : null,
      healthy:
        statusMatch !== null ? parseInt(statusMatch[1]) === 0 : undefined,
    };
  } catch {
    return { loaded: false, pid: null, lastExitStatus: null, healthy: false };
  }
}

function parseIdeas(content) {
  if (!content) return [];
  const ideas = [];
  const lines = content.split("\n");
  let currentSection = "";
  for (const line of lines) {
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "").trim();
    } else if (line.startsWith("- **") && currentSection !== "Completed" && currentSection !== "Notes") {
      const nameMatch = line.match(/\*\*(.+?)\*\*/);
      const desc = line.replace(/^- \*\*.+?\*\*\s*[—–-]\s*/, "").trim();
      if (nameMatch) {
        ideas.push({
          name: nameMatch[1],
          description: desc,
          section: currentSection,
        });
      }
    }
  }
  return ideas;
}

// --- Main ---
const trackerData = readJSON(path.join(HOME, "tools/tracker/data.json"));
const ideasContent = readFile(path.join(HOME, "ideas/IDEAS.md"));

// Enrich projects with git data and status
const projects = (trackerData?.items || []).map((item) => {
  const gitInfo = item.path ? getGitLastCommit(item.path) : null;
  const gitStats = item.path ? getGitStats(item.path) : null;
  const statusSummary = item.path ? readStatusMd(item.path) : null;

  return {
    ...item,
    lastCommit: gitInfo,
    gitStats,
    statusSummary,
  };
});

// LaunchAgent health
const agents = [
  { label: "com.lessondraft.social", name: "LessonDraft Social", schedule: "8am, 1:30pm, 6pm" },
  { label: "com.jacobcascone.scholarship-alerts", name: "Scholarship Alerts", schedule: "9am daily" },
  { label: "com.tradovate.bot", name: "Tradovate Bot", schedule: "Always running" },
  { label: "com.atlas.recorder", name: "Atlas Recorder", schedule: "Always running" },
  { label: "com.builtsimple.email-sender", name: "Email Sender", schedule: "9:03am daily" },
  { label: "com.builtsimple.follow-up", name: "Follow-Up Sender", schedule: "2:07pm daily" },
  { label: "com.lessondraft.gsc-check", name: "GSC Daily Check", schedule: "9am daily" },
  { label: "com.lessondraft.weekly-health", name: "SEO Health Check", schedule: "Mondays 10am" },
  { label: "com.tracker.digest", name: "Tracker Digest", schedule: "7am daily" },
];

const agentStatuses = agents.map((agent) => ({
  ...agent,
  ...getLaunchAgentStatus(agent.label),
}));

// Ideas
const ideas = parseIdeas(ideasContent);

// Stats
const activeProjects = projects.filter((p) => p.status === "active" && p.type === "project").length;
const pausedProjects = projects.filter((p) => p.status === "paused").length;
const activeAutomations = projects.filter((p) => p.status === "active" && p.type === "automation").length;
const healthyAgents = agentStatuses.filter((a) => a.healthy !== false).length;

const dashboard = {
  generatedAt: new Date().toISOString(),
  stats: {
    activeProjects,
    pausedProjects,
    activeAutomations,
    healthyAgents,
    totalAgents: agents.length,
    ideasCount: ideas.length,
  },
  projects,
  agents: agentStatuses,
  ideas,
  tasks: trackerData?.tasks || [],
};

const outPath = path.join(__dirname, "..", "src", "data", "dashboard-data.json");
fs.writeFileSync(outPath, JSON.stringify(dashboard, null, 2));
console.log(`Dashboard data generated at ${outPath}`);
console.log(`  ${activeProjects} active projects, ${activeAutomations} automations, ${healthyAgents}/${agents.length} agents healthy`);
