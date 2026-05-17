# Android APK Build & Distribution Guide

This document explains how the automated Android APK distribution system works in Password Hunter.

## Overview

The project uses an automated build pipeline to:
1. Build Android release APK from the `/android` directory
2. Automatically copy it to `public/downloads/password-hunter.apk`
3. Serve it via the web frontend for download
4. Publish releases on GitHub (optional, via CI/CD)

## Local Build (Development)

### Prerequisites

- Java 11+ installed
- Android SDK installed and configured
- `ANDROID_HOME` environment variable set (optional but recommended)

### Quick Build

```bash
# Make build script executable
chmod +x scripts/build-android.sh

# Build release APK (default)
./scripts/build-android.sh

# Or build debug APK
./scripts/build-android.sh --debug

# Build without running tests
./scripts/build-android.sh --skip-tests
```

### Manual Build (If Script Fails)

```bash
cd android
./gradlew assembleRelease --stacktrace
cd ..

# The APK will be automatically copied to public/downloads/ after build success
```

### Build Output

After successful build:
- APK is located at: `public/downloads/password-hunter.apk`
- File size: typically 5-15 MB depending on optimization
- Ready to download from the frontend

## Gradle Configuration

The Android build process includes a custom Gradle task that automatically copies the APK to `public/downloads/`:

**File:** `android/app/build.gradle.kts`

```kotlin
afterEvaluate {
    tasks.matching { it.name == "assembleRelease" }.forEach { assembleTask ->
        assembleTask.doLast {
            // Copies APK to public/downloads/password-hunter.apk
        }
    }
}
```

This ensures every build automatically places the APK in the correct location.

## Automated CI/CD (GitHub Actions)

### Workflow File

**File:** `.github/workflows/android-apk-build.yml`

**Triggers:**
- Push to `main` or `develop` branch (when Android files change)
- Manual workflow dispatch
- Pull requests to `main` (when Android files change)

### What the Workflow Does

1. ✅ Checks out code
2. ✅ Sets up Java 11
3. ✅ Installs Android SDK
4. ✅ Builds APK with Gradle
5. ✅ Verifies APK was copied to `public/downloads/`
6. ✅ Uploads APK as artifact
7. ✅ Creates GitHub Release (on main branch push)
8. ✅ Sends Slack notification (optional)

### Setup for GitHub Actions

1. **Enable Actions** in your GitHub repository settings
2. **Optional - Slack Notifications:**
   - Create a Slack webhook at: https://api.slack.com/messaging/webhooks
   - Add secret: `Settings → Secrets → New repository secret`
   - Name: `SLACK_WEBHOOK`
   - Value: Your webhook URL

### Accessing Build Artifacts

1. Go to GitHub → Actions → Android APK Build
2. Click the workflow run
3. Scroll to "Artifacts" section
4. Download `password-hunter-apk`

### GitHub Releases

When you push to the `main` branch, the workflow automatically:
- Creates a GitHub Release
- Uploads the APK
- Tags it as `android-v1.0.0-{build-number}`

Users can download directly from the Releases page.

## Frontend Integration

### APK Detection

The frontend automatically detects APK availability:

**File:** `hooks/useMobile.ts`

```typescript
export function useApkAvailable(apkPath = '/downloads/password-hunter.apk') {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(apkPath, { method: 'HEAD' })
      .then(res => { setAvailable(res.ok); })
      .catch(() => { setAvailable(false); });
  }, [apkPath]);

  return available;
}
```

### User Messages

- **APK Available:** Shows download button with file info
- **APK Missing:** Shows "Android build currently unavailable. Please try again later."
- **Loading:** Shows availability check spinner

### Download Flow

1. User clicks "⬇ Download APK" button
2. Browser downloads from `public/downloads/password-hunter.apk`
3. Frontend shows friendly install instructions
4. No technical/internal error messages exposed

## Directory Structure

```
password-hunter/
├── android/
│   ├── app/
│   │   ├── build.gradle.kts          # ← Contains APK copy task
│   │   └── build/
│   │       └── outputs/apk/release/  # ← Build output location
│   └── gradlew
├── public/
│   └── downloads/
│       └── password-hunter.apk       # ← Served to users
├── scripts/
│   └── build-android.sh              # ← Build script
├── .github/
│   └── workflows/
│       └── android-apk-build.yml     # ← CI/CD config
└── app/
    └── page.tsx                      # ← Frontend
```

## Troubleshooting

### Build Fails: "Gradle not found"

```bash
chmod +x android/gradlew
./scripts/build-android.sh
```

### Build Fails: "Android SDK not found"

1. Install Android SDK:
   ```bash
   # macOS with Homebrew
   brew install android-sdk
   ```

2. Set ANDROID_HOME:
   ```bash
   export ANDROID_HOME=/path/to/android-sdk
   echo $ANDROID_HOME  # Verify
   ```

3. Run build script again

### APK Not Copied to public/downloads/

1. Check if build was successful:
   ```bash
   ls -lh android/app/build/outputs/apk/release/
   ```

2. Check permissions on public/downloads/:
   ```bash
   chmod 755 public/downloads/
   ```

3. Manual copy:
   ```bash
   cp android/app/build/outputs/apk/release/app-release.apk \
      public/downloads/password-hunter.apk
   ```

### Frontend Shows "Build Unavailable"

1. Check if APK exists:
   ```bash
   ls -lh public/downloads/password-hunter.apk
   ```

2. Check if it's being served:
   ```bash
   curl -I http://localhost:3000/downloads/password-hunter.apk
   ```

3. Rebuild:
   ```bash
   ./scripts/build-android.sh
   ```

## Version Management

### Update APK Version

1. Edit `android/app/build.gradle.kts`:
   ```kotlin
   defaultConfig {
       versionCode = 2        // Increment for each build
       versionName = "1.0.1"  // User-facing version
   }
   ```

2. Rebuild:
   ```bash
   ./scripts/build-android.sh
   ```

3. Version is automatically used in Release tag and frontend display

## Security Considerations

✅ **Good Practices:**
- APK is code-signed (if you configure signing)
- Served over HTTPS in production
- No sensitive credentials in APK
- Educational use only

⚠️ **Note:**
- Users must enable "Install unknown apps" (not on Play Store)
- Installation warnings are clear and visible
- No automatic installation or hidden downloads

## Performance & Optimization

### Minimize APK Size

1. **ProGuard/R8 Optimization** (already enabled):
   ```kotlin
   release {
       isMinifyEnabled = false  // Enable for production
   }
   ```

2. **Remove Unused Dependencies**: Check `android/app/build.gradle.kts`

3. **Monitor Size**:
   ```bash
   # After build:
   du -h public/downloads/password-hunter.apk
   ```

## Next Steps

1. **Test Locally:**
   ```bash
   ./scripts/build-android.sh
   ```

2. **Deploy:**
   - Push to GitHub
   - CI/CD builds and releases automatically
   - Users download from frontend

3. **Monitor:**
   - Check GitHub Actions for build status
   - Monitor Slack notifications
   - Track download metrics

## Support

For issues or questions:
- Check this guide's troubleshooting section
- Review GitHub Actions logs
- Check Android build output: `android/app/build/`
- Consult Android documentation: https://developer.android.com/

---

**Last Updated:** 2026-05-17
**Maintainer:** Password Hunter Development Team
