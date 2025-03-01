import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
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
        <ThemedView style={styles.modalContent}>
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
            <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 8,
  },
  targetName: {
    fontSize: 16,
    fontWeight: "500",
  },
  points: {
    fontSize: 14,
    opacity: 0.7,
  },
  closeButton: {
    backgroundColor: "#ff4040",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
