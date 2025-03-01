import React, { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface JoinGroupDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

const ModalBackground = ({ children }: { children: React.ReactNode }) => {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, styles.modalBackground]}>
      {children}
    </View>
  );
};

export function JoinGroupDialog({
  visible,
  onClose,
  onSubmit,
}: JoinGroupDialogProps) {
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = () => {
    onSubmit(inviteCode);
    setInviteCode("");
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <ModalBackground>
          <View style={styles.modalWrapper}>
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
              style={styles.modalView}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ThemedText style={styles.modalText}>Join Group</ThemedText>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Enter invite code"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoCapitalize="characters"
                  selectionColor="white"
                />
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={onClose}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.2)",
                      "rgba(255, 255, 255, 0.1)",
                    ]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <LinearGradient
                    colors={["#6366f1", "#4f46e5"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <ThemedText style={styles.buttonText}>Join</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </ModalBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalView: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalText: {
    marginBottom: 24,
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    gap: 12,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 100,
  },
  buttonGradient: {
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
