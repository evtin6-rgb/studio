import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Игра (HTML/JS) лежит в train-game/web и копируется в assets/web при сборке.
val webAssetsDir = layout.buildDirectory.dir("generated/webassets")
val copyWeb by tasks.registering(Sync::class) {
    from(rootProject.file("../web"))
    into(webAssetsDir.map { it.dir("web") })
}

val keystorePath: String? = System.getenv("KEYSTORE_FILE")

android {
    namespace = "studio.evtin.chuhchuh"
    compileSdk = 36

    defaultConfig {
        applicationId = "studio.evtin.chuhchuh"
        minSdk = 26
        targetSdk = 36
        versionCode = (findProperty("versionCode") as String?)?.toInt() ?: 1
        versionName = (findProperty("versionName") as String?) ?: "1.0.0"
    }

    signingConfigs {
        if (keystorePath != null) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystorePath != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(file("build/generated/webassets"))
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = false
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

tasks.named("preBuild") { dependsOn(copyWeb) }

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("com.android.billingclient:billing:8.0.0")
}
