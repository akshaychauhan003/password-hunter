import java.io.File

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.passwordhunter.mobile"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.passwordhunter.mobile"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    // Retrofit & OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.10.0")
    implementation("com.squareup.retrofit2:converter-gson:2.10.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // ViewModel & Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // Material Icons
    implementation("androidx.compose.material:material-icons-extended:1.6.4")

    // Room for local caching
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}

fun copyBuiltApk(variant: String) {
    val sourceDir = layout.buildDirectory.dir("outputs/apk/$variant").get().asFile
    val destDir = file("../../public/downloads")

    if (!sourceDir.exists()) {
        println("⚠ No $variant APK directory found at $sourceDir")
        return
    }

    destDir.mkdirs()

    val apkFile = sourceDir.listFiles { file ->
        file.name.endsWith(".apk") && !file.name.contains("unsigned")
    }?.firstOrNull()

    if (apkFile == null) {
        println("⚠ No $variant APK found in $sourceDir")
        return
    }

    val destFile = File(destDir, "password-hunter.apk")
    apkFile.copyTo(destFile, overwrite = true)
    println("✓ ${variant.replaceFirstChar { it.uppercase() }} APK copied to ${destFile.absolutePath}")
}

afterEvaluate {
    tasks.matching { it.name == "assembleDebug" || it.name == "assembleRelease" }.configureEach {
        doLast {
            val variant = name.removePrefix("assemble").lowercase()
            copyBuiltApk(variant)
        }
    }
}
