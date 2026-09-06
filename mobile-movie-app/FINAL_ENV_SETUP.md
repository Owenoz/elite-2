# 🎯 FINAL: Setup Environment Variables

## ✅ Use `eas env:set` (the latest command)

Run these commands one by one:

```powershell
# 1. TMDB API Key
eas env:set EXPO_PUBLIC_MOVIE_API_KEY "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA"

# 2. Appwrite Project ID
eas env:set EXPO_PUBLIC_APPWRITE_PROJECT_ID "686aeb1b003344a33beb"

# 3. Appwrite Database ID
eas env:set EXPO_PUBLIC_APPWRITE_DATABASE_ID "686c3f460005c8471e94"

# 4. Trending Collection ID
eas env:set EXPO_PUBLIC_APPWRITE_COLLECTION_ID "686c3f81001fba212ce7"

# 5. Users Collection ID
eas env:set EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID "686c3f81001fba212ce8"

# 6. Favorites Collection ID
eas env:set EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID "686c3f81001fba212ce9"

# 7. Downloads Collection ID
eas env:set EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID "686c3f81001fba212c10"
```

## Verify

```powershell
eas env:list
```

## Rebuild

```powershell
eas build -p android --profile preview --clear-cache
```

## Done! 🎉

The new APK will have all environment variables and won't crash!
