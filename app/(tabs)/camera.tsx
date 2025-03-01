import React, { useState, useRef } from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();

  const cameraRef = useRef<CameraView>(null);
  const webViewRef = useRef<WebView>(null);

  if (!permission || !mediaPermission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>We need your permission to use the camera</Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }
  if (!mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <Text>We need your permission to save images</Text>
        <Button
          onPress={requestMediaPermission}
          title="Grant Media Permission"
        />
      </View>
    );
  }

  const toggleCameraType = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Function to convert sniper image to Base64
  async function getSniperImageBase64() {
    try {
      const sniperUri = require("../../assets/images/tempsniperlogo.png");
      const base64 = await FileSystem.readAsStringAsync(sniperUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/png;base64,${base64}`; // Return in proper format for WebView
    } catch (error) {
      console.error("Error converting sniper image to Base64:", error);
      return null;
    }
  }

  async function takePicture() {
    if (!cameraRef.current) {
      console.error("Error: Camera reference is null.");
      return;
    }

    try {
      // 1. Capture camera photo
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo?.uri) {
        Alert.alert("Error", "No photo captured");
        return;
      }

      console.log("Camera photo URI:", photo.uri);

      // 2. Convert sniper scope image to base64
      const sniperBase64 = await getSniperImageBase64();
      if (!sniperBase64) {
        Alert.alert("Error", "Sniper scope image could not be loaded");
        return;
      }

      // 3. Send both image URIs to WebView for merging
      const message = JSON.stringify({
        cameraUri: photo.uri,
        sniperBase64: sniperBase64, // Send Base64 instead of a URI
      });

      webViewRef.current?.injectJavaScript(`mergeImages('${message}')`);
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  }

  const handleWebViewMessage = async (event: any) => {
    // This is called when the WebView posts a message
    const data = event.nativeEvent.data; // Should be a base64 string
    if (!data.startsWith("data:image")) {
      console.error("Invalid data from WebView");
      return;
    }

    try {
      // 3. Save base64 to file
      const fileUri = FileSystem.documentDirectory + "sniper_photo.jpg";
      // Remove the 'data:image/jpeg;base64,' prefix if needed
      const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 4. Save to gallery
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      Alert.alert("Saved!", "Sniper photo saved to gallery");
    } catch (err) {
      console.error("Error saving merged image:", err);
    }
  };

  // 5. The HTML for merging images in a hidden WebView
  // We define a small script that merges images on a <canvas>
  // and calls postMessage with the base64 result
  const getMergeHTML = () => `
    <html>
      <body>
        <canvas id="canvas" width="1080" height="1920" style="display:none;"></canvas>
        <script>
          function loadImage(src) {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = src;
            });
          }

          async function mergeImages(jsonStr) {
            const data = JSON.parse(jsonStr);
            const { cameraUri, sniperBase64 } = data;

            try {
              const cameraImg = await loadImage(cameraUri);
              const sniperImg = await loadImage(sniperBase64); // Load Base64 image

              const canvas = document.getElementById('canvas');
              const ctx = canvas.getContext('2d');

              ctx.drawImage(cameraImg, 0, 0, canvas.width, canvas.height);
              ctx.drawImage(sniperImg, 0, 0, canvas.width, canvas.height); // Draw sniper overlay

              const mergedBase64 = canvas.toDataURL('image/jpeg', 0.8);
              window.ReactNativeWebView.postMessage(mergedBase64);
            } catch (err) {
              window.ReactNativeWebView.postMessage('ERROR:' + err);
            }
          }
          window.mergeImages = mergeImages;
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* 6. The Camera View */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      {/* 7. Hidden WebView for compositing images */}
      <WebView
        ref={webViewRef}
        source={{ html: getMergeHTML() }}
        onMessage={handleWebViewMessage}
        style={{ width: 1, height: 1, position: "absolute", top: -9999 }}
      />

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
  container: { flex: 1, justifyContent: "center" },
  camera: { flex: 1 },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "space-around",
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#00000080",
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 18,
    color: "#fff",
  },
});
