import React, { useState, useRef } from "react";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as MediaLibrary from "expo-media-library";

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
