#!/bin/bash
# Deploy spoke-calc to ScenicRoutesFM server
# Usage: ./deploy.sh [--build]

set -e

SERVER="ScenicRoutesFM"
DEPLOY_PATH="/opt/spoke-calc"

echo "Deploying spoke-calc..."

# Push any local changes first
if [[ -n $(git status --porcelain) ]]; then
    echo "You have uncommitted changes. Commit them first:"
    git status --short
    exit 1
fi

echo "Pushing to GitHub..."
git push origin main

# Deploy on server
echo "Deploying on server..."
if [[ "$1" == "--build" ]]; then
    ssh $SERVER "cd $DEPLOY_PATH && git pull && docker compose build --no-cache && docker compose up -d"
else
    ssh $SERVER "cd $DEPLOY_PATH && git pull && docker compose up -d --build"
fi

echo "Done! Site: https://spokecalc.i.scenicroutes.fm"
