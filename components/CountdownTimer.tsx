import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CountdownTimerProps {
  endTime: Date;
  onComplete: () => void;
  variant?: "dodge" | "accusation";
  totalDuration?: number; // in milliseconds
}

export default function CountdownTimer({
  endTime,
  onComplete,
  variant = "dodge",
  totalDuration = 20000, // default 20s for dodge
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(1); // 1 = full, 0 = empty

  const formatTime = (seconds: number) => {
    if (variant === "dodge") return `${seconds}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      if (remaining === 0) {
        clearInterval(timer);
        onComplete();
      }

      setTimeLeft(formatTime(remaining));
      setProgress(remaining / (totalDuration / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, totalDuration]);

  const dodgeGradient = [
    "rgba(79, 70, 229, 0.9)",
    "rgba(67, 56, 202, 0.9)",
  ] as const;
  const accusationGradient = [
    "rgba(255, 111, 0, 0.15)",
    "rgba(255, 111, 0, 0.2)",
  ] as const;
  const dodgeProgress = ["#6366f1", "#4f46e5"] as const;
  const accusationProgress = ["#ff6f00", "#ff4f00"] as const;

  return (
    <View
      style={[
        styles.container,
        variant === "accusation" && styles.accusationContainer,
      ]}
    >
      <LinearGradient
        colors={variant === "dodge" ? dodgeGradient : accusationGradient}
        style={[
          styles.timerBox,
          variant === "accusation" && styles.accusationTimerBox,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>
          {variant === "dodge" ? "Target has" : "Vote retraction available for"}
        </Text>
        <Text
          style={[
            styles.timer,
            variant === "accusation" && styles.accusationTimer,
          ]}
        >
          {timeLeft}
        </Text>
        <Text style={styles.subtitle}>
          {variant === "dodge" ? "to dodge" : ""}
        </Text>
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={variant === "dodge" ? dodgeProgress : accusationProgress}
            style={[styles.progressBar, { width: `${progress * 100}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  accusationContainer: {
    position: "relative",
    bottom: 0,
    marginVertical: 15,
  },
  timerBox: {
    width: "100%",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: "rgba(255, 111, 0, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accusationTimerBox: {
    backgroundColor: "rgba(255, 111, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 111, 0, 0.3)",
  },
  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  timer: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 2,
  },
  accusationTimer: {
    color: "#ff6f00",
    fontSize: 32,
    textShadowColor: "rgba(255, 111, 0, 0.3)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  subtitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.9,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
