#!/usr/bin/env zsh
# Void Release Build Script
# Purpose: Build a production-ready release of Void for macOS

echo "========================================"
echo "  Void Release Builder"
echo "========================================"
echo ""

# Check Xcode Command Line Tools (macOS equivalent of VS Build Tools)
echo "[Pre-check] Looking for Xcode Command Line Tools..."
if ! xcode-select -p &>/dev/null; then
    echo "Warning: Xcode Command Line Tools not found!"
    echo "Please install via: xcode-select --install"
    echo ""
    read -r "REPLY?Continue anyway? (y/n): "
    if [[ "$REPLY" != "y" ]]; then
        exit 1
    fi
else
    echo "Found Xcode tools at: $(xcode-select -p)"
fi
echo ""

# Step 1: Configure environment
echo "[1/5] Configuring environment..."
NODE_VERSION=$(node --version 2>/dev/null)
if [[ $? -ne 0 ]]; then
    echo "Error: Node.js not found. Please install Node.js v20.18.2 via 'sudo n 20.18.2'"
    exit 1
fi

REQUIRED="v20.18.2"
if [[ "$NODE_VERSION" != "$REQUIRED" ]]; then
    echo "Switching to Node.js $REQUIRED via n..."
    sudo n 20.18.2
fi

NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"
echo ""

# Step 2: Build React components
echo "[2/5] Building React components..."
NODE_OPTIONS="--max-old-space-size=8192" npm run buildreact
if [[ $? -ne 0 ]]; then
    echo "Error: React build failed"
    exit 1
fi
echo ""

# Step 3: Compile TypeScript
echo "[3/5] Compiling TypeScript..."
npm run compile
if [[ $? -ne 0 ]]; then
    echo "Error: TypeScript compilation failed"
    exit 1
fi
echo ""

# Step 4: Set build options
echo "[4/5] Setting build options..."
export NODE_OPTIONS="--max-old-space-size=8192"
echo "Memory limit set to 8GB"
echo ""

# Step 5: Build release for macOS (auto-detect arch)
echo "[5/5] Building macOS release..."
echo "This may take 20-30 minutes. Please be patient..."
echo ""

ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    BUILD_TARGET="vscode-darwin-arm64"
    echo "Detected Apple Silicon (arm64), building for darwin-arm64..."
else
    BUILD_TARGET="vscode-darwin-x64"
    echo "Detected Intel (x64), building for darwin-x64..."
fi

npm run gulp $BUILD_TARGET

# Check result
if [[ $? -eq 0 ]]; then
    echo ""
    echo "========================================"
    echo "  Build Successful!"
    echo "========================================"
    echo ""
    OUTPUT_DIR="../VSCode-${BUILD_TARGET#vscode-}"
    echo "Output location: $OUTPUT_DIR"
    echo ""
    if [[ -d "$OUTPUT_DIR" ]]; then
        echo "Build contents:"
        ls -lh "$OUTPUT_DIR"
        echo ""
        APP_NAME=$(ls "$OUTPUT_DIR" | grep "\.app$" | head -1)
        if [[ -n "$APP_NAME" ]]; then
            echo "To run: open $OUTPUT_DIR/$APP_NAME"
        fi
    fi
else
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
