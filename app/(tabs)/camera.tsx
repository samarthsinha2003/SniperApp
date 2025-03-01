import React, { useState, useRef } from "react";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Platform,
  Image,
  Alert, // Import Alert for better feedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot"; // Capture the camera + overlay

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const cameraContainerRef = useRef<View>(null); // Ref to capture view
  const cameraRef = useRef<CameraView>(null); // Camera reference

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
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function toggleCameraType() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function takePicture() {
    if (!cameraRef.current || !cameraContainerRef.current) {
      console.error("Camera or container reference is null.");
      return;
    }

    try {
      // Take the photo first
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error("Failed to take photo");
      }

      // Now capture the entire view including the overlay
      const finalUri = await captureRef(cameraContainerRef, {
        format: "jpg",
        quality: 0.8,
        result: "tmpfile",
      });

      // Save the final image to the gallery
      if (finalUri) {
        const asset = await MediaLibrary.createAssetAsync(finalUri);
        console.log("Photo saved successfully at:", asset.uri);
        Alert.alert(
          "Success",
          "Picture saved to gallery!",
          [{ text: "OK", onPress: () => console.log("OK Pressed") }],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert(
        "Error",
        "Failed to save the picture. Please try again.",
        [{ text: "OK", onPress: () => console.log("OK Pressed") }],
        { cancelable: false }
      );
    }
  }

  const ButtonBackground = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === "ios") {
      return (
        <BlurView intensity={50} tint="dark" style={styles.buttonBlur}>
          {children}
        </BlurView>
      );
    }
    return (
      <View
        style={[styles.buttonBlur, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      >
        {children}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Attach ref to ensure captureRef() works */}
      <View
        ref={cameraContainerRef}
        collapsable={false}
        style={styles.cameraContainer}
      >
        {/* Camera Feed */}
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

        {/* Sniper Scope Overlay */}
        <Image
          source={require("../../assets/images/tempsniperlogo.png")}
          style={styles.sniperScope}
        />

        <View style={styles.overlay}>
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleCameraType}
            >
              <ButtonBackground>
                <MaterialIcons name="flip-camera-ios" size={24} color="white" />
              </ButtonBackground>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureOuter}>
                <View style={styles.captureInner} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black", // Ensure black background
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
  cameraContainer: {
    flex: 1,
    width: "100%",
    height: "100%", // Ensure full height
    position: "relative",
  },
  camera: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sniperScope: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    zIndex: 2, // Ensure buttons are on top of the scope
  },
  topButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  buttonBlur: {
    borderRadius: 25,
    overflow: "hidden",
    padding: 12,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
