import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, GestureResponderEvent, PanResponder } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface ImageEditorProps {
  imageUri: string;
  onSave: (uri: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageUri, onSave, onCancel }: ImageEditorProps) {
  const [sniperPosition, setSniperPosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const viewShotRef = useRef<ViewShot>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      setSniperPosition({
        x: Math.max(0, Math.min(locationX - 50, imageSize.width - 100)),
        y: Math.max(0, Math.min(locationY - 50, imageSize.height - 100))
      });
    },
  });

  const handleImageLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setImageSize({ width, height });
    // Initially center the scope
    setSniperPosition({ 
      x: width / 2 - 50,
      y: height / 2 - 50
    });
  };

  const handleSave = async () => {
    try {
      if (!viewShotRef.current) return;

      // Capture the view as it appears using captureRef
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.8,
      });
      
      // Optimize the image
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(result.uri);
      onSave(asset.uri);
    } catch (error) {
      console.error('Error saving edited image:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot 
        ref={viewShotRef}
        style={styles.imageContainer}
        {...panResponder.panHandlers}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          onLayout={handleImageLayout}
        />
        <Image
          source={require('../assets/images/tempsniperlogo.png')}
          style={[
            styles.sniperScope,
            {
              left: sniperPosition.x,
              top: sniperPosition.y,
            },
          ]}
        />
      </ViewShot>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  sniperScope: {
    position: 'absolute',
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#333',
    width: '45%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4a00e0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});