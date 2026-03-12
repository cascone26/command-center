#!/usr/bin/env node
/**
 * Command Center — Data Aggregator
 * Pulls from: tracker, git, STATUS.md, scholarships DB, lead-scraper DB,
 * GSC logs, ClassPilot, LaunchAgents, IDEAS.md, activity.log
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HOME = process.env.HOME || "/Users/scones";

function readJSON(fp) {
  try { return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch { return null; }
}
function readFile(fp) {
  try { return fs.readFileSync(fp, "utf-8"); } catch { return null; }
}
function sql(db, query) {
  try {
    return execSync(`sqlite3 "${db}" "${query}"`, { encoding: "utf-8" }).trim();
  } catch { return ""; }
}

function getGitLastCommit(p) {
  const expanded = p.replace("~", HOME);
  try {
    const r = execSync(`git -C "${expanded}" log -1 --format="%H|%s|%ai" 2>/dev/null`, { encoding: "utf-8" }).trim();
    if (!r) return null;
    const [hash, message, date] = r.split("|");
    return { hash, message, date };
  } catch { return null; }
}

function getGitStats(p) {
  const expanded = p.replace("~", HOME);
  try {
    const count = execSync(`git -C "${expanded}" rev-list --count HEAD 2>/dev/null`, { encoding: "utf-8" }).trim();
    return { totalCommits: parseInt(count) || 0 };
  } catch { return { totalCommits: 0 }; }
}

function getGitHeatmap(p) {
  const expanded = p.replace("~", HOME);
  try {
    const result = execSync(
      `git -C "${expanded}" log --format="%ad" --date=short --since="90 days ago" 2>/dev/null`,
      { encoding: "utf-8" }
    ).trim();
    if (!result) return {};
    const counts = {};
    result.split("\n").forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
    return counts;
  } catch { return {}; }
}

function readStatusMd(p) {
  const expanded = p.replace("~", HOME);
  const content = readFile(path.join(expanded, "STATUS.md"));
  if (!content) return null;
  return content.substring(0, 600);
}

function getLaunchAgentStatus(label) {
  try {
    const r = execSync(`launchctl list "${label}" 2>/dev/null`, { encoding: "utf-8" });
    const pidMatch = r.match(/"PID"\s*=\s*(\d+)/);
    const statusMatch = r.match(/"LastExitStatus"\s*=\s*(\d+)/);
    return {
      loaded: true,
      pid: pidMatch ? parseInt(pidMatch[1]) : null,
      lastExitStatus: statusMatch ? parseInt(statusMatch[1]) : null,
      healthy: statusMatch !== null ? parseInt(statusMatch[1]) === 0 : undefined,
    };
  } catch {
    return { loaded: false, pid: null, lastExitStatus: null, healthy: false };
  }
}

function getAgentLog(logPath, lines) {
  try {
    const result = execSync(`tail -${lines || 25} "${logPath}" 2>/dev/null`, { encoding: "utf-8" });
    return result.trim();
  } catch { return null; }
}

function parseIdeas(content) {
  if (!content) return [];
  const ideas = [];
  const lines = content.split("\n");
  let section = "";
  for (const line of lines) {
    if (line.startsWith("## ")) section = line.replace("## ", "").trim();
    else if (line.startsWith("- **") && section !== "Completed" && section !== "Notes") {
      const m = line.match(/\*\*(.+?)\*\*/);
      const desc = line.replace(/^- \*\*.+?\*\*\s*[—–-]\s*/, "").trim();
      if (m) ideas.push({ name: m[1], description: desc, section });
    }
  }
  return ideas;
}

function parseActivityLog(content) {
  if (!content) return [];
  return content.trim().split("\n").filter(Boolean).map((line) => {
    const m = line.match(/^(.+?)\s*\|\s*(\w+)\s*\|\s*\[(\d+)\]\s*(.*?)(?:\s*\|\s*(.*))?$/);
    if (!m) return null;
    return { date: m[1].trim(), action: m[2], id: parseInt(m[3]), title: m[4].trim(), note: m[5] || null };
  }).filter(Boolean).reverse();
}

