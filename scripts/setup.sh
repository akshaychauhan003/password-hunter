#!/bin/bash

# ============================================================================
# Password Hunter - Setup Script
# ============================================================================
# Initializes the project and sets up necessary permissions/configurations
#
# Usage: ./scripts/setup.sh
#
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Password Hunter - Project Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Make build scripts executable
echo -e "${BLUE}→${NC} Setting up build scripts..."
chmod +x scripts/build-android.sh 2>/dev/null || echo "  build-android.sh already executable"
echo -e "${GREEN}✓${NC} Build scripts ready"
echo ""

# Create public/downloads directory if it doesn't exist
echo -e "${BLUE}→${NC} Ensuring download directory exists..."
mkdir -p public/downloads
chmod 755 public/downloads
echo -e "${GREEN}✓${NC} public/downloads/ is ready"
echo ""

# Check for Node.js dependencies
if [ -f "package.json" ]; then
  echo -e "${BLUE}→${NC} Checking Node.js dependencies..."
  if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
  else
    echo "  Dependencies already installed"
  fi
  echo -e "${GREEN}✓${NC} Node.js setup complete"
  echo ""
fi

# Check for Android environment
echo -e "${BLUE}→${NC} Checking Android environment..."
if [ -d "android" ]; then
  chmod +x android/gradlew 2>/dev/null || echo "  gradlew already executable"
  
  if command -v java &> /dev/null; then
    local java_version=$(java -version 2>&1 | grep version | awk -F'"' '{print $2}')
    echo -e "${GREEN}✓${NC} Java found: $java_version"
  else
    echo -e "${YELLOW}⚠${NC} Java not found. Android builds won't work."
    echo "  Install Java 11+: https://www.oracle.com/java/technologies/"
  fi
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "${YELLOW}Development:${NC}"
echo "  npm run dev          # Start Next.js dev server"
echo "  npm run build        # Build for production"
echo ""
echo -e "${YELLOW}Android APK:${NC}"
echo "  ./scripts/build-android.sh    # Build and deploy APK"
echo "  ./scripts/build-android.sh --debug    # Build debug APK"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  cat QUICKSTART.md          # Quick start guide"
echo "  cat ANDROID_BUILD.md       # Android build guide"
echo ""
echo "For more info, check out the README.md"
echo ""
