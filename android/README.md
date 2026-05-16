# Password Hunter Android App

A native Android application built with Kotlin and Jetpack Compose that provides password analysis and strength evaluation by calling the Password Hunter Java backend API.

## Features

- **Password Analysis**: Analyze password strength in real-time
- **Difficulty Scoring**: Get immediate feedback on password difficulty levels
- **Detailed Metrics**: View entropy, character diversity, weaknesses, and suggestions
- **History Tracking**: Browse previous password analysis sessions
- **Material Design 3**: Modern, intuitive UI with cyber-themed colors
- **Offline Support**: Works with local caching

## Prerequisites

- Android Studio Jellyfish or later
- Android SDK 26+ (API Level 26 minimum)
- Kotlin 1.9.23+
- Java 11+

## Setup

### 1. Clone and Open Project

```bash
cd android
# Open in Android Studio
```

### 2. Configure Backend URL

Edit `RetrofitClient.kt`:

```kotlin
private const val BASE_URL = "http://localhost:8080/"
```

For production:
```kotlin
private const val BASE_URL = "https://api.password-hunter.com/"
```

### 3. Build & Run

```bash
# Build debug APK
./gradlew build

# Install on emulator/device
./gradlew installDebug

# Or run in Android Studio: Shift+F10
```

## Architecture

### Network Layer
- **Retrofit**: HTTP client for API communication
- **OkHttp**: HTTP interceptors and logging
- **Models**: Type-safe API contracts

### UI Layer
- **Jetpack Compose**: Declarative UI framework
- **Material Design 3**: Material components and theming
- **Coroutines**: Async operations and state management

### ViewModel Layer
- **AndroidViewModel**: Lifecycle-aware state management
- **StateFlow**: Reactive state container
- **CoroutineScope**: Structured concurrency

### Project Structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/passwordhunter/mobile/
│   │   │   │   ├── MainActivity.kt          # Entry point
│   │   │   │   ├── network/
│   │   │   │   │   ├── PasswordHunterApi.kt  # Retrofit interface
│   │   │   │   │   ├── RetrofitClient.kt     # HTTP client setup
│   │   │   │   │   ├── PasswordAnalysisModels.kt
│   │   │   │   │   └── HistoryModels.kt
│   │   │   │   ├── ui/
│   │   │   │   │   └── PasswordAnalysisScreen.kt  # UI components
│   │   │   │   └── viewmodel/
│   │   │   │       └── PasswordAnalysisViewModel.kt
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/                         # Resources
│   │   └── test/                            # Unit tests
│   └── build.gradle.kts
├── settings.gradle.kts
├── build.gradle.kts
└── README.md
```

## API Integration

### Password Analysis

```kotlin
val response = api.analyzePassword(PasswordAnalysisRequest("MyP@ssw0rd"))
if (response.success) {
    val analysis = response.data
    // Use analysis: score, entropy, weaknesses, etc.
}
```

### History Management

```kotlin
// Get history
val historyResponse = api.getHistory(page = 1, limit = 20)

// Save to history
val historyRequest = HistoryRequest(
    target = "MyP@ssw0rd",
    maskedTarget = "My*****",
    totalAttempts = 12000000,
    timeTakenMs = 14000,
    modeUsed = "alphanumeric",
    difficultyLabel = "Hard",
    difficultyScore = 65.2,
    estimatedCrackTime = "2.5 hours",
    charLength = 10,
    charsetSize = 94,
    entropy = 53.3
)
val saveResponse = api.saveHistory(historyRequest)
```

## Building APK

### Debug APK
```bash
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (requires keystore)
```bash
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=path/to/keystore.jks \
  -Pandroid.injected.signing.store.password=password \
  -Pandroid.injected.signing.key.alias=alias \
  -Pandroid.injected.signing.key.password=password
# Output: app/build/outputs/apk/release/app-release.apk
```

## Emulator Setup

For localhost backend access from Android emulator:

```bash
# Instead of localhost:8080, use:
http://10.0.2.2:8080
```

Update `RetrofitClient.kt`:
```kotlin
private const val BASE_URL = "http://10.0.2.2:8080/"
```

## Testing

```bash
# Unit tests
./gradlew test

# Instrumented tests (requires emulator/device)
./gradlew connectedAndroidTest
```

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running: `mvn spring-boot:run` in backend directory
- Check backend URL in `RetrofitClient.kt`
- For emulator, use `10.0.2.2:8080` instead of `localhost:8080`
- Verify CORS is enabled in backend

### Build errors
- Run `./gradlew clean` then rebuild
- Check Android SDK versions in `build.gradle.kts`
- Ensure Java 11+ is installed

### Dependencies not resolved
```bash
./gradlew build --refresh-dependencies
```

## Future Enhancements

- [ ] Offline password analysis
- [ ] Local caching with Room database
- [ ] Biometric authentication
- [ ] Dark/Light theme toggle
- [ ] Import/export history
- [ ] Share analysis results
