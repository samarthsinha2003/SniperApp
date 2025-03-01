import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as Sharing from "expo-sharing";

export interface PhotoMetadata {
  id: string;
  uri: string;
  targetId: string;
  groupId: string;
  timestamp: number;
}

export const photosService = {
  async savePhoto(photoUri: string): Promise<string> {
    try {
      // Create photos directory if it doesn't exist
      const photosDir = `${FileSystem.documentDirectory}photos`;
      const photosDirInfo = await FileSystem.getInfoAsync(photosDir);

      if (!photosDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir);
      }

      // Generate unique filename
      const filename = `${Date.now()}.jpg`;
      const newUri = `${photosDir}/${filename}`;

      // Optimize and save the photo
      const optimizedPhoto = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Copy the optimized photo to our app's directory
      await FileSystem.copyAsync({
        from: optimizedPhoto.uri,
        to: newUri,
      });

      return newUri;
    } catch (error) {
      console.error("Error saving photo:", error);
      throw new Error("Failed to save photo");
    }
  },

  async sharePhoto(photoUri: string, targetName: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(photoUri, {
          mimeType: "image/jpeg",
          dialogTitle: `You sniped ${targetName}!`,
        });
      } catch (error) {
        console.error("Error sharing photo:", error);
        throw new Error("Failed to share photo");
      }
    } else {
      throw new Error("Sharing is not available on this device");
    }
  },

  async deletePhoto(photoUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(photoUri);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw new Error("Failed to delete photo");
    }
  },

  async clearPhotos(): Promise<void> {
    try {
      const photosDir = `${FileSystem.documentDirectory}photos`;
      const photosDirInfo = await FileSystem.getInfoAsync(photosDir);

      if (photosDirInfo.exists) {
        await FileSystem.deleteAsync(photosDir);
      }
    } catch (error) {
      console.error("Error clearing photos:", error);
      throw new Error("Failed to clear photos");
    }
  },

  getPhotosDirectory(): string {
    return `${FileSystem.documentDirectory}photos`;
  },
};
