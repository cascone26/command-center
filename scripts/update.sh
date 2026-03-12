#!/bin/bash
# Regenerate dashboard data from all sources and redeploy
cd "$(dirname "$0")/.."

echo "Regenerating dashboard data..."
node scripts/generate-data.cjs

# Check if data actually changed
if git diff --quiet src/data/dashboard-data.json 2>/dev/null; then
  echo "No changes to dashboard data."
  exit 0
fi

echo "Data changed, committing and pushing..."
git add src/data/dashboard-data.json
git commit -m "Update dashboard data $(date +%Y-%m-%d_%H:%M)"
git push origin main

echo "Deploying to Vercel..."
~/.npm-global/bin/vercel --prod --yes 2>&1 | tail -3

echo "Done."
