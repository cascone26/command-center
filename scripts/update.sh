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
# Use portable ERE (grep -Eo); BSD/macOS grep lacks -P (Perl). `|| true` keeps a
# no-match from poisoning the exit status with grep's exit 1.
DEPLOY_URL=$(~/.npm-global/bin/vercel --prod --yes 2>&1 | grep -Eo 'https://command-center-[a-z0-9]+-cascone26s-projects\.vercel\.app' || true)
echo "Deployed: $DEPLOY_URL"

if [ -n "$DEPLOY_URL" ]; then
  echo "Aliasing to commandcenter-jc.vercel.app..."
  ~/.npm-global/bin/vercel alias set "$DEPLOY_URL" commandcenter-jc.vercel.app 2>&1 | tail -1
fi

echo "Done."
# Guarantee a clean exit so the daemon's exec wrapper doesn't surface the last
# pipeline's status as a spurious "Command failed with exit code 1".
exit 0
