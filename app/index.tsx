import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function LoadingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Initialize app and route to the appropriate screen
    async function initializeAndRoute() {
      try {
        // The app is already initialized in firebase.ts
        // Just wait a moment to show the loading screen
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (user) {
          router.replace("/(tabs)/camera");
        } else {
          router.replace("/auth");
        }
      } catch (error) {
        console.error("Error during app initialization:", error);
        // Still route to auth in case of error
        router.replace("/auth");
      }
    }

    initializeAndRoute();
  }, [user]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#ff4040" />
        <ThemedText style={styles.text}>Loading Sniper App...</ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
});
