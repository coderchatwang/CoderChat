#!/usr/bin/env zsh

# Void Dependency Installation Script
# Purpose: Configure Node.js environment and install dependencies

echo "========================================"
echo "  Void Dependency Installation"
echo "========================================"
echo ""

# Step 1: Verify Node.js version
echo "[1/3] Verifying Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null)
if [[ $? -ne 0 ]]; then
    echo "Error: Node.js not found. Please install Node.js v22.18.0 via 'sudo n 22.18.0'"
    exit 1
fi

REQUIRED="v22.18.0"
if [[ "$NODE_VERSION" != "$REQUIRED" ]]; then
    echo "Warning: Current Node.js is $NODE_VERSION, expected $REQUIRED"
    echo "Switching to Node.js $REQUIRED via n..."
    sudo n 22.18.0
    if [[ $? -ne 0 ]]; then
        echo "Error: Node.js version switch failed"
        exit 1
    fi
fi

NODE_VERSION=$(node --version)
echo "Success: Current Node.js version: $NODE_VERSION"
echo ""

# Step 2: Install dependencies
echo "[2/2] Installing dependencies..."
echo ""

npm install
if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Dependency installation failed"
    exit 1
fi

echo ""
echo "========================================"
echo "  Installation completed successfully!"
echo "========================================"
