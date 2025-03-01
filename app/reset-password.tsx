import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  View,
  Dimensions,
} from "react-native";
import { Stack, router } from "expo-router";
import { ThemedText } from "../components/ThemedText";
import { useAuth } from "../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

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
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.content}>
            <ThemedText style={styles.title}>Reset Password</ThemedText>

            <ThemedText style={styles.description}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
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
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.buttonText}>
                  Send Reset Instructions
                </ThemedText>
              </LinearGradient>
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
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    maxWidth: 400,
    width: width * 0.9,
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 24,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  button: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonGradient: {
    padding: 16,
    alignItems: "center",
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
    color: "rgba(255, 255, 255, 0.8)",
  },
});
