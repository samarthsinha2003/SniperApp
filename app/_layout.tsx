import React, { useEffect } from "react";
import { Slot, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";

function RootLayoutNavigation() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Route to the appropriate screen based on auth state
      if (!user) {
        router.replace("/auth");
      } else {
        router.replace("/(tabs)/camera");
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Always render the Slot to allow navigation
  return <Slot />;
}

// Wrap the app with AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootLayoutNavigation />
    </AuthProvider>
  );
}
