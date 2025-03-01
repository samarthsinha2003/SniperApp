import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, router } from "expo-router";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { useAuth } from "../contexts/AuthContext";

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      if (Platform.OS === "web") {
        window.alert("Please enter your email address");
      } else {
        Alert.alert("Error", "Please enter your email address");
      }
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);

      if (Platform.OS === "web") {
        window.alert(
          "Instructions to reset your password have been sent to your email address. Please check your inbox and spam folder."
        );
      } else {
        Alert.alert(
          "Password Reset Email Sent",
          "Instructions to reset your password have been sent to your email address. Please check your inbox and spam folder.",
          [{ text: "OK", style: "default" }]
        );
      }
      router.back();
    } catch (error: any) {
      if (Platform.OS === "web") {
        window.alert(error.message || "Failed to send reset email");
      } else {
        Alert.alert("Error", error.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Reset Password",
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>Reset Password</ThemedText>
          <ThemedText style={styles.description}>
            Enter your email address and we'll send you instructions to reset
            your password.
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              Send Reset Instructions
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <ThemedText style={styles.cancelButtonText}>
              Back to Sign In
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#ff4040",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
  },
  cancelButtonText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
});
