# Quick Reference: Android APK Distribution

## For Daily Development

### Build APK (3 options)

```bash
# Option 1: Using npm (recommended)
npm run android:build

# Option 2: Using bash script directly
./scripts/build-android.sh

# Option 3: Manual Gradle
cd android && ./gradlew assembleRelease && cd ..
```

After build → APK automatically copied to `public/downloads/password-hunter.apk` ✅

### Test in Frontend

```bash
npm run dev
# Visit http://localhost:3000
# APK download button will show (if APK exists)
```

### Debug Build

```bash
npm run android:build:debug
```

### Skip Tests for Faster Build

```bash
npm run android:build:skip-tests
```

---

## For Production Deployment

### Before Going Live

```bash
# 1. Build APK
npm run android:build

# 2. Verify it exists
ls -lh public/downloads/password-hunter.apk

# 3. Deploy as usual
npm run build
npm start
```

### GitHub Actions (Automatic)

Just push to main - GitHub Actions automatically:
1. Builds APK
2. Copies to public/downloads/
3. Creates GitHub Release
4. Uploads APK to Release
5. (Optional) Sends Slack notification

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | `java -version` (need 11+) |
| No APK copied | Check `public/downloads/` permissions |
| Download doesn't work | Verify file exists: `ls public/downloads/password-hunter.apk` |
| GitHub Actions disabled | Enable in: Settings → Actions → General |
| Want Slack notifications | Add webhook to Secrets (see `ANDROID_BUILD.md`) |

---

## File Locations

| What | Where |
|------|-------|
| Build script | `scripts/build-android.sh` |
| Setup script | `scripts/setup.sh` |
| GitHub Actions | `.github/workflows/android-apk-build.yml` |
| Gradle config | `android/app/build.gradle.kts` |
| Frontend | `app/page.tsx` |
| APK output | `public/downloads/password-hunter.apk` |

---

## Key Commands Reference

```bash
# Setup
npm install && npm run setup

# Development
npm run dev                          # Start dev server
npm run android:build               # Build release APK
npm run android:build:debug         # Build debug APK
npm run android:build:skip-tests    # Quick build

# Production
npm run build                       # Build Next.js
npm start                          # Start production server

# Help
./scripts/build-android.sh --help  # Build script help
cat ANDROID_BUILD.md              # Full documentation
cat DEPLOYMENT.md                 # Deployment guide
```

---

## What's Automated Now?

✅ APK builds and automatically copied to `public/downloads/`
✅ Frontend detects APK availability
✅ GitHub Actions builds on push
✅ GitHub Releases created with APK
✅ Installation instructions are user-friendly
✅ No developer messages exposed

## What Stays the Same?

✓ Android source code structure
✓ PWA functionality
✓ Backend integration
✓ Overall architecture

---

## Most Common Workflows

### Daily Development
```bash
npm run dev
npm run android:build
# Make changes, rebuild as needed
```

### Release to Production
```bash
npm run android:build
npm run build
git push origin main
# GitHub Actions handles the rest
```

### Quick Debug
```bash
npm run android:build:debug
npm run dev
# Test on Android device/emulator
```

---

For detailed information: See `APK_FIX_SUMMARY.md`, `ANDROID_BUILD.md`, or `DEPLOYMENT.md`
