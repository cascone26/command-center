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
DEPLOY_URL=$(~/.npm-global/bin/vercel --prod --yes 2>&1 | grep -oP 'https://command-center-[a-z0-9]+-cascone26s-projects\.vercel\.app')
echo "Deployed: $DEPLOY_URL"

if [ -n "$DEPLOY_URL" ]; then
  echo "Aliasing to commandcenter-jc.vercel.app..."
  ~/.npm-global/bin/vercel alias set "$DEPLOY_URL" commandcenter-jc.vercel.app 2>&1 | tail -1
fi

echo "Done."
