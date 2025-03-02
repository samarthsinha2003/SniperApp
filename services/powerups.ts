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

    // Check if user already has an active powerup of this type
    const hasActivePowerup = currentPowerups.some(
      (p) => p.type === type && p.remainingUses > 0
    );

    // For shield powerups, we'll stack them by adding to remainingUses if one is active
    if (hasActivePowerup && type === "shield") {
      const existingShield = currentPowerups.find(
        (p) => p.type === "shield" && p.remainingUses > 0
      );
      if (existingShield) {
        const updatedPowerups = currentPowerups.map((p) =>
          p.id === existingShield.id
            ? { ...p, remainingUses: p.remainingUses + 1 }
            : p
        );
        await updateDoc(userRef, {
          activePowerups: updatedPowerups,
        });
        return;
      }
    } else if (hasActivePowerup) {
      throw new Error("Item currently in use.");
    }

    // Add new powerup with appropriate remaining uses
    const newPowerup: ActivePowerup = {
      id: powerupId,
      type,
      remainingUses: type === "half_points" ? 3 : type === "double_points" ? 8 : 1,
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

    const currentPowerups: ActivePowerup[] = userDoc.data()?.activePowerups || [];
    const powerupIndex = currentPowerups.findIndex((p) => p.type === type);

    if (powerupIndex === -1) return;

    const powerupToConsume = currentPowerups[powerupIndex];
    const updatedPowerup = {
      ...powerupToConsume,
      remainingUses: powerupToConsume.remainingUses - 1,
    };

    // Remove powerup if no uses remaining, otherwise update its uses
    const newPowerups = currentPowerups.filter((_, index) => index !== powerupIndex);
    if (updatedPowerup.remainingUses > 0) {
      newPowerups.push(updatedPowerup);
    } else {
      // When powerup is fully consumed, remove it from inventory
      const inventory = userDoc.data()?.inventory || [];
      const updatedInventory = inventory.filter(
        (item: any) => !(item.id === powerupToConsume.id && item.used === true)
      );

      await updateDoc(userRef, {
        activePowerups: newPowerups,
        inventory: updatedInventory
      });
      return;
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

    // Only apply powerup effects if target doesn't have shield
    const hasShield = targetPowerups.some((p) => p.type === "shield" && p.remainingUses > 0);
    
    if (!hasShield) {
      // Apply double points from sniper if they have it
      if (sniperPowerups.some((p) => p.type === "double_points")) {
        points *= 2;
        await this.consumePowerup(sniperId, "double_points");
      }

      // Apply half points from target if they have it
      if (targetPowerups.some((p) => p.type === "half_points")) {
        points *= 0.5;
        await this.consumePowerup(targetId, "half_points");
      }
    }

    return points;
  },
};
