import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar hidden={true} />
        <Stack>
          <Stack.Screen name="index" options={{headerShown: false}} />
          <Stack.Screen name="onboarding" options={{headerShown: false}} />
          <Stack.Screen name="login" options={{headerShown: false}} />
          <Stack.Screen name="register" options={{headerShown: false}} />
          <Stack.Screen name="categories" options={{headerShown: false}} />
          <Stack.Screen name="genre/[id]" options={{headerShown: false}} />
          <Stack.Screen name="(tabs)" options={{headerShown: false}} />
          <Stack.Screen name="movies/[id]" options={{headerShown: false}} />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
