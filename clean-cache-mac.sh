#!/usr/bin/env zsh
# Void Cache Cleanup Script
# Purpose: Clean build caches and compiled outputs

echo "========================================"
echo "  Void Cache Cleanup"
echo "========================================"
echo ""

REACT_OUT_DIR="src/vs/workbench/contrib/void/browser/react/out"
BUILD_DIR=".build"
OUT_DIR="out"
OUT_BUILD_DIR="out-build"
OUT_VSCODE_DIR="out-vscode"

# Clean React compiled output
if [[ -d "$REACT_OUT_DIR" ]]; then
    FILE_COUNT=$(find "$REACT_OUT_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[1/5] Cleaning React compiled output ($FILE_COUNT files)..."
        rm -rf "${REACT_OUT_DIR:?}"/*
        echo "Success: React out directory cleaned"
    else
        echo "[1/5] React out directory is already empty, skipping"
    fi
else
    echo "[1/5] React out directory not found, skipping"
fi

echo ""

# Clean build cache
if [[ -d "$BUILD_DIR" ]]; then
    FILE_COUNT=$(find "$BUILD_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[2/5] Cleaning build cache ($FILE_COUNT files)..."
        rm -rf "${BUILD_DIR:?}"/*
        echo "Success: Build directory cleaned"
    else
        echo "[2/5] Build directory is already empty, skipping"
    fi
else
    echo "[2/5] Build directory not found, skipping"
fi

echo ""

# Clean root out directory
if [[ -d "$OUT_DIR" ]]; then
    FILE_COUNT=$(find "$OUT_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[3/5] Cleaning root out directory ($FILE_COUNT files)..."
        rm -rf "${OUT_DIR:?}"/*
        echo "Success: Root out directory cleaned"
    else
        echo "[3/5] Root out directory is already empty, skipping"
    fi
else
    echo "[3/5] Root out directory not found, skipping"
fi

echo ""

# Clean root out-build directory
if [[ -d "$OUT_BUILD_DIR" ]]; then
    FILE_COUNT=$(find "$OUT_BUILD_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[4/5] Cleaning root out-build directory ($FILE_COUNT files)..."
        rm -rf "${OUT_BUILD_DIR:?}"/*
        echo "Success: Root out-build directory cleaned"
    else
        echo "[4/5] Root out-build directory is already empty, skipping"
    fi
else
    echo "[4/5] Root out-build directory not found, skipping"
fi

echo ""

# Clean root out-vscode directory
if [[ -d "$OUT_VSCODE_DIR" ]]; then
    FILE_COUNT=$(find "$OUT_VSCODE_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$FILE_COUNT" -gt 0 ]]; then
        echo "[5/5] Cleaning root out-vscode directory ($FILE_COUNT files)..."
        rm -rf "${OUT_VSCODE_DIR:?}"/*
        echo "Success: Root out-vscode directory cleaned"
    else
        echo "[5/5] Root out-vscode directory is already empty, skipping"
    fi
else
    echo "[5/5] Root out-vscode directory not found, skipping"
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
