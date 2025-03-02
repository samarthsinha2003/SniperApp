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
  AppState,
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
import { snipesService, Snipe } from "../../services/snipes";
import DodgeAlert from "../../components/DodgeAlert";
import CountdownTimer from "../../components/CountdownTimer";
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import ImageEditor from "../../components/ImageEditor";

export default function CameraScreen() {
  const { user, signOut } = useAuth();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<Target[]>([]);
  const [activeSnipe, setActiveSnipe] = useState<Snipe | null>(null);
  const [countdownEndTime, setCountdownEndTime] = useState<Date | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadTargets();

    // Set up snipe listener
    if (user?.id) {
      const q = query(
        collection(db, "snipes"),
        where("targetId", "==", user.id),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const snipeData = change.doc.data() as Snipe;
            setActiveSnipe(snipeData);
          }
        });
      });

      // Handle app state changes
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
          ) {
            // App has come to foreground - check for active snipes
            snipesService.getActiveSnipesForTarget(user.id).then((snipes) => {
              if (snipes.length > 0) {
                setActiveSnipe(snipes[0]);
              }
            });
          }
          appState.current = nextAppState;
        }
      );

      return () => {
        unsubscribe();
        subscription.remove();
      };
    }
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
      if (!user || !lastPhotoUri) return;

      // Create a new snipe
      const snipeId = await snipesService.createSnipe(
        user.id,
        target.id,
        target.groupId,
        lastPhotoUri
      );

      setModalVisible(false);
      setLastPhotoUri(null);

      // Set countdown end time
      const endTime = new Date(Date.now() + 5000); // 5 seconds from now
      setCountdownEndTime(endTime);

      Alert.alert(
        "Success",
        `You sniped ${target.name}! They have 5 seconds to dodge.`
      );

      // Wait for 5 seconds or until dodged
      const timeoutId = setTimeout(async () => {
        const snipeDoc = await getDoc(doc(db, "snipes", snipeId));
        if (snipeDoc.exists()) {
          const snipeData = snipeDoc.data() as Snipe;
          if (snipeData.status === "pending") {
            // If not dodged, award points to sniper based on powerups
            await updateDoc(doc(db, "snipes", snipeId), {
              status: "completed",
            });

            // Get final points value from snipe
            const points = snipeData.points || 1; // Default to 10 if not set
            await groupsService.updatePoints(target.groupId, user.id, points);
            Alert.alert("Success", `You earned ${points} points!`);

            loadTargets(); // Refresh targets to update points
            setCountdownEndTime(null);
          }
        }
      }, 5000);
    } catch (error) {
      console.error("Error creating snipe:", error);
      Alert.alert("Error", "Failed to snipe target");
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
        // Show the editor instead of saving directly
        setLastPhotoUri(photo.uri);
        setShowEditor(true);
      } else {
        console.error("Failed to take picture, photo is undefined.");
        Alert.alert("Error", "Failed to take picture");
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take or save picture");
    }
  }

  const handleEditorSave = async (editedUri: string) => {
    setShowEditor(false);
    setLastPhotoUri(editedUri);
    setModalVisible(true);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    setLastPhotoUri(null);
  };

  return (
    <View style={styles.container}>
      {showEditor && lastPhotoUri ? (
        <ImageEditor
          imageUri={lastPhotoUri}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      ) : (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <MaterialIcons name="logout" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </>
      )}
      <TargetSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectTarget={handleTargetSelection}
        targets={availableTargets}
      />
      {countdownEndTime && (
        <CountdownTimer
          endTime={countdownEndTime}
          onComplete={() => setCountdownEndTime(null)}
        />
      )}
      {activeSnipe && (
        <DodgeAlert
          snipe={activeSnipe}
          onDodged={() => {
            setActiveSnipe(null);
            setCountdownEndTime(null);
            loadTargets(); // Refresh targets to update points
          }}
          onExpired={() => {
            setActiveSnipe(null);
          }}
        />
      )}
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
