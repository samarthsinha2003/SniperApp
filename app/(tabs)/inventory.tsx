import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { store, UserInventory, StoreItem } from "../../services/store";
import { shopItems } from "./shop";

export default function InventoryScreen() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [user?.id]);

  const loadInventory = async () => {
    if (!user?.id) return;
    try {
      const userInventory = await store.getUserInventory(user.id);
      setInventory(userInventory);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      Alert.alert("Error", "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleUseItem = async (itemId: string, itemName: string) => {
    if (!user?.id) return;

    Alert.alert("Use Item", `Do you want to use ${itemName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Use",
        onPress: async () => {
          try {
            const success = await store.useItem(user.id, itemId);
            if (success) {
              Alert.alert("Success", `${itemName} has been activated!`);
              loadInventory(); // Refresh inventory
            } else {
              Alert.alert("Error", "Failed to use item");
            }
          } catch (error) {
            console.error("Failed to use item:", error);
            Alert.alert("Error", "Failed to use item");
          }
        },
      },
    ]);
  };

  const renderInventoryItem = (inventoryItem: any, storeItem: StoreItem) => {
    const isUsed = inventoryItem.used;
    return (
      <TouchableOpacity
        key={`${inventoryItem.id}-${inventoryItem.purchasedAt}`}
        style={[
          styles.itemCard,
          {
            opacity: isUsed ? 0.5 : 1,
          },
        ]}
        onPress={() =>
          !isUsed && handleUseItem(inventoryItem.id, storeItem.name)
        }
        disabled={isUsed}
      >
        <View style={styles.itemIcon}>
          <MaterialIcons
            name={storeItem.icon as any}
            size={36}
            color="#ff6f00"
          />
        </View>
        <ThemedText style={[styles.itemName, { color: "#333" }]}>
          {storeItem.name}
        </ThemedText>
        <ThemedText style={[styles.itemDescription, { color: "#555" }]}>
          {storeItem.description}
        </ThemedText>
        <ThemedText style={styles.purchaseDate}>
          Purchased: {new Date(inventoryItem.purchasedAt).toLocaleDateString()}
        </ThemedText>
        {isUsed && (
          <View style={styles.usedBadge}>
            <ThemedText style={styles.usedText}>USED</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderInventorySection = (type: "crosshair" | "powerup" | "logo") => {
    if (!inventory) return null;

    const items = inventory.items.filter((item) => {
      const storeItem = shopItems.find((si: StoreItem) => si.id === item.id);
      return storeItem?.type === type;
    });

    if (items.length === 0) return null;

    return (
      <>
        <ThemedText style={[styles.sectionTitle, { color: "#fff" }]}>
          {type === "crosshair"
            ? "Crosshairs"
            : type === "powerup"
            ? "Power-ups"
            : "Sniper Logos"}
        </ThemedText>
        <View style={styles.itemsGrid}>
          {items.map((item) => {
            const storeItem = shopItems.find(
              (si: StoreItem) => si.id === item.id
            );
            if (!storeItem) return null;
            return renderInventoryItem(item, storeItem);
          })}
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Loading inventory...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: "#fff" }]}>
          Inventory
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        {inventory?.items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inventory" size={48} color="#fff" />
            <ThemedText style={styles.emptyText}>
              Your inventory is empty.{"\n"}Visit the shop to buy items!
            </ThemedText>
          </View>
        ) : (
          <>
            {renderInventorySection("powerup")}
            {renderInventorySection("crosshair")}
            {renderInventorySection("logo")}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: "48%",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  itemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffcc80",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  purchaseDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  usedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ff6f00",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  usedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
