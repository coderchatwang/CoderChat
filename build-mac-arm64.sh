#!/usr/bin/env zsh
# CoderChat Mac Build Script (Apple Silicon)
# Purpose: One-click build script for macOS arm64 (Apple Silicon)

set -e  # Exit on error

echo "========================================"
echo "  CoderChat Mac Builder (arm64)"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check Xcode Command Line Tools
echo "[Pre-check] Looking for Xcode Command Line Tools..."
if ! xcode-select -p &>/dev/null; then
    echo "Error: Xcode Command Line Tools not found!"
    echo "Please install via: xcode-select --install"
    exit 1
else
    echo "Found Xcode tools at: $(xcode-select -p)"
fi
echo ""

# Check Node.js
echo "[Pre-check] Checking Node.js..."
NODE_VERSION=$(node --version 2>/dev/null)
if [[ $? -ne 0 ]]; then
    echo "Error: Node.js not found. Please install Node.js v20.18.2"
    exit 1
fi

REQUIRED="v20.18.2"
if [[ "$NODE_VERSION" != "$REQUIRED" ]]; then
    echo "Switching to Node.js $REQUIRED via n..."
    sudo n 20.18.2
    NODE_VERSION=$(node --version)
fi
echo "Node.js version: $NODE_VERSION"
echo ""

# Step 1: Build React components
echo "[1/4] Building React components..."
NODE_OPTIONS="--max-old-space-size=8192" npm run buildreact
if [[ $? -ne 0 ]]; then
    echo "Error: React build failed"
    exit 1
fi
echo "React build completed."
echo ""

# Step 2: Compile TypeScript
echo "[2/4] Compiling TypeScript..."
npm run compile
if [[ $? -ne 0 ]]; then
    echo "Error: TypeScript compilation failed"
    exit 1
fi
echo "TypeScript compilation completed."
echo ""

# Step 3: Build macOS release
echo "[3/4] Building macOS release..."
echo "This may take 15-20 minutes. Please be patient..."
echo ""

BUILD_TARGET="vscode-darwin-arm64"
echo "Building for Apple Silicon (arm64)..."

export NODE_OPTIONS="--max-old-space-size=8192"
npm run gulp $BUILD_TARGET

if [[ $? -ne 0 ]]; then
    echo ""
    echo "========================================"
    echo "  Build Failed!"
    echo "========================================"
    echo ""
    echo "Please check the error messages above."
    echo "Common issues:"
    echo "  - Xcode Command Line Tools not installed"
    echo "  - Insufficient disk space (need 10GB+)"
    echo "  - Network connectivity issues"
    exit 1
fi

# Step 4: Verify output
echo ""
echo "[4/4] Verifying build output..."

OUTPUT_DIR="$SCRIPT_DIR/../VSCode-${BUILD_TARGET#vscode-}"
if [[ -d "$OUTPUT_DIR" ]]; then
    APP_NAME=$(ls "$OUTPUT_DIR" | grep "\.app$" | head -1)
    if [[ -n "$APP_NAME" ]]; then
        APP_SIZE=$(du -sh "$OUTPUT_DIR/$APP_NAME" 2>/dev/null | cut -f1)
        echo ""
        echo "========================================"
        echo "  Build Successful!"
        echo "========================================"
        echo ""
        echo "Output location: $OUTPUT_DIR"
        echo "Application: $APP_NAME ($APP_SIZE)"
        echo ""
        echo "To run the application:"
        echo "  open $OUTPUT_DIR/$APP_NAME"
        echo ""
    else
        echo "Warning: .app file not found in output directory"
    fi
else
    echo "Warning: Output directory not found at $OUTPUT_DIR"
fi
