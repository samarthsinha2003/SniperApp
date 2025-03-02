import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { store, UserInventory, StoreItem } from "../../services/store";
import { shopItems } from "./shop";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function InventoryScreen() {
  const { user, signOut } = useAuth();
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    loadInventory();

    // Set up real-time listener
    const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setInventory({
          points: userData.points || 0,
          items: userData.inventory || [],
        });
      }
      setLoading(false);
    });

    // Cleanup listener
    return () => unsubscribe();
  }, [user?.id]);

  const loadInventory = async () => {
    if (!user?.id) return;
    try {
      const userInventory = await store.getUserInventory(user.id);
      setInventory(userInventory);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      Alert.alert("Error", "Failed to load inventory");
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
            Alert.alert("Error", "Item already in use");
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

  const handleResetLogo = async () => {
    if (!user?.id) return;

    Alert.alert(
      "Reset Logo",
      "Are you sure you want to reset to the default logo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            try {
              const success = await store.setDefaultLogo(user.id);
              if (success) {
                Alert.alert("Success", "Logo reset to default!");
              } else {
                Alert.alert("Error", "Failed to reset logo");
              }
            } catch (error) {
              console.error("Failed to reset logo:", error);
              Alert.alert("Error", "Failed to reset logo");
            }
          },
        },
      ]
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
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: "#fff" }]}>
            {type === "crosshair"
              ? "Crosshairs"
              : type === "powerup"
              ? "Power-ups"
              : "Sniper Logos"}
          </ThemedText>
          {type === "logo" && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetLogo}
            >
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                style={styles.resetButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.resetButtonText}>
                  Reset to Default
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
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
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  resetButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
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
