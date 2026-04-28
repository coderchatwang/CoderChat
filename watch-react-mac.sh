#!/usr/bin/env zsh
# Void React Watch Script
# Purpose: Start React watch mode for development

echo "========================================"
echo "  Void React Watch"
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

# Step 2: Check dependencies
echo "[2/3] Checking node_modules..."
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

# Step 3: Start React watch
echo "[3/3] Starting React watch..."
echo "Press Ctrl+C to stop"
echo ""

npm run watchreact
