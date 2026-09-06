import { Redirect } from "expo-router";

// App opens directly to tabs — no login required
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
