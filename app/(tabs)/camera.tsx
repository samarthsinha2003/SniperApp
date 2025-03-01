import React, { useState, useRef } from "react";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot"; // Used to capture only CameraView

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const cameraViewRef = useRef(null); // Reference to CameraView

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
    try {
      if (cameraViewRef.current) {
        // Capture only the CameraView, not the entire screen
        const uri = await captureRef(cameraViewRef, {
          format: "jpg",
          quality: 0.8,
        });

        console.log("Picture taken:", uri);

        // Save the captured image to the gallery
        const asset = await MediaLibrary.createAssetAsync(uri);
        console.log("Photo saved at:", asset.uri);
        alert("Picture saved to gallery!");
      } else {
        console.error("CameraView reference is null.");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Wrap CameraView inside a View and assign ref */}
      <View ref={cameraViewRef} style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} />
      </View>

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
    overflow: "hidden", // Ensure UI elements don’t appear in screenshots
  },
  camera: {
    flex: 1,
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
