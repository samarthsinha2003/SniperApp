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
import { powerupsService } from "./powerups";

export interface Snipe {
  id: string;
  sniperId: string;
  targetId: string;
  groupId: string;
  timestamp: Timestamp;
  status: "pending" | "completed" | "dodged";
  photoUri: string;
  points?: number;
  powerups?: {
    doublePoints?: boolean;
    shield?: boolean;
    halfPoints?: boolean;
  };
}

const DODGE_WINDOW_MS = 20000; // 20 seconds in milliseconds

export const snipesService = {
  async createSnipe(
    sniperId: string,
    targetId: string,
    groupId: string,
    photoUri: string
  ): Promise<string> {
    const snipesRef = collection(db, "snipes");
    const snipeDoc = doc(snipesRef);

    // Check for active powerups
    const hasDoublePoints = await powerupsService.checkActivePowerup(
      sniperId,
      "double_points"
    );
    const hasShield = await powerupsService.checkActivePowerup(
      targetId,
      "shield"
    );
    
    // Get target's powerups to check for half_points
    const targetPowerups = await powerupsService.getActivePowerups(targetId);
    const hasHalfPoints = targetPowerups.some(
      (p) => p.type === "half_points" && p.remainingUses > 0
    );

    // Calculate points using powerupsService with both sniper and target IDs
    const points = await powerupsService.calculatePoints(sniperId, targetId, 1);

    const newSnipe: Snipe = {
      id: snipeDoc.id,
      sniperId,
      targetId,
      groupId,
      timestamp: Timestamp.now(),
      status: "pending",
      photoUri,
      points,
      powerups: {
        doublePoints: hasDoublePoints,
        shield: hasShield,
        halfPoints: hasHalfPoints,
      },
    };

    await setDoc(snipeDoc, newSnipe);
    return snipeDoc.id;
  },

  async dodgeSnipe(snipeId: string, targetId: string): Promise<boolean> {
    const snipeRef = doc(db, "snipes", snipeId);
    const userRef = doc(db, "users", targetId);

    const [snipeDoc, userDoc] = await Promise.all([
      getDoc(snipeRef),
      getDoc(userRef),
    ]);

    if (!snipeDoc.exists()) {
      throw new Error("Snipe not found");
    }

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const snipe = snipeDoc.data() as Snipe;
    const userData = userDoc.data();

    // Verify this user is the target
    if (snipe.targetId !== targetId) {
      throw new Error("User is not the target of this snipe");
    }

    // Check for shield powerup
    const hasShield = snipe.powerups?.shield || false;
    let pointsToAdd = 5; // Base points for successful dodge

    if (hasShield) {
      // If shielded, consume the shield and award points
      await powerupsService.consumePowerup(targetId, "shield");
      pointsToAdd = 10; // More points for shielded dodge

      await updateDoc(snipeRef, {
        status: "dodged",
        "powerups.shield": false,
      });
    } else {
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
    }

    // Award points for successful dodge
    const currentPoints = userData.points || 0;
    await updateDoc(userRef, {
      points: currentPoints + pointsToAdd,
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
