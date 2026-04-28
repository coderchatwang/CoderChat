#!/usr/bin/env zsh
# Void Cache Cleanup Script
# Purpose: Clean build caches and compiled outputs

echo "========================================"
echo "  Void Cache Cleanup"
echo "========================================"
echo ""

REACT_OUT_DIR="src/vs/workbench/contrib/void/browser/react/out"
BUILD_DIR=".build"

# Clean React compiled output
if [[ -d "$REACT_OUT_DIR" ]]; then
    FILE_COUNT=$(find "$REACT_OUT_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[1/2] Cleaning React compiled output ($FILE_COUNT files)..."
        rm -rf "${REACT_OUT_DIR:?}"/*
        echo "Success: React out directory cleaned"
    else
        echo "[1/2] React out directory is already empty, skipping"
    fi
else
    echo "[1/2] React out directory not found, skipping"
fi

echo ""

# Clean build cache
if [[ -d "$BUILD_DIR" ]]; then
    FILE_COUNT=$(find "$BUILD_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[2/2] Cleaning build cache ($FILE_COUNT files)..."
        rm -rf "${BUILD_DIR:?}"/*
        echo "Success: Build directory cleaned"
    else
        echo "[2/2] Build directory is already empty, skipping"
    fi
else
    echo "[2/2] Build directory not found, skipping"
fi

echo ""
echo "========================================"
echo "  Cache cleanup completed!"
echo "========================================"
echo ""
echo "IMPORTANT: After clearing cache, you must:"
echo "  1. First run: npm run watchreact (or ./watch-react-mac.sh)"
echo "  2. Then run:  npm run watch-clientd (or ./dev-mac.sh)"
echo ""
echo "The React build MUST complete before watch-clientd can succeed."
