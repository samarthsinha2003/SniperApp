import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CountdownTimerProps {
  endTime: Date;
  onComplete: () => void;
}

export default function CountdownTimer({
  endTime,
  onComplete,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("20");
  const [progress, setProgress] = useState(1); // 1 = full, 0 = empty

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      if (remaining === 0) {
        clearInterval(timer);
        onComplete();
      }

      setTimeLeft(remaining.toString());
      setProgress(remaining / 20); // 20 seconds total
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(79, 70, 229, 0.9)", "rgba(67, 56, 202, 0.9)"]}
        style={styles.timerBox}
      >
        <Text style={styles.title}>Target has</Text>
        <Text style={styles.timer}>{timeLeft}s</Text>
        <Text style={styles.subtitle}>to dodge</Text>
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={["#6366f1", "#4f46e5"]}
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
  timerBox: {
    width: "100%",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  title: {
    color: "#FFF",
    fontSize: 16,
    opacity: 0.9,
  },
  timer: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 5,
  },
  subtitle: {
    color: "#FFF",
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 10,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
});
