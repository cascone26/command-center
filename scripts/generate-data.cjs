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

function parsePlistSchedule(plistJson) {
  try {
    if (plistJson.StartCalendarInterval) {
      const s = Array.isArray(plistJson.StartCalendarInterval)
        ? plistJson.StartCalendarInterval
        : [plistJson.StartCalendarInterval];
      return s.map(t => {
        const h = t.Hour !== undefined ? t.Hour : null;
        const m = t.Minute !== undefined ? t.Minute : 0;
        if (h === null) return "scheduled";
        const ampm = h >= 12 ? "pm" : "am";
        const hr = h % 12 || 12;
        return `${hr}:${String(m).padStart(2, "0")}${ampm}`;
      }).join(", ");
    }
    if (plistJson.StartInterval) {
      const sec = plistJson.StartInterval;
      if (sec < 120) return `every ${sec}s`;
      if (sec < 3600) return `every ${Math.round(sec/60)}m`;
      return `every ${Math.round(sec/3600)}h`;
    }
    if (plistJson.KeepAlive || plistJson.RunAtLoad) return "Always on";
    return "on demand";
  } catch { return "scheduled"; }
}

function labelToName(label) {
  const parts = label.split(".");
  const slug = parts.slice(2).join("-") || parts[parts.length - 1];
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function discoverLaunchAgents() {
  const laDir = `${HOME}/Library/LaunchAgents`;
  const skip = ["com.apple.", "com.google."];
  let files;
  try {
    files = fs.readdirSync(laDir).filter(f => f.endsWith(".plist") && !skip.some(s => f.startsWith(s)));
  } catch { return []; }

  return files.map(f => {
    const label = f.replace(".plist", "");
    let logPath = null;
    let schedule = "scheduled";
    try {
      const json = JSON.parse(execSync(`plutil -convert json -o - "${laDir}/${f}" 2>/dev/null`, { encoding: "utf-8" }));
      logPath = json.StandardOutPath || json.StandardErrorPath || null;
      schedule = parsePlistSchedule(json);
    } catch { /* use defaults */ }
    return { label, name: labelToName(label), schedule, logPath };
  });
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

  // Parse completed count
  const completedMatch = grad ? grad.match(/## Completed Courses \((\d+)\)/) : null;
  const completedCount = completedMatch ? parseInt(completedMatch[1]) : 12;

  // Parse scheduled count
  const scheduledMatch = grad ? grad.match(/## Scheduled \((\d+)/) : null;
  const scheduledCount = scheduledMatch ? parseInt(scheduledMatch[1]) : 10;

  // Parse current course — format: **CODE** — Name | ... | **X topics** | Topic Y of Z
  const currentMatch = grad ? grad.match(/\*\*(\w+-\w+)\*\*\s*—\s*(.+?)\s*\|[^|]*\|[^|]*\|[^|]*\|\s*\*\*(\d+)\s*topics\*\*\s*\|\s*Topic\s*(\d+)\s*of\s*(\d+)/) : null;

  // Parse credits and GPA
  const creditsMatch = grad ? grad.match(/Credits Completed:\*\*\s*(\d+)/) : null;
  const gpaMatch = grad ? grad.match(/GPA:\*\*\s*([\d.]+)/) : null;
  const completionMatch = grad ? grad.match(/Completion:\*\*\s*(\d+)%/) : null;

  const totalCourses = completedCount + 1 + scheduledCount; // completed + current + scheduled
  const credits = creditsMatch ? parseInt(creditsMatch[1]) : 48;
  const gpa = gpaMatch ? gpaMatch[1] : "3.87";
  const completion = completionMatch ? parseInt(completionMatch[1]) : 63;

  const graduationDate = "2027-04-18";
  const daysUntilGrad = Math.ceil((new Date(graduationDate) - new Date()) / 86400000);

  // Calculate current topic from course dates if not parsed from file
  let currentCourse = null;
  if (currentMatch) {
    currentCourse = {
      code: currentMatch[1],
      name: currentMatch[2].trim(),
      currentTopic: parseInt(currentMatch[4]),
      totalTopics: parseInt(currentMatch[5]),
    };
  } else {
    // Fallback: ELM-470, 1/26-3/22/2026, 8 topics, calculate from date
    const start = new Date("2026-01-26");
    const now = new Date();
    const weekNum = Math.min(8, Math.max(1, Math.ceil((now - start) / (7 * 86400000))));
    currentCourse = {
      code: "ELM-470",
      name: "Methods and Strategies for Teaching Mathematics",
      currentTopic: weekNum,
      totalTopics: 8,
    };
  }

  // Upcoming scheduled courses
  const scheduled = [];
  const schedBlock = grad ? grad.match(/## Scheduled[\s\S]*?(?=##|$)/) : null;
  if (schedBlock) {
    const lines = schedBlock[0].split("\n");
    for (const line of lines) {
      const m = line.match(/^\d+\.\s*(\w+-\w+)\s*—\s*(.+?)\s*\|\s*(\d+\/\d+[\/-]\d+\/\d+\/\d+)\s*\|\s*(\d+)cr/);
      if (m) {
        scheduled.push({ code: m[1], name: m[2].trim(), dates: m[3], credits: parseInt(m[4]), doubled: line.includes("doubled") || line.includes("overlaps") });
      }
    }
  }

  return {
    completedCourses: completedCount,
    totalCourses,
    credits,
    completion,
    currentCourse,
    scheduled,
    graduationDate,
    daysUntilGrad,
    gpa,
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

function getRevenueStreams() {
  const content = readFile(path.join(HOME, "REVENUE.md"));
  const streams = [];
  if (!content) return { streams, totalMRR: 0, totalCosts: 0, netProfit: 0, activeCount: 0 };

  let currentStatus = "active"; // active | building | dormant
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.startsWith("## Active Streams")) currentStatus = "active";
    else if (line.startsWith("## Building Streams")) currentStatus = "building";
    else if (line.startsWith("## Dormant Streams")) currentStatus = "dormant";
    else if (line.startsWith("## Cost Structure") || line.startsWith("## Monthly Snapshot") || line.startsWith("## Tracking")) currentStatus = "meta";
    else if (line.startsWith("### ") && currentStatus !== "meta") {
      const nameMatch = line.match(/###\s*\d+\.\s*(.+?)(?:\s*—\s*(.+))?$/);
      if (nameMatch) {
        streams.push({
          name: nameMatch[1].trim(),
          url: nameMatch[2] ? nameMatch[2].trim() : null,
          status: currentStatus,
          mrr: 0,
          potential: "",
          nextAction: "",
        });
      }
    } else if (streams.length > 0 && currentStatus !== "meta") {
      const last = streams[streams.length - 1];
      const mrrMatch = line.match(/\*\*Current(?:\s+MRR)?:\*\*\s*\$(\d+)/);
      const potentialMatch = line.match(/\*\*Potential:\*\*\s*(.+)/);
      const nextMatch = line.match(/\*\*Next action:\*\*\s*(.+)/);
      if (mrrMatch) last.mrr = parseInt(mrrMatch[1]);
      if (potentialMatch) last.potential = potentialMatch[1].trim();
      if (nextMatch) last.nextAction = nextMatch[1].trim();
    }
  }

  // Parse cost structure and monthly snapshot
  let totalCosts = 20; // default
  const costMatch = content.match(/\| \*\*Total\*\*\s*\|\s*\*\*\$(\d+)/);
  if (costMatch) totalCosts = parseInt(costMatch[1]);

  // Parse monthly snapshot
  let monthlyRevenue = 0;
  const snapshotRegex = /\|\s*\w+\s+\d{4}\s*\|\s*\$(\d+)/g;
  let sm;
  while ((sm = snapshotRegex.exec(content)) !== null) {
    monthlyRevenue = parseInt(sm[1]);
  }

  // Also pull from billing history.json if available
  const history = readJSON(path.join(HOME, "tools/billing/history.json"));
  if (history) {
    const months = Object.keys(history).sort();
    if (months.length > 0) {
      const latest = history[months[months.length - 1]];
      if (latest.revenue !== undefined) monthlyRevenue = latest.revenue;
      if (latest.costs !== undefined) totalCosts = latest.costs;
    }
  }

  const totalMRR = streams.reduce((s, st) => s + st.mrr, 0);
  const netProfit = monthlyRevenue - totalCosts;
  const activeCount = streams.filter((s) => s.status === "active").length;

  return { streams, totalMRR, totalCosts, monthlyRevenue, netProfit, activeCount };
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

function getMoneyTrackerData() {
  const now = new Date().toISOString();

  // ── Check local Docker containers (Mac) ──
  function checkDockerContainer(name) {
    try {
      const result = execSync(`docker ps --filter "name=${name}" --format "{{.Status}}" 2>/dev/null`, { encoding: "utf-8" }).trim();
      return result ? "running" : "stopped";
    } catch { return "stopped"; }
  }

  // ── Check native process (Mac) ──
  function checkProcess(name) {
    try {
      const result = execSync(`pgrep -f "${name}" 2>/dev/null`, { encoding: "utf-8" }).trim();
      return result ? "running" : "stopped";
    } catch { return "stopped"; }
  }

  // ── Check HP Docker containers via SSH ──
  function checkHPDocker(name) {
    try {
      const result = execSync(
        `ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no coboc@100.105.16.66 "docker ps --filter name=${name} --format \\"{{.Status}}\\"" 2>/dev/null`,
        { encoding: "utf-8", timeout: 8000 }
      ).trim();
      return result ? "running" : "stopped";
    } catch { return "stopped"; }
  }

  // Check all passive services
  const passiveServices = [
    {
      name: "Honeygain",
      device: "Mac",
      status: checkProcess("honeygain"),
      estMonthlyLow: 10, estMonthlyHigh: 20,
      totalEarned: 0, lastCheck: now, containerType: "native",
    },
    {
      name: "EarnApp",
      device: "Mac",
      status: checkProcess("earnapp"),
      estMonthlyLow: 5, estMonthlyHigh: 10,
      totalEarned: 0, lastCheck: now, containerType: "native",
    },
    {
      name: "MystNodes",
      device: "Mac",
      status: checkDockerContainer("myst"),
      estMonthlyLow: 5, estMonthlyHigh: 20,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "MystNodes",
      device: "HP",
      status: checkHPDocker("myst"),
      estMonthlyLow: 5, estMonthlyHigh: 20,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "Repocket",
      device: "Mac",
      status: checkDockerContainer("repocket"),
      estMonthlyLow: 5, estMonthlyHigh: 10,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "Repocket",
      device: "HP",
      status: checkHPDocker("repocket"),
      estMonthlyLow: 5, estMonthlyHigh: 10,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "TraffMonetizer",
      device: "Mac",
      status: checkDockerContainer("traffmonetizer"),
      estMonthlyLow: 2, estMonthlyHigh: 5,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "TraffMonetizer",
      device: "HP",
      status: checkHPDocker("traffmonetizer"),
      estMonthlyLow: 2, estMonthlyHigh: 5,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "Pawns/IPRoyal",
      device: "Mac",
      status: checkDockerContainer("pawns"),
      estMonthlyLow: 5, estMonthlyHigh: 10,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
    {
      name: "Pawns/IPRoyal",
      device: "HP",
      status: checkHPDocker("pawns"),
      estMonthlyLow: 5, estMonthlyHigh: 10,
      totalEarned: 0, lastCheck: now, containerType: "docker",
    },
  ];

  // ── Load persisted earnings from money-tracker.json ──
  const earningsFile = path.join(HOME, "tools/money-tracker.json");
  const earnings = readJSON(earningsFile);
  if (earnings && earnings.services) {
    for (const svc of passiveServices) {
      const key = `${svc.name}-${svc.device}`;
      if (earnings.services[key]) {
        svc.totalEarned = earnings.services[key].totalEarned || 0;
      }
    }
  }

  // ── Gumroad ──
  const gumroadData = readJSON(path.join(HOME, "projects/gumroad-autoposter/data/status.json"));
  const gumroad = {
    totalProducts: gumroadData?.totalProducts || 0,
    productsThisWeek: gumroadData?.productsThisWeek || 0,
    totalRevenue: gumroadData?.totalRevenue || 0,
    autoposterStatus: "stopped",
    nextScheduledRun: gumroadData?.nextRun || "",
  };
  // Check if gumroad autoposter LaunchAgent is running
  const gumroadAgent = getLaunchAgentStatus("com.gumroad.autoposter");
  if (gumroadAgent.loaded) gumroad.autoposterStatus = "running";

  // ── Apify ──
  const apifyData = readJSON(path.join(HOME, "tools/apify-stats.json"));
  const apify = {
    actorsPublished: apifyData?.actorsPublished || 0,
    totalRuns: apifyData?.totalRuns || 0,
    storeRevenue: apifyData?.storeRevenue || 0,
  };

  // ── LessonDraft ──
  const ldData = readJSON(path.join(HOME, "tools/lessondraft-metrics.json"));
  const lessonDraft = {
    mrr: ldData?.mrr || 0,
    subscribers: ldData?.subscribers || 0,
    trafficThisWeek: ldData?.trafficThisWeek || 0,
  };

  // ── Other Income ──
  const otherData = readJSON(path.join(HOME, "tools/other-income.json"));
  const otherIncome = {
    tutoring: otherData?.tutoring || 0,
    jobs: otherData?.jobs || [
      { name: "Regina Caeli", monthly: 800 },
      { name: "Visitation", monthly: 600 },
      { name: "Main Event", monthly: 400 },
    ],
    dealScout: otherData?.dealScout || 0,
  };

  // ── Daily Trend (generate from earnings log or use placeholders) ──
  const trendFile = readJSON(path.join(HOME, "tools/money-trend.json"));
  let dailyTrend = [];
  if (trendFile && trendFile.days) {
    dailyTrend = trendFile.days.slice(-14);
  } else {
    // Generate 14 days of placeholder data based on passive estimates
    const runningCount = passiveServices.filter((s) => s.status === "running").length;
    const dailyEst = runningCount * 0.25; // rough daily estimate per service
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      // Add some variance
      const variance = 0.5 + Math.random();
      dailyTrend.push({ date: dateStr, amount: parseFloat((dailyEst * variance).toFixed(2)) });
    }
  }

  return { passiveServices, gumroad, apify, lessonDraft, otherIncome, dailyTrend };
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

// Hardcoded overrides: custom names, schedules, and log paths for known agents
const agentOverrides = {
  "com.lessondraft.social":            { name: "LessonDraft Social",    schedule: "8am, 1:30pm, 6pm", logPath: `${HOME}/projects/lessondraft-social/logs/launchd_stdout.log` },
  "com.jacobcascone.scholarship-alerts":{ name: "Scholarship Alerts",   schedule: "9am daily",         logPath: `${HOME}/scholarships/logs/alerts.log` },
  "com.tradovate.bot":                 { name: "Tradovate Bot",         schedule: "Always on",         logPath: `${HOME}/projects/tradovate-mcp/logs/bot_stdout.log` },
  "com.atlas.recorder":                { name: "Atlas Recorder",        schedule: "Always on",         logPath: `/tmp/atlas-recorder.log` },
  "com.builtsimple.email-sender":      { name: "Email Sender",          schedule: "9:03am",            logPath: `${HOME}/projects/lead-scraper/logs/send.log` },
  "com.builtsimple.follow-up":         { name: "Follow-Up",             schedule: "2:07pm",            logPath: `${HOME}/projects/lead-scraper/logs/follow-up.log` },
  "com.lessondraft.gsc-check":         { name: "GSC Check",             schedule: "9am daily",         logPath: `${HOME}/tools/gsc/logs/launchd-stdout.log` },
  "com.lessondraft.weekly-health":     { name: "SEO Health",            schedule: "Mon 10am",          logPath: `${HOME}/tools/gsc/logs/launchd-health-stdout.log` },
  "com.lessondraft.watchdog":          { name: "Watchdog",              schedule: "11am daily",        logPath: `${HOME}/tools/watchdog.log` },
  "com.lessondraft.rank-tracker":      { name: "Rank Tracker",          schedule: "8am daily",         logPath: `${HOME}/tools/gsc/logs/rank-tracker.log` },
  "com.lessondraft.sitemap-health":    { name: "Sitemap Health",        schedule: "Wed 10:30am",       logPath: `${HOME}/tools/gsc/logs/sitemap-health.log` },
  "com.tracker.digest":                { name: "Tracker Digest",        schedule: "7am daily",         logPath: null },
  "com.commandcenter.update":          { name: "Dashboard Update",      schedule: "7:30am, 7:30pm",    logPath: `${HOME}/projects/command-center/logs/update.log` },
  "com.bandwidth.smart":               { name: "Bandwidth Smart",        schedule: "every 30m",         logPath: null },
  "com.cobo.council":                  { name: "Council Agent",          schedule: "Always on",         logPath: `${HOME}/cobo/logs/council.log` },
  "com.cobo.daemon":                   { name: "COBO Daemon",            schedule: "Always on",         logPath: `${HOME}/cobo/logs/daemon.log` },
  "com.cobo.mac-agent":                { name: "Mac Agent",              schedule: "Always on",         logPath: `${HOME}/cobo/logs/mac-agent.log` },
  "com.cobo.ollama-watchdog":          { name: "Ollama Watchdog",        schedule: "every 5m",          logPath: `${HOME}/cobo/logs/ollama-watchdog.log` },
  "com.lessondraft.claude-proxy":      { name: "Claude Proxy",           schedule: "Always on",         logPath: `${HOME}/projects/LessonDraft/logs/proxy.log` },
  "com.lessondraft.proxy-watchdog":    { name: "Proxy Watchdog",         schedule: "every 60s",         logPath: `${HOME}/projects/LessonDraft/logs/proxy-watchdog.log` },
  "com.lessondraft.seo-health":        { name: "SEO Health (LD)",        schedule: "7am daily",         logPath: `${HOME}/tools/gsc/logs/seo-health.log` },
  "com.dealscout.plist":               { name: "Deal Scout",             schedule: "5x daily",          logPath: `${HOME}/projects/deal-scout/logs/scout.log` },
};

// Dynamically discover all LaunchAgents, merge with overrides
const discovered = discoverLaunchAgents();
const agents = discovered.map(a => ({ ...a, ...(agentOverrides[a.label] || {}) }));

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
const revenue = getRevenueStreams();
const seoTools = getSEOToolsData();
const weeklySummary = getWeeklySummary(heatmap, emailCampaign, scholarships);
const projectHealth = readJSON(path.join(HOME, "tools/healthcheck/results.json"));
const moneyTracker = getMoneyTrackerData();

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
  revenue,
  seoTools,
  weeklySummary,
  projectHealth,
  moneyTracker,
};

const outPath = path.join(__dirname, "..", "src", "data", "dashboard-data.json");
fs.writeFileSync(outPath, JSON.stringify(dashboard, null, 2));
console.log(`Dashboard data generated`);
console.log(`  ${activeProjects} active | ${activeAutomations} automations | ${healthyAgents}/${agents.length} agents`);
console.log(`  ${scholarships.totalCount} scholarships ($${(scholarships.totalPipeline/1000).toFixed(0)}K) | ${emailCampaign.sent} emails | ${school.completedCourses} courses`);
const runningPassive = moneyTracker.passiveServices.filter(s => s.status === "running").length;
console.log(`  ${runningPassive}/${moneyTracker.passiveServices.length} passive services running`);
