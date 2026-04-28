#!/usr/bin/env zsh
# Void Development Environment Startup Script
# Purpose: Sync React build output and launch Void app

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

# Step 2: Sync React build output to correct location
echo "[2/3] Syncing React build output..."

REACT_OUT_SRC="src/vs/workbench/contrib/void/browser/react/out"
REACT_OUT_DEST="out/vs/workbench/contrib/void/browser/react/out"

# Create destination directory if it doesn't exist
mkdir -p "$REACT_OUT_DEST"

# Sync all React modules
react_modules=("sidebar-tsx" "void-editor-widgets-tsx" "void-settings-tsx" "void-tooltip" "void-onboarding" "quick-edit-tsx" "diff")
for module in "${react_modules[@]}"; do
    src_path="$REACT_OUT_SRC/$module"
    dest_path="$REACT_OUT_DEST/$module"
    if [[ -d "$src_path" ]]; then
        mkdir -p "$dest_path"
        cp -rf "$src_path/." "$dest_path/"
        echo "  Synced $module"
    else
        echo "  Warning: $src_path not found, skipping"
    fi
done

echo "Success: React output synced"
echo ""

# Step 3: Launch Void application
echo "[3/3] Launching Void application..."
echo "Tip: Press Cmd+R in Void to reload after code changes"
echo ""

./scripts/code.sh
