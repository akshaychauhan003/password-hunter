#!/bin/bash

# ============================================================================
# Password Hunter - Android APK Build Script
# ============================================================================
# 
# Automates Android APK building and deployment to public/downloads/
#
# Usage:
#   ./scripts/build-android.sh [--release|--debug] [--skip-tests]
#
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_TYPE="release"  # release or debug
SKIP_TESTS=false
ANDROID_DIR="android"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APK_OUTPUT_DIR="${PROJECT_ROOT}/public/downloads"

# ============================================================================
# Functions
# ============================================================================

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_step() {
  echo -e "${BLUE}→${NC} $1"
}

capitalize() {
  printf '%s' "$1" | awk '{print toupper(substr($0, 1, 1)) substr($0, 2)}'
}

# Parse arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --release)
        BUILD_TYPE="release"
        shift
        ;;
      --debug)
        BUILD_TYPE="debug"
        shift
        ;;
      --skip-tests)
        SKIP_TESTS=true
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        print_error "Unknown argument: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

show_help() {
  cat << EOF
Usage: ./scripts/build-android.sh [OPTIONS]

Options:
  --release         Build release APK (default)
  --debug           Build debug APK
  --skip-tests      Skip running tests
  -h, --help        Show this help message

Examples:
  ./scripts/build-android.sh                    # Build release APK
  ./scripts/build-android.sh --debug            # Build debug APK
  ./scripts/build-android.sh --skip-tests       # Build without running tests

EOF
}

# Check prerequisites
check_prerequisites() {
  print_step "Checking prerequisites..."

  # Check if we're in the project root
  if [ ! -d "$ANDROID_DIR" ]; then
    print_error "Android directory not found at: $ANDROID_DIR"
    exit 1
  fi

  # Check if Java is installed
  if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 11 or later."
    exit 1
  fi

  local java_version=$(java -version 2>&1 | grep version | awk -F'"' '{print $2}')
  print_success "Java found: $java_version"

  # Check if Android SDK is set up
  if [ -z "$ANDROID_HOME" ] && [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
  elif [ -z "$ANDROID_HOME" ] && [ -d "$HOME/Android/Sdk" ]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
  fi

  if [ -n "$ANDROID_HOME" ]; then
    print_success "ANDROID_HOME: $ANDROID_HOME"
  else
    print_warning "ANDROID_HOME is not set. Gradle wrapper fallback detection will be used."
  fi

  # Check if gradle wrapper exists
  if [ ! -f "$ANDROID_DIR/gradlew" ]; then
    print_error "Gradle wrapper not found at: $ANDROID_DIR/gradlew"
    exit 1
  fi

  print_success "All prerequisites met"
}

# Build APK
build_apk() {
  local build_type_label
  build_type_label="$(capitalize "$BUILD_TYPE")"
  print_step "Building ${build_type_label} APK..."

  cd "$ANDROID_DIR"

  # Make gradle executable
  chmod +x gradlew

  # Run gradle build
  if [ "$SKIP_TESTS" = true ]; then
    ./gradlew "assemble$(capitalize "$BUILD_TYPE")" \
      --stacktrace \
      -x test \
      -x testDebugUnitTest \
      -x testReleaseUnitTest
  else
    ./gradlew "assemble$(capitalize "$BUILD_TYPE")" \
      --stacktrace
  fi

  cd "$PROJECT_ROOT"
  print_success "APK build completed"
}

# Verify and copy APK
verify_and_copy_apk() {
  print_step "Verifying and copying APK..."

  local source_dir="${PROJECT_ROOT}/${ANDROID_DIR}/app/build/outputs/apk/${BUILD_TYPE}"

  if [ ! -d "$source_dir" ]; then
    print_error "APK output directory not found: $source_dir"
    exit 1
  fi

  # Find APK file (exclude unsigned)
  local apk_file=$(find "$source_dir" -name "*.apk" ! -name "*unsigned*" -type f | head -n1)

  if [ -z "$apk_file" ]; then
    print_error "No ${BUILD_TYPE} APK found in: $source_dir"
    exit 1
  fi

  print_step "Found APK: $(basename "$apk_file")"

  # Create output directory if needed
  mkdir -p "$APK_OUTPUT_DIR"

  # Copy APK with consistent name
  local dest_file="${APK_OUTPUT_DIR}/password-hunter.apk"
  cp "$apk_file" "$dest_file"

  # Get file size
  local file_size=$(du -h "$dest_file" | awk '{print $1}')

  print_success "APK copied to: $dest_file"
  print_success "File size: $file_size"
}

# Print summary
print_summary() {
  print_header "Build Summary"
  local build_type_label
  build_type_label="$(capitalize "$BUILD_TYPE")"
  
  echo "Build Type:        $build_type_label"
  echo "Skip Tests:        $SKIP_TESTS"
  echo "Output Location:   $APK_OUTPUT_DIR"
  echo ""
  
  if [ -f "${APK_OUTPUT_DIR}/password-hunter.apk" ]; then
    local file_size=$(du -h "${APK_OUTPUT_DIR}/password-hunter.apk" | awk '{print $1}')
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    print_success "APK is ready for distribution"
    echo "File Size:         $file_size"
    echo "Last Modified:     $timestamp"
    echo ""
    echo "Next Steps:"
    echo "  1. APK will be automatically served at: /downloads/password-hunter.apk"
    echo "  2. Frontend will detect and offer download button"
    echo "  3. Users can download and install on Android devices"
    echo ""
    echo "For CI/CD: Check .github/workflows/android-apk-build.yml"
  else
    print_error "APK not found at expected location"
    exit 1
  fi
}

# ============================================================================
# Main
# ============================================================================

main() {
  parse_args "$@"
  local build_type_label
  build_type_label="$(capitalize "$BUILD_TYPE")"
  
  print_header "Password Hunter - Android APK Builder"
  
  print_step "Configuration:"
  echo "  Project Root:    $PROJECT_ROOT"
  echo "  Android Dir:     $ANDROID_DIR"
  echo "  Output Dir:      $APK_OUTPUT_DIR"
  echo "  Build Type:      $build_type_label"
  echo ""
  
  check_prerequisites
  echo ""
  
  build_apk
  echo ""
  
  verify_and_copy_apk
  echo ""
  
  print_summary
  echo ""
  
  print_success "Build process completed successfully!"
}

main "$@"
