export default {
  expo: {
    name: "Elite Movies",
    slug: "moviehub-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "moviehub",
    userInterfaceStyle: "dark",
    newArchEnabled: false,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#030014",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.moviehub.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#030014",
      },
      package: "com.moviehub.app",
      versionCode: 1,
      permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#030014",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "1c7e0a14-1afc-4fc2-883f-ac371686eaa7"
      },
      router: {
        origin: false,
      },
      // Env vars: fall back to hardcoded values so APK always has them
      EXPO_PUBLIC_MOVIE_API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY || "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA",
      EXPO_PUBLIC_APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || "686aeb1b003344a33beb",
      EXPO_PUBLIC_APPWRITE_DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || "686c3f460005c8471e94",
      EXPO_PUBLIC_APPWRITE_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID || "686c3f81001fba212ce7",
      EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "686c3f81001fba212ce8",
      EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID || "686c3f81001fba212ce9",
      EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID || "686c3f81001fba212c10",
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://YOUR_PROJECT.supabase.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR_ANON_KEY",
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "https://elitemovies.duckdns.org/api",
    },
  },
};
