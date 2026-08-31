import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#AB8BFF" />
      </View>
    );
  }

  // Redirect based on authentication status
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding" />;
}
