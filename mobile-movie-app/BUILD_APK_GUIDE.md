# 📱 How to Build APK Using EAS

This guide will help you build an APK for your MovieHub app using Expo Application Services (EAS).

## Prerequisites

Before building, make sure you have:
- An Expo account (create one at https://expo.dev)
- Node.js installed
- Git installed

## Step-by-Step Instructions

### 1. Install EAS CLI Globally

Open your terminal and run:
```powershell
npm install -g eas-cli
```

### 2. Login to Expo Account

```powershell
eas login
```

Enter your Expo credentials when prompted.

### 3. Configure Your Project

Run this command to initialize EAS in your project:
```powershell
eas build:configure
```

This will:
- Create/update the `eas.json` file
- Register your project with EAS
- Generate a project ID

### 4. Build the APK

For a **preview build** (APK for testing):
```powershell
eas build -p android --profile preview
```

For a **production build**:
```powershell
eas build -p android --profile production
```

### 5. Wait for Build to Complete

The build process will:
- Upload your code to EAS servers
- Build the APK in the cloud
- Provide a link to download the APK when complete

Typically takes 10-20 minutes.

### 6. Download Your APK

Once the build completes:
- You'll get a URL in the terminal
- Or visit https://expo.dev/accounts/[your-account]/projects/moviehub-app/builds
- Click on the build to download the APK

### 7. Install on Android Device

Transfer the APK to your Android device and install it.

**Note:** You may need to enable "Install from Unknown Sources" in your device settings.

---

## Build Profiles Explained

### Preview Profile
- Creates an APK file (not AAB)
- Suitable for testing and internal distribution
- Faster build process
- Can be installed directly on devices

### Production Profile
- Creates either APK or AAB
- Optimized for Google Play Store
- Includes production optimizations
- Larger file size

---

## Common Issues & Solutions

### Issue: "Not logged in"
**Solution:** Run `eas login` and enter your credentials

### Issue: "Project not configured"
**Solution:** Run `eas build:configure` first

### Issue: "Build failed"
**Solution:** Check the build logs for errors. Common fixes:
- Clear node_modules: `rm -r node_modules; npm install`
- Update dependencies: `npm update`
- Check .env file for missing variables

### Issue: APK won't install on device
**Solution:** 
- Enable "Install from Unknown Sources"
- Make sure device has enough storage
- Check Android version compatibility (minimum API 21)

---

## Environment Variables

Make sure these are set in your `.env` file:
```
EXPO_PUBLIC_MOVIE_API_KEY=your_tmdb_api_key
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
EXPO_PUBLIC_APPWRITE_COLLECTION_ID=trending_collection_id
EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users_collection_id
EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID=favorites_collection_id
EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID=downloads_collection_id
```

**Important:** EAS will use these environment variables during the build.

---

## Alternative: Local Build with EAS

If you want to build locally (requires Android Studio):
```powershell
eas build -p android --profile preview --local
```

---

## Quick Commands Reference

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build preview APK
eas build -p android --profile preview

# Build production APK
eas build -p android --profile production

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

---

## Next Steps After Building

1. **Test the APK** on multiple devices
2. **Share with testers** using the download link
3. **Submit to Google Play** (if using production build)
4. **Create updates** using `eas update` for OTA updates

---

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- GitHub Issues: Report bugs in your repository

---

## Build Status

Track your builds at: https://expo.dev/accounts/[your-account]/projects/moviehub-app/builds

Happy Building! 🚀
