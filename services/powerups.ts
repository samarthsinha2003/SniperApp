import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export interface ActivePowerup {
  id: string;
  type: "double_points" | "shield" | "half_points";
  remainingUses: number;
  activatedAt: number;
}

export const powerupsService = {
  async getActivePowerups(userId: string): Promise<ActivePowerup[]> {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return [];
    return userDoc.data()?.activePowerups || [];
  },

  async activatePowerup(
    userId: string,
    powerupId: string,
    type: ActivePowerup["type"]
  ): Promise<void> {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) throw new Error("User not found");

    const currentPowerups: ActivePowerup[] =
      userDoc.data()?.activePowerups || [];

    // Add new powerup
    const newPowerup: ActivePowerup = {
      id: powerupId,
      type,
      remainingUses: type === "double_points" ? 2 : 1, // double points lasts 2 snipes, others 1
      activatedAt: Date.now(),
    };

    await updateDoc(userRef, {
      activePowerups: [...currentPowerups, newPowerup],
    });
  },

  async consumePowerup(
    userId: string,
    type: ActivePowerup["type"]
  ): Promise<void> {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const currentPowerups: ActivePowerup[] =
      userDoc.data()?.activePowerups || [];
    const powerupIndex = currentPowerups.findIndex((p) => p.type === type);

    if (powerupIndex === -1) return;

    const updatedPowerup = {
      ...currentPowerups[powerupIndex],
      remainingUses: currentPowerups[powerupIndex].remainingUses - 1,
    };

    // Remove powerup if no uses remaining, otherwise update its uses
    const newPowerups = currentPowerups.filter(
      (_, index) => index !== powerupIndex
    );
    if (updatedPowerup.remainingUses > 0) {
      newPowerups.push(updatedPowerup);
    }

    await updateDoc(userRef, {
      activePowerups: newPowerups,
    });
  },

  async checkActivePowerup(
    userId: string,
    type: ActivePowerup["type"]
  ): Promise<boolean> {
    const powerups = await this.getActivePowerups(userId);
    return powerups.some((p) => p.type === type);
  },

  async calculatePoints(userId: string, basePoints: number): Promise<number> {
    const powerups = await this.getActivePowerups(userId);
    const hasDoublePoints = powerups.some((p) => p.type === "double_points");
    const hasHalfPoints = powerups.some((p) => p.type === "half_points");

    let points = basePoints;
    if (hasDoublePoints) {
      points *= 2;
      await this.consumePowerup(userId, "double_points");
    }
    if (hasHalfPoints) {
      points *= 0.5;
      await this.consumePowerup(userId, "half_points");
    }

    return points;
  },
};
