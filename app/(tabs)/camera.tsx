import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { WebView } from "react-native-webview";
import * as MediaLibrary from "expo-media-library";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const webViewRef = useRef<WebView>(null);

  if (!permission || !mediaPermission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.text}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to save images
        </Text>
        <TouchableOpacity
          onPress={requestMediaPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.text}>Grant Media Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraType() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function takePicture() {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `document.querySelector('video').click();`
      );
    }
  }

  function onWebViewMessage(event: any) {
    const data = event.nativeEvent.data;
    if (data.startsWith("data:image")) {
      saveImage(data);
    }
  }

  async function saveImage(uri: string) {
    try {
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log("Photo saved at:", asset.uri);
      Alert.alert("Picture saved!", "Check your gallery.");
    } catch (error) {
      console.error("Error saving image:", error);
    }
  }

  return (
    <View style={styles.container}>
      {/* This hidden WebView captures real camera images */}
      <WebView
        ref={webViewRef}
        source={{ html: getCameraHTML() }}
        onMessage={onWebViewMessage}
        style={styles.hiddenWebView}
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

function getCameraHTML() {
  return `
    <html>
      <body style="margin:0;padding:0;overflow:hidden;">
        <video autoplay playsinline id="video" style="width:100%;height:100%;"></video>
        <canvas id="canvas" style="display:none;"></canvas>
        <script>
          navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            document.getElementById('video').srcObject = stream;
          });

          document.getElementById('video').addEventListener('click', () => {
            const canvas = document.getElementById('canvas');
            const video = document.getElementById('video');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const data = canvas.toDataURL('image/png');
            window.ReactNativeWebView.postMessage(data);
          });
        </script>
      </body>
    </html>
  `;
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
  permissionButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    margin: 20,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#00000080",
    padding: 15,
    borderRadius: 5,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    position: "absolute",
    top: -1000,
    left: -1000,
  },
});
