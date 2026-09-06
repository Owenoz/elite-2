# 🎯 WORKING: Setup Environment Variables

## ✅ Use these commands with --environment flag:

Run these commands one by one. They set the variables for ALL environments (production, preview, development):

```powershell
# 1. TMDB API Key
eas env:set --name EXPO_PUBLIC_MOVIE_API_KEY --value "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA" --scope project --environment production --environment preview --environment development

# 2. Appwrite Project ID
eas env:set --name EXPO_PUBLIC_APPWRITE_PROJECT_ID --value "686aeb1b003344a33beb" --scope project --environment production --environment preview --environment development

# 3. Appwrite Database ID
eas env:set --name EXPO_PUBLIC_APPWRITE_DATABASE_ID --value "686c3f460005c8471e94" --scope project --environment production --environment preview --environment development

# 4. Trending Collection ID
eas env:set --name EXPO_PUBLIC_APPWRITE_COLLECTION_ID --value "686c3f81001fba212ce7" --scope project --environment production --environment preview --environment development

# 5. Users Collection ID
eas env:set --name EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID --value "686c3f81001fba212ce8" --scope project --environment production --environment preview --environment development

# 6. Favorites Collection ID
eas env:set --name EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID --value "686c3f81001fba212ce9" --scope project --environment production --environment preview --environment development

# 7. Downloads Collection ID
eas env:set --name EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID --value "686c3f81001fba212c10" --scope project --environment production --environment preview --environment development
```

## Verify

```powershell
eas env:list
```

You should see all 7 variables listed for each environment.

## Rebuild

```powershell
eas build -p android --profile preview --clear-cache
```

## Done! 🎉

Your APK will now have all the environment variables and won't crash!
