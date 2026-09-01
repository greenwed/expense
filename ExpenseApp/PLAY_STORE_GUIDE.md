# 🚀 Google Play Store Publishing Guide for RupeeTrack Android App

This guide walk you through building, testing, signing, and publishing the **RupeeTrack** Android application to the **Google Play Store**.

---

## 📁 Android Project Location

The Android native project is located at:
```
/Users/karthi-8017/Karthik/Others/Expense/ExpenseApp/android
```

---

## 🛠️ Step 1: Open & Run in Android Studio

1. Download and install **[Android Studio](https://developer.android.com/studio)** if you haven't already.
2. Open Android Studio and choose **"Open"**.
3. Select the folder:
   ```
   /Users/karthi-8017/Karthik/Others/Expense/ExpenseApp/android
   ```
4. Allow Gradle to sync dependencies automatically.
5. Connect your Android phone via USB (with *USB Debugging* enabled) or start an Android Emulator.
6. Click the **Run (▶)** button to launch RupeeTrack on your device!

---

## 🔄 Step 2: Updating Web Code to Android

Whenever you make updates to the React UI in `ExpenseApp/src`:

```bash
cd /Users/karthi-8017/Karthik/Others/Expense/ExpenseApp
npm run cap:sync
```

This compiles the Vite build into `dist` and updates the Android assets instantly.

---

## 🔐 Step 3: Generate a Release Keystore

Google Play requires all release apps to be digitally signed with a private keystore.

Run this command in your terminal:

```bash
cd /Users/karthi-8017/Karthik/Others/Expense/ExpenseApp/android/app

keytool -genkey -v -keystore rupeetrack-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rupeetrack
```

**Prompts to answer:**
- Enter a secure password (e.g. *save this password safely!*).
- First and last name: *Karthik* (or your organization name).
- Organizational unit & City: *Your city / India*.
- Enter `yes` to confirm.

> ⚠️ **CRITICAL**: Keep `rupeetrack-release-key.jks` and your passwords backed up securely. If lost, you cannot update your app on the Play Store.

---

## 📦 Step 4: Configure Release Signing in Gradle

Open [`ExpenseApp/android/app/build.gradle`](file:///Users/karthi-8017/Karthik/Others/Expense/ExpenseApp/android/app/build.gradle) and configure the `signingConfigs`:

```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file('rupeetrack-release-key.jks')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'rupeetrack'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 🏗️ Step 5: Build the Release Android App Bundle (.aab)

Google Play requires apps to be uploaded in **Android App Bundle (.aab)** format:

```bash
cd /Users/karthi-8017/Karthik/Others/Expense/ExpenseApp/android
./gradlew bundleRelease
```

Once completed, your production `.aab` file will be generated at:
```
ExpenseApp/android/app/build/outputs/bundle/release/app-release.aab
```

*(Optional: To generate a direct APK for testing on your phone without Play Store, run `./gradlew assembleRelease`).*

---

## 🚀 Step 6: Publish on Google Play Console

### 1. Create a Google Play Developer Account
- Go to **[Google Play Console](https://play.google.com/console)**.
- Sign up with your Google account ($25 one-time registration fee).

### 2. Create Your App
- Click **"Create App"**.
- **App Name**: `RupeeTrack - Expense & Budget`
- **Default Language**: English (United States or India).
- **App or Game**: App.
- **Free or Paid**: Free.

### 3. Complete App Content Checklist
In the Play Console left menu under **"Policy and programs" -> "App content"**:
- **Privacy Policy**: Provide a link to your privacy policy (e.g. `https://katexpense.vercel.app/privacy` or a hosted Notion page).
- **Data Safety**:
  - Does your app collect user data? **Yes** (Name, Email for authentication; Financial info for personal budgeting).
  - Is data encrypted in transit? **Yes** (HTTPS/TLS).
  - Can users request data deletion? **Yes**.
- **Target Audience**: 18 and over (or 13+).
- **Financial Features Declaration**: Select *Personal Finance & Budget Tracking*.

### 4. Set Up Store Listing Assets
- **Short Description (80 chars)**: *Track daily expenses, incomes, and household budgets effortlessly.*
- **Full Description**: *RupeeTrack is a clean, modern personal and family finance manager...*
- **App Icon**: 512 x 512 px (PNG with alpha).
- **Feature Graphic**: 1024 x 500 px (JPG or 24-bit PNG).
- **Screenshots**: At least 2 phone screenshots (take screenshots of Home balance, Category Pie Chart, and Transactions).

### 5. Create Production Release & Upload AAB
- Go to **"Release" -> "Production"** (or *Closed testing* first).
- Click **"Create new release"**.
- Upload your **`app-release.aab`** file from `ExpenseApp/android/app/build/outputs/bundle/release/app-release.aab`.
- Add Release Notes: `Initial release of RupeeTrack for Android!`.
- Click **"Review Release"** and then **"Start rollout to Production"**!

Google's review team typically approves new apps within 1 to 3 business days. 🎉
