#!/usr/bin/env zsh
# Void Development Environment Startup Script
# Purpose: Sync React build output to the compiled output directory

echo "========================================"
echo "  Void Dev Environment Startup"
echo "========================================"
echo ""

# Sync React build output to correct location
echo "Syncing React build output..."

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
