import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface Snipe {
  id: string;
  sniperId: string;
  targetId: string;
  groupId: string;
  timestamp: Timestamp;
  status: "pending" | "completed" | "dodged";
  photoUri: string;
}

const DODGE_WINDOW_MS = 5000; // 5 seconds in milliseconds

export const snipesService = {
  async createSnipe(
    sniperId: string,
    targetId: string,
    groupId: string,
    photoUri: string
  ): Promise<string> {
    const snipesRef = collection(db, "snipes");
    const snipeDoc = doc(snipesRef);

    const newSnipe: Snipe = {
      id: snipeDoc.id,
      sniperId,
      targetId,
      groupId,
      timestamp: Timestamp.now(),
      status: "pending",
      photoUri,
    };

    await setDoc(snipeDoc, newSnipe);
    return snipeDoc.id;
  },

  async dodgeSnipe(snipeId: string, targetId: string): Promise<boolean> {
    const snipeRef = doc(db, "snipes", snipeId);
    const snipeDoc = await getDoc(snipeRef);

    if (!snipeDoc.exists()) {
      throw new Error("Snipe not found");
    }

    const snipe = snipeDoc.data() as Snipe;

    // Verify this user is the target
    if (snipe.targetId !== targetId) {
      throw new Error("User is not the target of this snipe");
    }

    // Check if within dodge window
    const now = new Date();
    const snipeTime = snipe.timestamp.toDate();
    const timeDiff = now.getTime() - snipeTime.getTime();

    if (timeDiff > DODGE_WINDOW_MS) {
      throw new Error("Dodge window has expired");
    }

    // Update snipe status to dodged
    await updateDoc(snipeRef, {
      status: "dodged",
    });

    return true;
  },

  async getActiveSnipesForTarget(targetId: string): Promise<Snipe[]> {
    const snipesRef = collection(db, "snipes");
    const q = query(
      snipesRef,
      where("targetId", "==", targetId),
      where("status", "==", "pending")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Snipe);
  },
};