function getScholarshipData() {
  const db = path.join(HOME, "scholarships/scholarships.db");
  const statusCounts = {};
  const rows = sql(db, "SELECT status, COUNT(*), COALESCE(SUM(amount),0) FROM scholarships GROUP BY status;");
  rows.split("\n").filter(Boolean).forEach((row) => {
    const [status, count, amount] = row.split("|");
    statusCounts[status] = { count: parseInt(count), amount: parseInt(amount) };
  });

  const upcoming = [];
  const deadlineRows = sql(db,
    "SELECT name, amount, deadline, status FROM scholarships WHERE status IN ('todo','qualified','applied') AND deadline >= date('now') ORDER BY deadline LIMIT 20;"
  );
  deadlineRows.split("\n").filter(Boolean).forEach((row) => {
    const [name, amount, deadline, status] = row.split("|");
    upcoming.push({ name, amount: parseInt(amount), deadline, status });
  });

  const totalPipeline = Object.values(statusCounts).reduce((s, v) => s + v.amount, 0);
  const totalCount = Object.values(statusCounts).reduce((s, v) => s + v.count, 0);
  const applied = statusCounts.applied || { count: 0, amount: 0 };
  const todo = statusCounts.todo || { count: 0, amount: 0 };
  const won = statusCounts.won || { count: 0, amount: 0 };

  return { statusCounts, upcoming, totalPipeline, totalCount, applied, todo, won };
}

function getEmailCampaignData() {
  const db = path.join(HOME, "projects/lead-scraper/db/leads.db");
  const emailLog = readJSON(path.join(HOME, "projects/lead-scraper/db/email-log.json"));

  const totalLeads = parseInt(sql(db, "SELECT COUNT(*) FROM leads;")) || 0;
  const withEmail = parseInt(sql(db, "SELECT COUNT(*) FROM leads WHERE email IS NOT NULL AND email <> '';")) || 0;
  const emailed = parseInt(sql(db, "SELECT COUNT(*) FROM leads WHERE emailed_at IS NOT NULL;")) || 0;
  const followedUp = parseInt(sql(db, "SELECT COUNT(*) FROM leads WHERE follow_up_at IS NOT NULL;")) || 0;

  const sent = emailLog?.sent || [];
  const errors = emailLog?.errors || [];
  const recentSends = sent.slice(-10).reverse();

  return { totalLeads, withEmail, emailed, followedUp, sent: sent.length, errors: errors.length, recentSends };
}

function getGSCData() {
  const tracker = readJSON(path.join(HOME, "tools/gsc/tracker.json"));
  const logDir = path.join(HOME, "tools/gsc/logs");

  let latestLog = null;
  try {
    const files = execSync(`ls -t "${logDir}"/2026-*.log 2>/dev/null`, { encoding: "utf-8" }).trim().split("\n");
    if (files[0]) latestLog = readFile(files[0]);
  } catch {}

  let clicks = 0, impressions = 0, ctr = "0%", position = "0";
  let dailyData = [];
  if (latestLog) {
    const clicksM = latestLog.match(/Clicks:\s*(\d+)/);
    const impM = latestLog.match(/Impressions:\s*(\d+)/);
    const ctrM = latestLog.match(/Avg CTR:\s*([\d.]+%)/);
    const posM = latestLog.match(/Avg Position:\s*([\d.]+)/);
    if (clicksM) clicks = parseInt(clicksM[1]);
    if (impM) impressions = parseInt(impM[1]);
    if (ctrM) ctr = ctrM[1];
    if (posM) position = posM[1];

    const dailyRegex = /(\d{4}-\d{2}-\d{2})\s+(\d+)\s+clicks\s+(\d+)\s+imp/g;
    let m;
    while ((m = dailyRegex.exec(latestLog)) !== null) {
      dailyData.push({ date: m[1], clicks: parseInt(m[2]), impressions: parseInt(m[3]) });
    }
  }

  let healthStatus = null;
  try {
    const files = execSync(`ls -t "${logDir}"/health-*.log 2>/dev/null`, { encoding: "utf-8" }).trim().split("\n");
    if (files[0]) {
      const hLog = readFile(files[0]);
      healthStatus = hLog && hLog.includes("ALL CHECKS PASSED") ? "PASS" : "FAIL";
    }
  } catch {}

  return { tracker, clicks, impressions, ctr, position, dailyData, healthStatus };
}

