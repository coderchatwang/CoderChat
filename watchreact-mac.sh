#!/usr/bin/env zsh
# Void Development Environment Startup Script
# Purpose: Start React watch mode and launch Void app

echo "========================================"
echo "  Void Dev Environment Startup"
echo "========================================"
echo ""

# Step 1: Verify Node.js version
echo "[1/3] Verifying Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null)
if [[ $? -ne 0 ]]; then
    echo "Error: Node.js not found. Please install Node.js v20.18.2 via 'sudo n 20.18.2'"
    exit 1
fi

REQUIRED="v20.18.2"
if [[ "$NODE_VERSION" != "$REQUIRED" ]]; then
    echo "Warning: Current Node.js is $NODE_VERSION, expected $REQUIRED"
    echo "Switching to Node.js $REQUIRED via n..."
    sudo n 20.18.2
    if [[ $? -ne 0 ]]; then
        echo "Error: Node.js version switch failed"
        exit 1
    fi
fi

NODE_VERSION=$(node --version)
echo "Success: Current Node.js version: $NODE_VERSION"
echo ""

# Step 2: Start React watch in a new Terminal window
echo "[2/3] Starting React watch (npm run watchreact)..."
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'\" && npm run watchreact"' 2>/dev/null || \
    (npm run watchreact &>/tmp/void-watchreact.log & echo "React watch started (PID: $!, log: /tmp/void-watchreact.log)")

sleep 2

echo "Success: React watch started"
echo ""

# Step 3: Launch Void application
echo "[3/3] Launching Void application..."
echo "Tip: Press Cmd+R in Void to reload after code changes"
echo ""

./scripts/code.sh
