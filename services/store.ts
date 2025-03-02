import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { User, Group } from "./groups";
import { powerupsService } from "./powerups";
import { shopItems } from "../app/(tabs)/shop";

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  type: "crosshair" | "powerup" | "logo";
  effect?: "double_points" | "shield" | "half_points";
  duration?: number;
}

export interface UserInventory {
  points: number;
  items: {
    id: string;
    purchasedAt: number;
    used?: boolean;
  }[];
}

export const store = {
  async setDefaultLogo(userId: string): Promise<boolean> {
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, {
        activeLogo: "default", // null means use the default logo
      });
      return true;
    } catch (error) {
      console.error("Failed to reset logo:", error);
      return false;
    }
  },
  async getUserInventory(userId: string): Promise<UserInventory> {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    return {
      points: userDoc.data()?.points || 0,
      items: userDoc.data()?.inventory || [],
    };
  },

  async updateGroupPoints(userId: string, newPoints: number): Promise<void> {
    // Get all groups the user is in
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as User;
    const groups = userData.groups || [];

    // Update points in each group
    for (const groupId of groups) {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) continue;

      const group = groupDoc.data() as Group;
      const memberIndex = group.members.findIndex((m) => m.id === userId);

      if (memberIndex !== -1) {
        const updatedMembers = [...group.members];
        updatedMembers[memberIndex] = {
          ...updatedMembers[memberIndex],
          points: newPoints, // Set to the new total points
        };

        await updateDoc(groupRef, { members: updatedMembers });
      }
    }
  },

  async purchaseItem(userId: string, item: StoreItem): Promise<boolean> {
    const userRef = doc(db, "users", userId);

    try {
      let newPoints = 0;
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        const currentPoints = userData?.points || 0;

        if (currentPoints < item.price) {
          throw new Error("Insufficient points");
        }

        newPoints = currentPoints - item.price;

        // Get current inventory
        const currentInventory = userData?.inventory || [];

        // For powerups, check if unused one exists
        if (item.type === "powerup") {
          const hasUnusedPowerup = currentInventory.some(
            (invItem: any) => invItem.id === item.id && !invItem.used
          );
          if (hasUnusedPowerup) {
            throw new Error("You already have an unused powerup of this type");
          }
        }

        // Add new item to inventory
        const updateData: any = {
          points: newPoints,
          inventory: [
            ...currentInventory,
            {
              id: item.id,
              purchasedAt: Date.now(),
              used: false,
            },
          ],
        };

        // If it's a logo item, set it as the active logo
        if (item.type === "logo") {
          updateData.activeLogo = item.id;
        }

        transaction.update(userRef, updateData);
      });

      // After successful transaction, update points in all groups
      await this.updateGroupPoints(userId, newPoints);
      return true;
    } catch (error) {
      console.error("Purchase failed:", error);
      return false;
    }
  },

  async useItem(userId: string, itemId: string): Promise<boolean> {
    const userRef = doc(db, "users", userId);

    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const inventory = userDoc.data()?.inventory || [];
      const itemIndex = inventory.findIndex(
        (item: any) => item.id === itemId && !item.used
      );

      if (itemIndex === -1) {
        throw new Error("Item not found or already used");
      }

      // Find the store item to get its type and effect
      const storeItem = shopItems.find((item) => item.id === itemId);
      if (!storeItem) {
        throw new Error("Invalid item");
      }

      // Handle differently based on item type
      if (storeItem.type === "logo") {
        // For logos, don't mark as used, just update the active logo
        await updateDoc(userRef, {
          activeLogo: itemId,
        });
      } else if (storeItem.type === "powerup" && storeItem.effect) {
        try {
          // For powerups, activate the powerup first
          await powerupsService.activatePowerup(
            userId,
            itemId,
            storeItem.effect
          );

          // Mark item as used only after successful activation
          const updatedInventory = [...inventory];
          updatedInventory[itemIndex] = {
            ...updatedInventory[itemIndex],
            used: true,
          };

          await updateDoc(userRef, {
            inventory: updatedInventory,
          });
        } catch (error) {
          // If activation fails (e.g. already has active powerup), propagate error
          throw error;
        }
      }

      return true;
    } catch (error) {
      console.error("Use item failed:", error);
      throw error; // Propagate error to show proper message to user
    }
  },
};
