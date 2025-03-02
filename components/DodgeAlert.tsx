import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { snipesService, Snipe } from "../services/snipes";
import { groupsService } from "../services/groups";

interface DodgeAlertProps {
  snipe: Snipe;
  onDodged: () => void;
  onExpired: () => void;
}

export default function DodgeAlert({
  snipe,
  onDodged,
  onExpired,
}: DodgeAlertProps) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate initial time left
    const now = new Date();
    const snipeTime = snipe.timestamp.toDate();
    const initialTimeLeft = Math.max(
      0,
      20 - Math.floor((now.getTime() - snipeTime.getTime()) / 1000)
    );
    setTimeLeft(initialTimeLeft);

    // Start countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [snipe]);

  const handleDodge = async () => {
    setLoading(true);
    try {
      const success = await snipesService.dodgeSnipe(snipe.id, snipe.targetId);
      if (success) {
        // Add a point to the target for successful dodge
        await groupsService.updatePoints(snipe.groupId, snipe.targetId, 1);
        onDodged();
      }
    } catch (error) {
      console.error("Error dodging snipe:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="fade">
      <View style={styles.container}>
        <LinearGradient
          colors={["rgba(79, 70, 229, 0.95)", "rgba(67, 56, 202, 0.95)"]}
          style={styles.alertBox}
        >
          <MaterialIcons name="warning" size={40} color="#FFF" />
          <Text style={styles.title}>You've Been Sniped!</Text>
          <Text style={styles.description}>
            Quick! You have {timeLeft} seconds to dodge this snipe!
          </Text>
          <TouchableOpacity
            style={styles.dodgeButton}
            onPress={handleDodge}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.dodgeButtonText}>DODGE!</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertBox: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 10,
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  dodgeButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
  },
  dodgeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
