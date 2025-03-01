import React, { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  TargetSelectionModal,
  Target,
} from "../../components/TargetSelectionModal";
import { useAuth } from "../../contexts/AuthContext";
import { groupsService } from "../../services/groups";

export default function CameraScreen() {
  const { user, signOut } = useAuth();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [availableTargets, setAvailableTargets] = useState<Target[]>([]);

  useEffect(() => {
    loadTargets();
  }, [user]);

  const loadTargets = async () => {
    if (!user) return;
    try {
      const groups = await groupsService.getUserGroups(user.id);
      const targets: Target[] = [];

      groups.forEach((group) => {
        group.members.forEach((member) => {
          if (member.id !== user.id) {
            // Don't include yourself as a target
            targets.push({
              id: member.id,
              name: member.name,
              points: member.points,
              groupId: group.id,
            });
          }
        });
      });

      setAvailableTargets(targets);
    } catch (error) {
      console.error("Error loading targets:", error);
    }
  };

  if (!permission || !mediaPermission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.permissionContainer}>
          <MaterialIcons
            name="camera-alt"
            size={64}
            color="white"
            style={styles.permissionIcon}
          />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionMessage}>
            We need your permission to use the camera to take snipe photos.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              style={styles.permissionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#4a00e0", "#8e2de2"]}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.permissionContainer}>
            <MaterialIcons
              name="photo-library"
              size={64}
              color="white"
              style={styles.permissionIcon}
            />
            <Text style={styles.permissionTitle}>Storage Access Needed</Text>
            <Text style={styles.permissionMessage}>
              We need your permission to save photos to your gallery.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestMediaPermission}
            >
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                style={styles.permissionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.permissionButtonText}>
                  Grant Permission
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  function toggleCameraType() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const handleTargetSelection = async (target: Target) => {
    try {
      if (!user) return;
      await groupsService.updatePoints(target.groupId, user.id, 1); // Add 1 point to the sniper
      setModalVisible(false);
      setLastPhotoUri(null);
      Alert.alert("Success", `You sniped ${target.name}!`);
      loadTargets(); // Refresh targets to update points
    } catch (error) {
      console.error("Error updating points:", error);
      Alert.alert("Error", "Failed to update points");
    }
  };

  async function takePicture() {
    if (!cameraRef.current) {
      console.error("CameraView reference is null.");
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync();

      if (photo) {
        console.log("Picture taken:", photo.uri);
        // Save the captured image to the gallery
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        console.log("Photo saved at:", asset.uri);

        // Store the photo URI and show the target selection modal
        setLastPhotoUri(asset.uri);
        setModalVisible(true);
      } else {
        console.error("Failed to take picture, photo is undefined.");
        Alert.alert("Error", "Failed to take picture");
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take or save picture");
    }
  }

  return (
    <View style={styles.container}>
      {/* Attach ref to CameraView */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
          <Ionicons name="camera-reverse" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.captureContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>

      <TargetSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectTarget={handleTargetSelection}
        targets={availableTargets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  captureContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  topButtons: {
    position: "absolute",
    top: 60,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "white",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    width: "100%",
    maxWidth: 300,
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
  permissionButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
