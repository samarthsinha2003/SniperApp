import React, { useState, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Image, Alert } from "react-native";
import { Camera } from "expo-camera";
import type { CameraCapturedPicture } from "expo-camera";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import {
  TargetSelectionModal,
  Target,
} from "../../components/TargetSelectionModal";
import { groupsService } from "../../services/groups";
import { photosService } from "../../services/photos";
import { useAuth } from "../../contexts/AuthContext";

export default function CameraScreen() {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<"front" | "back">("back");
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();

    if (user) {
      loadTargets();
    }
  }, [user]);

  const loadTargets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userGroups = await groupsService.getUserGroups(user.id);

      // Combine and deduplicate members from all groups
      const targets = userGroups.flatMap((group) =>
        group.members
          .filter((member) => member.id !== user.id) // Exclude current user
          .map((member) => ({
            id: member.id,
            name: member.name,
            points: member.points,
            groupId: group.id,
          }))
      );

      // Remove duplicates based on member ID
      const uniqueTargets = targets.filter(
        (target, index, self) =>
          index === self.findIndex((t) => t.id === target.id)
      );

      setAvailableTargets(uniqueTargets);
    } catch (error) {
      console.error("Error loading targets:", error);
      Alert.alert("Error", "Failed to load targets");
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No access to camera</ThemedText>
        <TouchableOpacity
          onPress={() => Camera.requestCameraPermissionsAsync()}
          style={styles.button}
        >
          <ThemedText>Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      const savedPhotoUri = await photosService.savePhoto(photo.uri);
      setPhoto(photo);
      setShowTargetModal(true);
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleTargetSelection = async (target: Target) => {
    if (!user || !photo) return;

    try {
      setLoading(true);

      // Update points in the group
      await groupsService.updatePoints(target.groupId, target.id, -10); // Deduct points from target
      await groupsService.updatePoints(target.groupId, user.id, 10); // Add points to sniper

      // Share the photo
      await photosService.sharePhoto(photo.uri, target.name);

      // Delete the local photo after sharing
      await photosService.deletePhoto(photo.uri);
    } catch (error) {
      console.error("Error processing snipe:", error);
      Alert.alert("Error", "Failed to process snipe");
    } finally {
      setLoading(false);
      resetCamera();
    }
  };

  const resetCamera = async () => {
    if (photo) {
      try {
        await photosService.deletePhoto(photo.uri);
      } catch (error) {
        console.error("Error deleting photo:", error);
      }
    }
    setPhoto(null);
    setShowTargetModal(false);
  };

  if (photo) {
    return (
      <ThemedView style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={resetCamera}
            disabled={loading}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowTargetModal(true)}
            disabled={loading}
          >
            <MaterialIcons name="person-add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <TargetSelectionModal
          visible={showTargetModal}
          onClose={() => setShowTargetModal(false)}
          onSelectTarget={handleTargetSelection}
          targets={availableTargets}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={type}>
        <View style={styles.overlay}>
          {/* Sniper scope overlay */}
          <View style={styles.scope}>
            <View style={styles.crosshair}>
              <View style={styles.crosshairVertical} />
              <View style={styles.crosshairHorizontal} />
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setType(type === "back" ? "front" : "back")}
            disabled={loading}
          >
            <MaterialIcons name="flip-camera-ios" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.captureButton]}
            onPress={takePhoto}
            disabled={loading}
          >
            <MaterialIcons name="camera" size={36} color="white" />
          </TouchableOpacity>
        </View>
      </Camera>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scope: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "red",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  crosshair: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  crosshairVertical: {
    position: "absolute",
    width: 2,
    height: "100%",
    backgroundColor: "red",
    left: "50%",
    marginLeft: -1,
  },
  crosshairHorizontal: {
    position: "absolute",
    width: "100%",
    height: 2,
    backgroundColor: "red",
    top: "50%",
    marginTop: -1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    width: "100%",
  },
  button: {
    padding: 15,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  captureButton: {
    backgroundColor: "#ff4040",
    padding: 20,
  },
  preview: {
    flex: 1,
    width: "100%",
  },
});
