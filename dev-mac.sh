#!/usr/bin/env zsh
# Void Development Environment Startup Script
# Purpose: Configure Node.js environment, start watch modes, and launch Void app

echo "========================================"
echo "  Void Dev Environment Startup"
echo "========================================"
echo ""

# Step 1: Verify Node.js version
echo "[1/4] Verifying Node.js version..."
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

# Step 2: Check dependencies
echo "[2/4] Checking node_modules..."
if [[ ! -d "node_modules" ]]; then
    echo "Installing dependencies..."
    npm install
    if [[ $? -ne 0 ]]; then
        echo "Error: npm install failed"
        exit 1
    fi
fi
echo "Success: Dependencies ready"
echo ""

# Step 3: Start watch modes in background terminals
echo "[3/4] Starting watch modes..."
echo ""

# Start npm run watch in background
echo "Starting TypeScript watch (npm run watch)..."
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'\" && npm run watch"' 2>/dev/null || \
    (npm run watch &>/tmp/void-watch.log & echo "TypeScript watch started (PID: $!, log: /tmp/void-watch.log)")

sleep 2

# Start npm run watchreact in background
echo "Starting React watch (npm run watchreact)..."
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'\" && npm run watchreact"' 2>/dev/null || \
    (npm run watchreact &>/tmp/void-watchreact.log & echo "React watch started (PID: $!, log: /tmp/void-watchreact.log)")

sleep 2

echo ""
echo "Success: Watch modes started"
echo ""

# Step 4: Launch Void application
echo "[4/4] Launching Void application..."
echo "Tip: Press Cmd+R in Void to reload after code changes"
echo ""

#./scripts/code.sh
