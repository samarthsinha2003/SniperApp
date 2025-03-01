import React, { useState, useRef } from "react";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null); // Correct reference to CameraView

  if (!permission || !mediaPermission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  if (!mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to save images
        </Text>
        <Button
          onPress={requestMediaPermission}
          title="Grant Media Permission"
        />
      </View>
    );
  }

  function toggleCameraType() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function takePicture() {
    if (!cameraRef.current) {
      console.error("CameraView reference is null.");
      return;
    }

    try {
      // Take picture using CameraView's takePictureAsync()
      const photo = await cameraRef.current.takePictureAsync();

      if (photo) {
        console.log("Picture taken:", photo.uri);
      } else {
        console.error("Failed to take picture, photo is undefined.");
      }

      // Save the captured image to the gallery
      if (photo) {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        console.log("Photo saved at:", asset.uri);
        alert("Picture saved to gallery!");
      } else {
        console.error("Failed to save picture, photo is undefined.");
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Attach ref to CameraView */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
        <Ionicons name="camera-reverse" size={30} color="white" />
      </TouchableOpacity>

      <View style={styles.captureContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
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
  flipButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
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
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
