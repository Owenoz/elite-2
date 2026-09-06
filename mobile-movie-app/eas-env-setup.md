# EAS Environment Variables Setup

The APK is crashing because environment variables from .env are not included in the build.

## Fix: Add Environment Variables to EAS

Run this command to add your environment variables to EAS:

```powershell
# Set environment variables for EAS build
eas secret:create --scope project --name EXPO_PUBLIC_MOVIE_API_KEY --value "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA" --type string

eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_PROJECT_ID --value "686aeb1b003344a33beb" --type string

eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_DATABASE_ID --value "686c3f460005c8471e94" --type string

eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_COLLECTION_ID --value "686c3f81001fba212ce7" --type string

eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID --value "686c3f81001fba212ce8" --type string

eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID --value "686c3f81001fba212ce9" --type string

eas secret:create --scope project --name EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID --value "686c3f81001fba212c10" --type string
```

After adding these, rebuild:
```powershell
eas build -p android --profile preview
```
