import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export interface Target {
  id: string;
  name: string;
  points: number;
  groupId: string;
}

interface TargetSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTarget: (target: Target) => void;
  targets: Target[];
}

export function TargetSelectionModal({
  visible,
  onClose,
  onSelectTarget,
  targets,
}: TargetSelectionModalProps) {
  if (!targets.length) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={["#4a00e0", "#8e2de2"]}
          style={styles.modalContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ThemedText style={styles.title}>Who did you snipe?</ThemedText>

          <ScrollView style={styles.targetList}>
            {targets.map((target) => (
              <TouchableOpacity
                key={target.id}
                style={styles.targetItem}
                onPress={() => onSelectTarget(target)}
              >
                <ThemedText style={styles.targetName}>{target.name}</ThemedText>
                <ThemedText style={styles.points}>
                  {target.points} pts
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              style={styles.closeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  targetList: {
    marginBottom: 20,
  },
  targetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  targetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  points: {
    fontSize: 14,
    color: "#666",
  },
  closeButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
