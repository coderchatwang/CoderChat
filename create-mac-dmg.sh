#!/bin/bash
# CoderChat DMG Creator
# Purpose: Package .app bundles into DMG installers for macOS

set -e

echo "========================================"
echo "  CoderChat DMG Creator"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Output directory
DMG_DIR="./dmg"
mkdir -p "$DMG_DIR"

# Check if create-dmg is installed
if ! command -v create-dmg &> /dev/null; then
    echo "create-dmg is not installed. Installing via npm..."
    npm install -g create-dmg
    
    if ! command -v create-dmg &> /dev/null; then
        echo "Error: Failed to install create-dmg"
        echo "Please install it manually: npm install -g create-dmg"
        exit 1
    fi
fi

echo "Using create-dmg: $(which create-dmg)"
echo ""

# Function to create DMG for a given architecture
create_dmg_for_arch() {
    local ARCH="$1"
    local APP_NAME="CoderChat"
    local APP_PATH="../VSCode-darwin-${ARCH}/${APP_NAME}.app"
    local DMG_NAME="CoderChat-darwin-${ARCH}.dmg"
    local DMG_PATH="${DMG_DIR}/${DMG_NAME}"
    
    echo "----------------------------------------"
    echo "Processing: darwin-${ARCH}"
    echo "----------------------------------------"
    
    # Check if .app exists
    if [[ ! -d "$APP_PATH" ]]; then
        echo "Warning: App bundle not found at: $APP_PATH"
        echo "Skipping darwin-${ARCH}..."
        echo ""
        return 0
    fi
    
    echo "App bundle: $APP_PATH"
    echo "Output: $DMG_PATH"
    
    # Get app version from Info.plist
    local APP_VERSION=$(plutil -extract CFBundleShortVersionString raw "$APP_PATH/Contents/Info.plist" 2>/dev/null || echo "1.0.0")
    echo "App version: $APP_VERSION"
    
    # Remove existing DMG if present
    if [[ -f "$DMG_PATH" ]]; then
        echo "Removing existing DMG: $DMG_PATH"
        rm -f "$DMG_PATH"
    fi
    
    # Also remove versioned DMG if present
    local VERSIONED_DMG="${DMG_DIR}/${APP_NAME} ${APP_VERSION}.dmg"
    if [[ -f "$VERSIONED_DMG" ]]; then
        rm -f "$VERSIONED_DMG"
    fi
    
    echo "Creating DMG..."
    
    create-dmg \
        --overwrite \
        --no-code-sign \
        --dmg-title="$APP_NAME" \
        "$APP_PATH" \
        "$DMG_DIR"
    
    # Rename versioned DMG to final name
    if [[ -f "$VERSIONED_DMG" ]]; then
        mv "$VERSIONED_DMG" "$DMG_PATH"
    fi
    
    if [[ -f "$DMG_PATH" ]]; then
        local DMG_SIZE=$(du -sh "$DMG_PATH" | cut -f1)
        echo "Created: $DMG_PATH ($DMG_SIZE)"
    else
        echo "Error: Failed to create DMG for darwin-${ARCH}"
        return 1
    fi
    
    echo ""
}

# Create DMG for x64
create_dmg_for_arch "x64"

# Create DMG for arm64
create_dmg_for_arch "arm64"

# Summary
echo "========================================"
echo "  DMG Creation Complete!"
echo "========================================"
echo ""
echo "Output directory: $DMG_DIR"
echo ""
ls -lh "$DMG_DIR"/*.dmg 2>/dev/null || echo "No DMG files created."
echo ""
