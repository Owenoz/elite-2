import { Stack } from "expo-router";
import './globals.css'
import { StatusBar } from "react-native";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
      <AuthProvider>
        {/* The StatusBar component from React Native controls the app's status bar. */}
        {/* The 'hidden' prop is set to true to completely hide the system status bar (time, battery, etc.). */}
        <StatusBar hidden={true} />

        {/* The Stack navigator defines the navigation structure for the app. */}
        <Stack>
          {/* Main entry point */}
          <Stack.Screen
              name="index"
              options={{headerShown: false}}
          />
          {/* Authentication screens */}
          <Stack.Screen
              name="onboarding"
              options={{headerShown: false}}
          />
          <Stack.Screen
              name="login"
              options={{headerShown: false}}
          />
          <Stack.Screen
              name="register"
              options={{headerShown: false}}
          />
          {/* Categories */}
          <Stack.Screen
              name="categories"
              options={{headerShown: false}}
          />
          <Stack.Screen
              name="genre/[id]"
              options={{headerShown: false}}
          />
          {/* Defines the main tab-based navigation group. 'headerShown: false' hides the default header. */}
          <Stack.Screen
              name="(tabs)"
              options={{headerShown: false}}
          />
          {/* Defines the screen for displaying individual movie details. The header is also hidden. */}
          <Stack.Screen
              name="movies/[id]"
              options={{headerShown: false}}
          />
        </Stack>
      </AuthProvider>
  );
}