function getSchoolData() {
  const grad = readFile(path.join(HOME, "classpilot/graduation.md"));
  const completedMatch = grad ? grad.match(/## Completed Courses \((\d+)\)/) : null;
  const completedCount = completedMatch ? parseInt(completedMatch[1]) : 0;
  const currentMatch = grad ? grad.match(/\*\*(\w+-\d+)\*\*\s*—\s*(.+?)\s*\(Topic (\d+) of (\d+)\)/) : null;

  const totalEstimated = 40;
  const graduationDate = "2027-04-30";
  const daysUntilGrad = Math.ceil((new Date(graduationDate) - new Date()) / 86400000);

  return {
    completedCourses: completedCount,
    totalEstimated,
    currentCourse: currentMatch ? {
      code: currentMatch[1],
      name: currentMatch[2],
      currentTopic: parseInt(currentMatch[3]),
      totalTopics: parseInt(currentMatch[4]),
    } : null,
    graduationDate,
    daysUntilGrad,
    gpa: "3.87",
  };
}

function getGlobalHeatmap(items) {
  const combined = {};
  items.forEach((item) => {
    if (item.path) {
      const hm = getGitHeatmap(item.path);
      Object.entries(hm).forEach(([date, count]) => {
        combined[date] = (combined[date] || 0) + count;
      });
    }
  });
  return combined;
}

function calcHealthScore(project) {
  let score = 100;
  const now = new Date();
  if (project.nextCheckIn && new Date(project.nextCheckIn) < now) {
    const daysPast = Math.floor((now - new Date(project.nextCheckIn)) / 86400000);
    score -= Math.min(30, daysPast * 5);
  }
  if (project.lastCommit) {
    const daysSince = Math.floor((now - new Date(project.lastCommit.date)) / 86400000);
    if (daysSince > 30) score -= 25;
    else if (daysSince > 14) score -= 15;
    else if (daysSince > 7) score -= 5;
  } else {
    score -= 10;
  }
  if (project.status === "paused") score -= 10;
  if (project.status === "blocked") score -= 20;
  return Math.max(0, Math.min(100, score));
}

function getBlogStats() {
  const stats = [];
  // LessonDraft blog posts
  try {
    const ldBlog = readFile(path.join(HOME, "projects/LessonDraft/lib/blog.ts"));
    if (ldBlog) {
      const slugMatches = ldBlog.match(/slug:/g);
      stats.push({ site: "LessonDraft", url: "lessondraft.com", count: slugMatches ? slugMatches.length : 0 });
    } else {
      stats.push({ site: "LessonDraft", url: "lessondraft.com", count: 578 });
    }
  } catch { stats.push({ site: "LessonDraft", url: "lessondraft.com", count: 578 }); }
  // BuiltSimple blog posts
  try {
    const bsBlog = readFile(path.join(HOME, "projects/portfolio/app/blog/posts.ts"));
    if (bsBlog) {
      const slugMatches = bsBlog.match(/slug:/g);
      stats.push({ site: "BuiltSimple", url: "builtsimple.dev", count: slugMatches ? slugMatches.length : 0 });
    } else {
      stats.push({ site: "BuiltSimple", url: "builtsimple.dev", count: 156 });
    }
  } catch { stats.push({ site: "BuiltSimple", url: "builtsimple.dev", count: 156 }); }
  return stats;
}

function getWeeklySummary(heatmap, emailCampaign, scholarships) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEnd = new Date(now);

  // Commits this week from heatmap
  let commitsThisWeek = 0;
  Object.entries(heatmap).forEach(([date, count]) => {
    const d = new Date(date + "T12:00:00");
    if (d >= weekAgo && d <= weekEnd) commitsThisWeek += count;
  });

  // Emails sent this week
  const emailsSentThisWeek = (emailCampaign.recentSends || []).filter((s) => {
    const d = new Date(s.sentAt);
    return d >= weekAgo && d <= weekEnd;
  }).length;

  // Scholarships with deadlines this week
  const deadlinesThisWeek = (scholarships.upcoming || []).filter((s) => {
    const d = new Date(s.deadline + "T12:00:00");
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return d >= now && d <= nextWeek;
  });

  return { commitsThisWeek, emailsSentThisWeek, deadlinesThisWeek };
}

