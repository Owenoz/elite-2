import { Stack } from "expo-router";
import './globals.css';
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout() {
  return (
      <ErrorBoundary>
        <AuthProvider>
          <StatusBar style="light" hidden />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="categories" options={{ headerShown: false }} />
            <Stack.Screen name="genre/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="movies/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="watch/[id]" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="uganda" options={{ headerShown: false }} />
            <Stack.Screen name="uganda-tv" options={{ headerShown: false }} />
            <Stack.Screen name="kulutimbe" options={{ headerShown: false, presentation: "fullScreenModal" }} />
          </Stack>
        </AuthProvider>
      </ErrorBoundary>
  );
}
