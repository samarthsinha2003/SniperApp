import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { shopItems } from "../app/(tabs)/shop";
import { StoreItem } from "./store";

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

    // Get duration from shop item
    const shopItem = shopItems.find((item) => item.id === powerupId);
    if (!shopItem) throw new Error("Powerup not found in shop");

    const duration = shopItem.duration || 1;

    // Add new powerup
    const newPowerup: ActivePowerup = {
      id: powerupId,
      type,
      remainingUses: duration,
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

  async calculatePoints(
    sniperId: string,
    targetId: string,
    basePoints: number
  ): Promise<number> {
    const [sniperPowerups, targetPowerups] = await Promise.all([
      this.getActivePowerups(sniperId),
      this.getActivePowerups(targetId),
    ]);

    let points = basePoints;

    // Check for double points on the sniper
    if (sniperPowerups.some((p) => p.type === "double_points")) {
      points *= 2;
      await this.consumePowerup(sniperId, "double_points");
    }

    // Check for half points on the target
    if (targetPowerups.some((p) => p.type === "half_points")) {
      points *= 0.5;
      await this.consumePowerup(targetId, "half_points");
    }

    return points;
  },
};
