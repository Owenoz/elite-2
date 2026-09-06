export default {
  expo: {
    name: "MovieHub",
    slug: "moviehub-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "moviehub",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
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
        projectId: "ead96ed6-5a31-4f76-92b1-a275ea372a08"
      },
      router: {
        origin: false,
      },
      // Environment variables will be injected here during build
      EXPO_PUBLIC_MOVIE_API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
      EXPO_PUBLIC_APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
      EXPO_PUBLIC_APPWRITE_DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      EXPO_PUBLIC_APPWRITE_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID,
      EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
      EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID,
      EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_DOWNLOADS_COLLECTION_ID,
    },
  },
};
