import React, { useState, useRef, useEffect } from "react";
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
import { Asset } from "expo-asset"; // ✅ Import expo-asset

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [sniperBase64, setSniperBase64] = useState<string | null>(null);

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

  // ✅ Function to load sniper scope image into Base64 (runs on app start)
  useEffect(() => {
    async function loadSniperImage() {
      try {
        // Load sniper scope image as asset
        const sniperAsset = Asset.fromModule(
          require("../../assets/images/tempsniperlogo.png")
        );
        await sniperAsset.downloadAsync(); // Ensure it's downloaded

        // Copy sniper image to app's document directory
        const sniperUri = `${FileSystem.documentDirectory}tempsniperlogo.png`;
        if (!sniperAsset.localUri) {
          throw new Error("Sniper asset URI is null");
        }
        await FileSystem.copyAsync({
          from: sniperAsset.localUri,
          to: sniperUri,
        });

        // Convert to Base64
        const base64 = await FileSystem.readAsStringAsync(sniperUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setSniperBase64(`data:image/png;base64,${base64}`); // ✅ Set state with Base64
      } catch (error) {
        console.error("Error loading sniper image:", error);
      }
    }

    loadSniperImage();
  }, []);

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

      if (!sniperBase64) {
        Alert.alert("Error", "Sniper scope image not loaded");
        return;
      }

      // 3. Send both image URIs to WebView for merging
      const message = JSON.stringify({
        cameraUri: photo.uri,
        sniperBase64: sniperBase64, // ✅ Send Base64 instead of a URI
      });

      webViewRef.current?.injectJavaScript(`mergeImages('${message}')`);
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  }

  const handleWebViewMessage = async (event: any) => {
    const data = event.nativeEvent.data; // Should be a base64 string
    if (!data.startsWith("data:image")) {
      console.error("Invalid data from WebView");
      return;
    }

    try {
      // 3. Save base64 to file
      const fileUri = FileSystem.documentDirectory + "sniper_photo.jpg";
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
              const sniperImg = await loadImage(sniperBase64);

              const canvas = document.getElementById('canvas');
              const ctx = canvas.getContext('2d');

              ctx.drawImage(cameraImg, 0, 0, canvas.width, canvas.height);
              ctx.drawImage(sniperImg, 0, 0, canvas.width, canvas.height);

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
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      <WebView
        ref={webViewRef}
        source={{ html: getMergeHTML() }}
        onMessage={handleWebViewMessage}
        style={{ width: 1, height: 1, position: "absolute", top: -9999 }}
      />

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