function getSEOToolsData() {
  // Rank tracker — latest entry from rank-history.json
  const rankHistory = readJSON(path.join(HOME, "tools/gsc/rank-history.json"));
  const rankTracker = rankHistory?.history?.length
    ? rankHistory.history[rankHistory.history.length - 1]
    : null;

  // Sitemap health — summary from sitemap-health.json
  const sitemapRaw = readJSON(path.join(HOME, "tools/gsc/sitemap-health.json"));
  const sitemapHealth = sitemapRaw
    ? {
        lastRun: sitemapRaw.lastRun,
        totalSitemapUrls: sitemapRaw.totalSitemapUrls,
        summary: sitemapRaw.summary || null,
      }
    : null;

  // AI recommendation tracking — latest entry from ai-rec-history.json
  const aiRecHistory = readJSON(path.join(HOME, "tools/ai-rec-history.json"));
  const aiRecommendations = aiRecHistory?.history?.length
    ? aiRecHistory.history[aiRecHistory.history.length - 1]
    : null;

  return { rankTracker, sitemapHealth, aiRecommendations };
}

function getMonthlyCosts() {
  // Default costs — user can override in localStorage on the frontend
  return [
    { name: "Vercel Pro", amount: 20 },
    { name: "Supabase", amount: 0 },
    { name: "Clerk", amount: 0 },
    { name: "Anthropic API", amount: 10 },
    { name: "Domain: lessondraft.com", amount: 1.50 },
    { name: "Domain: builtsimple.dev", amount: 1 },
  ];
}

// ── Main ──
const trackerData = readJSON(path.join(HOME, "tools/tracker/data.json"));
const ideasContent = readFile(path.join(HOME, "ideas/IDEAS.md"));
const activityContent = readFile(path.join(HOME, "tools/tracker/activity.log"));

const projects = (trackerData?.items || []).map((item) => {
  const gitInfo = item.path ? getGitLastCommit(item.path) : null;
  const gitStats = item.path ? getGitStats(item.path) : null;
  const statusSummary = item.path ? readStatusMd(item.path) : null;
  const p = { ...item, lastCommit: gitInfo, gitStats, statusSummary };
  p.healthScore = calcHealthScore(p);
  return p;
});

