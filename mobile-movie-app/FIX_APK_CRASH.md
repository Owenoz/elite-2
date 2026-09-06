# 🔧 Fix APK Crash Issue

Your APK is crashing because environment variables weren't included in the build.

## ✅ Solution: Add Environment Variables to EAS & Rebuild

### Step 1: Add Environment Variables to EAS

Run these commands one by one in your terminal:

```powershell
# TMDB API Key
eas secret:create --scope project --name EXPO_PUBLIC_MOVIE_API_KEY --value "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA" --type string

# Appwrite Project ID
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_PROJECT_ID --value "686aeb1b003344a33beb" --type string

# Appwrite Database ID
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_DATABASE_ID --value "686c3f460005c8471e94" --type string

# Trending Collection ID
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_COLLECTION_ID --value "686c3f81001fba212ce7" --type string

# Users Collection ID
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID --value "686c3f81001fba212ce8" --type string

# Favorites Collection ID
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID --value "686c3f81001fba212ce9" --type string

# Downloads Collection ID
eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID --value "686c3f81001fba212c10" --type string
```

### Step 2: Verify Secrets Were Added

```powershell
eas secret:list
```

You should see all 7 secrets listed.

### Step 3: Rebuild the APK

```powershell
eas build -p android --profile preview --clear-cache
```

The `--clear-cache` flag ensures a fresh build with the new environment variables.

---

## 🎯 What This Does

- Adds your API keys and database IDs to EAS Build servers
- These secrets are securely stored and injected during build
- Your APK will now have access to TMDB API and Appwrite backend

---

## ⏱️ Build Time

- Wait 10-20 minutes for the build to complete
- You'll receive an email when it's ready
- Or check: https://expo.dev/accounts/owenoz/projects/moviehub-app/builds

---

## 📥 After Build Completes

1. Download the new APK
2. Install on your Android device
3. The app should now work without crashing!

---

## 🚨 Still Crashing?

If the app still crashes after rebuild:

### Check Build Logs
```powershell
eas build:view [build-id]
```

### Common Issues:

1. **Environment variables not set**: Run `eas secret:list` to verify
2. **Old APK installed**: Uninstall old APK completely before installing new one
3. **Appwrite collections not created**: Make sure all 4 collections exist in Appwrite

### Debug Mode
To see detailed crash logs, run with development client:
```powershell
eas build -p android --profile development
```

---

## ✅ Checklist

- [ ] Added all 7 environment variables to EAS
- [ ] Verified secrets with `eas secret:list`
- [ ] Rebuilt APK with `--clear-cache` flag
- [ ] Waited for build to complete
- [ ] Uninstalled old APK from device
- [ ] Installed new APK
- [ ] Tested the app

---

## 📞 Need Help?

Check the build logs at:
https://expo.dev/accounts/owenoz/projects/moviehub-app/builds

Look for any error messages in the logs.
