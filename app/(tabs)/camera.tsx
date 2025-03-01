import React, { useState, useRef } from "react";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot"; // Capture the camera + overlay

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const cameraContainerRef = useRef<View>(null); // Ref to capture view
  const cameraRef = useRef<CameraView>(null); // Camera reference

  if (!permission || !mediaPermission) return <View />;

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
    if (!cameraContainerRef.current) {
      console.error("Error: Camera container reference is null.");
      return;
    }

    try {
      // Add a slight delay to ensure the camera view is rendered
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capture the camera view with the sniper overlay
      const uri = await captureRef(cameraContainerRef, {
        format: "jpg",
        quality: 0.8,
        result: "tmpfile", // Ensures the file is stored properly
      });

      console.log("Picture taken with overlay:", uri);

      // Save the captured image to the gallery
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log("Photo saved at:", asset.uri);
      alert("Picture saved to gallery!");
    } catch (error) {
      console.error("Error capturing image:", error);
    }
  }

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
          source={require("../assets/image.png")}
          style={styles.sniperScope}
        />
      </View>

      {/* UI Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.text}>Take Picture</Text>
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
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
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
  buttonContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-around",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#00000080",
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