const agents = [
  { label: "com.lessondraft.social", name: "LessonDraft Social", schedule: "8am, 1:30pm, 6pm", logPath: `${HOME}/projects/lessondraft-social/logs/launchd_stdout.log` },
  { label: "com.jacobcascone.scholarship-alerts", name: "Scholarship Alerts", schedule: "9am daily", logPath: `${HOME}/scholarships/logs/alerts.log` },
  { label: "com.tradovate.bot", name: "Tradovate Bot", schedule: "Always on", logPath: `${HOME}/projects/tradovate-mcp/logs/bot_stdout.log` },
  { label: "com.atlas.recorder", name: "Atlas Recorder", schedule: "Always on", logPath: `/tmp/atlas-recorder.log` },
  { label: "com.builtsimple.email-sender", name: "Email Sender", schedule: "9:03am", logPath: `${HOME}/projects/lead-scraper/logs/send.log` },
  { label: "com.builtsimple.follow-up", name: "Follow-Up", schedule: "2:07pm", logPath: `${HOME}/projects/lead-scraper/logs/follow-up.log` },
  { label: "com.lessondraft.gsc-check", name: "GSC Check", schedule: "9am daily", logPath: `${HOME}/tools/gsc/logs/launchd-stdout.log` },
  { label: "com.lessondraft.weekly-health", name: "SEO Health", schedule: "Mon 10am", logPath: `${HOME}/tools/gsc/logs/launchd-health-stdout.log` },
  { label: "com.lessondraft.rank-tracker", name: "Rank Tracker", schedule: "8am daily", logPath: `${HOME}/tools/gsc/logs/rank-tracker.log` },
  { label: "com.lessondraft.sitemap-health", name: "Sitemap Health", schedule: "Wed 10:30am", logPath: `${HOME}/tools/gsc/logs/sitemap-health.log` },
  { label: "com.tracker.digest", name: "Tracker Digest", schedule: "7am daily", logPath: null },
  { label: "com.commandcenter.update", name: "Dashboard Update", schedule: "7:30am, 7:30pm", logPath: `${HOME}/projects/command-center/logs/update.log` },
];

const agentStatuses = agents.map((agent) => ({
  ...agent,
  ...getLaunchAgentStatus(agent.label),
  recentLog: agent.logPath ? getAgentLog(agent.logPath, 25) : null,
}));

const heatmap = getGlobalHeatmap(trackerData?.items || []);
const scholarships = getScholarshipData();
const emailCampaign = getEmailCampaignData();
const gsc = getGSCData();
const school = getSchoolData();
const ideas = parseIdeas(ideasContent);
const activity = parseActivityLog(activityContent);
const blogStats = getBlogStats();
const monthlyCosts = getMonthlyCosts();
const seoTools = getSEOToolsData();
const weeklySummary = getWeeklySummary(heatmap, emailCampaign, scholarships);

const activeProjects = projects.filter((p) => p.status === "active" && p.type === "project").length;
const pausedProjects = projects.filter((p) => p.status === "paused").length;
const activeAutomations = projects.filter((p) => p.status === "active" && p.type === "automation").length;
const healthyAgents = agentStatuses.filter((a) => a.healthy !== false).length;
const avgHealth = Math.round(projects.filter(p => p.status === "active").reduce((s, p) => s + p.healthScore, 0) / Math.max(1, projects.filter(p => p.status === "active").length));

const dashboard = {
  generatedAt: new Date().toISOString(),
  stats: { activeProjects, pausedProjects, activeAutomations, healthyAgents, totalAgents: agents.length, ideasCount: ideas.length, avgHealthScore: avgHealth },
  projects,
  agents: agentStatuses,
  heatmap,
  scholarships,
  emailCampaign,
  gsc,
  school,
  ideas,
  activity,
  tasks: trackerData?.tasks || [],
  blogStats,
  monthlyCosts,
  seoTools,
  weeklySummary,
};

const outPath = path.join(__dirname, "..", "src", "data", "dashboard-data.json");
fs.writeFileSync(outPath, JSON.stringify(dashboard, null, 2));
console.log(`Dashboard data generated`);
console.log(`  ${activeProjects} active | ${activeAutomations} automations | ${healthyAgents}/${agents.length} agents`);
console.log(`  ${scholarships.totalCount} scholarships ($${(scholarships.totalPipeline/1000).toFixed(0)}K) | ${emailCampaign.sent} emails | ${school.completedCourses} courses`);
