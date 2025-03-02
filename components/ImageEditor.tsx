import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  PanResponder,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import ViewShot, { captureRef } from "react-native-view-shot";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

interface ImageEditorProps {
  imageUri: string;
  onSave: (uri: string) => void;
  onCancel: () => void;
}

const logoMap = {
  logo1: require("../assets/images/logo-classic.png"),
  logo2: require("../assets/images/logo-skull.png"),
  logo3: require("../assets/images/logo-elite.png"),
  default: require("../assets/images/tempsniperlogo.png"),
};

export default function ImageEditor({
  imageUri,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeLogo, setActiveLogo] = useState(null);
  const viewShotRef = useRef<ViewShot>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const { user } = useAuth();

  useEffect(() => {
    const loadUserLogo = async () => {
      if (user?.id) {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setActiveLogo(userData.activeLogo || "logo1"); // Default to logo1 if none set
        }
      }
    };
    loadUserLogo();
  }, [user?.id]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Store the current position
      pan.setOffset({
        x: position.x,
        y: position.y,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
      // Update position state during movement
      const newX = Math.max(
        0,
        Math.min(position.x + gestureState.dx, imageSize.width - 100)
      );
      const newY = Math.max(
        0,
        Math.min(position.y + gestureState.dy, imageSize.height - 100)
      );
      setPosition({ x: newX, y: newY });
    },
    onPanResponderRelease: () => {
      pan.flattenOffset();
    },
  });

  const handleImageLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setImageSize({ width, height });
    // Initially center the scope
    const initialX = width / 2 - 50;
    const initialY = height / 2 - 50;
    setPosition({ x: initialX, y: initialY });
    pan.setValue({ x: initialX, y: initialY });
  };

  const handleSave = async () => {
    try {
      if (!viewShotRef.current) return;

      const uri = await captureRef(viewShotRef, {
        format: "jpg",
        quality: 0.8,
      });

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );

      const asset = await MediaLibrary.createAssetAsync(result.uri);
      onSave(asset.uri);
    } catch (error) {
      console.error("Error saving edited image:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          onLayout={handleImageLayout}
        />
        <Animated.View
          style={[
            styles.sniperScopeContainer,
            {
              transform: [
                {
                  translateX: position.x,
                },
                {
                  translateY: position.y,
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={
              activeLogo
                ? logoMap[activeLogo]
                : require("../assets/images/tempsniperlogo.png")
            }
            style={activeLogo ? styles.sniperScope : styles.redTintedScope}
          />
        </Animated.View>
      </ViewShot>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.dragHint}>Drag the scope to position it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  sniperScopeContainer: {
    position: "absolute",
    width: 100,
    height: 100,
  },
  sniperScope: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  redTintedScope: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    tintColor: "red",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "space-between",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#333",
    width: "45%",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4a00e0",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dragHint: {
    color: "white",
    textAlign: "center",
    paddingBottom: 20,
    opacity: 0.8,
  },
});
