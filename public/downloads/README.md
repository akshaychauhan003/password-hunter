# APK Downloads

This directory hosts built APK files served to users.

## To build the Android APK:

```bash
cd android
./gradlew assembleDebug   # Debug build (auto-copies to this directory)
./gradlew assembleRelease # Release build (auto-copies to this directory)
```

Both Gradle assemble tasks in `android/app/build.gradle.kts`
automatically copy the latest APK to this directory as `password-hunter.apk`.
