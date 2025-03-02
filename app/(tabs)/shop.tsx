import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";
import { store, StoreItem } from "../../services/store";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import ConfettiCannon from "react-native-confetti-cannon";

export const shopItems: StoreItem[] = [
  // Crosshairs
  {
    id: "crosshair1",
    name: "Precision Dot",
    description: "A minimalist dot for precise aiming",
    price: 5,
    icon: "add",
    type: "crosshair",
  },
  {
    id: "crosshair2",
    name: "Pro Crosshair",
    description: "Classic four-point professional crosshair",
    price: 10,
    icon: "add-circle",
    type: "crosshair",
  },
  {
    id: "crosshair3",
    name: "Elite Scope",
    description: "Military-grade sniper scope overlay",
    price: 15,
    icon: "radio-button-unchecked",
    type: "crosshair",
  },
  // Power-ups
  {
    id: "powerup1",
    name: "Double Points",
    description: "Next 8 snipes worth double points",
    price: 8,
    icon: "star",
    type: "powerup",
    effect: "double_points",
    duration: 8,
  },
  {
    id: "powerup2",
    name: "Point Shield",
    description: "Protected from losing points on next snipe",
    price: 12,
    icon: "security",
    type: "powerup",
    effect: "shield",
    duration: 1,
  },
  {
    id: "powerup3",
    name: "Point Drain",
    description: "Next target only gets half points from their snipe",
    price: 15,
    icon: "remove-circle",
    type: "powerup",
    effect: "half_points",
    duration: 1,
  },
  // Sniper Logos
  {
    id: "logo1",
    name: "Classic Sniper",
    description: "Vintage sniper rifle logo overlay",
    price: 20,
    icon: "filter-center-focus",
    type: "logo",
  },
  {
    id: "logo2",
    name: "Skull Logo",
    description: "Menacing skull crosshairs overlay",
    price: 25,
    icon: "face",
    type: "logo",
  },
  {
    id: "logo3",
    name: "Elite Insignia",
    description: "Premium military-style insignia",
    price: 30,
    icon: "military-tech",
    type: "logo",
  },
];

const showSuccessAlert = (message: string): Promise<void> => {
  return new Promise((resolve) => {
    Alert.alert(
      "Success!",
      message,
      [{ text: "OK", onPress: () => resolve() }],
      { cancelable: false }
    );
  });
};

export default function ShopScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (user?.id) {
      // Initial points load
      store.getUserInventory(user.id).then((inventory) => {
        setUserPoints(inventory.points);
      });

      // Set up real-time listener for user document
      const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
        if (doc.exists()) {
          setUserPoints(doc.data()?.points || 0);
        }
      });

      // Clean up listener on unmount
      return () => unsubscribe();
    }
  }, [user?.id]);

  const handlePurchase = async (item: StoreItem) => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to make purchases");
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Would you like to purchase ${item.name} for ${item.price} points?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Buy",
          onPress: async () => {
            setLoading(true);
            try {
              const success = await store.purchaseItem(user.id, item);
              if (success) {
                // Update points after successful purchase
                const inventory = await store.getUserInventory(user.id);
                setUserPoints(inventory.points);

                // Show success alert first
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "Success!",
                    `You purchased ${item.name}!`,
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          // Start confetti animation after user clicks OK
                          confettiRef.current?.start();
                          resolve();
                        },
                      },
                    ],
                    {
                      cancelable: false,
                    }
                  );
                });
              } else {
                Alert.alert("Error", "Purchase failed. Insufficient points.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to complete purchase");
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]} // Auth screen gradient
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff6f00" />
          {/* Vibrant loading color */}
        </View>
      )}

      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.title, { color: "#fff" }]}>
            Shop
          </ThemedText>
          <ThemedText
            style={[styles.points, { color: "rgba(255,255,255,0.8)" }]}
          >
            {userPoints} Points
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <ThemedText style={[styles.sectionTitle, { color: "#fff" }]}>
          Crosshairs
        </ThemedText>
        <View style={styles.itemsGrid}>
          {shopItems
            .filter((item) => item.type === "crosshair")
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: "rgba(255,255,255,0.9)", // Brighter item card background
                    opacity: userPoints >= item.price ? 1 : 0.5,
                  },
                ]}
                onPress={() => handlePurchase(item)}
                disabled={userPoints < item.price}
              >
                <View style={styles.itemIcon}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={36} // Slightly larger icons
                    color="#ff6f00" // Vibrant icon color
                  />
                </View>
                <ThemedText
                  style={[styles.itemName, { color: "#333" }]} // Darker item name
                >
                  {item.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.itemDescription,
                    { color: "#555" }, // Darker description
                  ]}
                >
                  {item.description}
                </ThemedText>
                <View style={styles.priceTag}>
                  <ThemedText style={styles.priceText}>
                    {item.price} Points
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
        </View>

        <ThemedText style={[styles.sectionTitle, { color: "#fff" }]}>
          Power-ups
        </ThemedText>
        <View style={styles.itemsGrid}>
          {shopItems
            .filter((item) => item.type === "powerup")
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: "rgba(255,255,255,0.9)", // Brighter item card background
                    opacity: userPoints >= item.price ? 1 : 0.5,
                  },
                ]}
                onPress={() => handlePurchase(item)}
                disabled={userPoints < item.price}
              >
                <View style={styles.itemIcon}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={36} // Slightly larger icons
                    color="#ff6f00" // Vibrant icon color
                  />
                </View>
                <ThemedText
                  style={[styles.itemName, { color: "#333" }]} // Darker item name
                >
                  {item.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.itemDescription,
                    { color: "#555" }, // Darker description
                  ]}
                >
                  {item.description}
                </ThemedText>
                <View style={styles.priceTag}>
                  <ThemedText style={styles.priceText}>
                    {item.price} Points
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
        </View>

        <ThemedText style={[styles.sectionTitle, { color: "#fff" }]}>
          Sniper Logos
        </ThemedText>
        <View style={styles.itemsGrid}>
          {shopItems
            .filter((item) => item.type === "logo")
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: "rgba(255,255,255,0.9)", // Brighter item card background
                    opacity: userPoints >= item.price ? 1 : 0.5,
                  },
                ]}
                onPress={() => handlePurchase(item)}
                disabled={userPoints < item.price}
              >
                <View style={styles.itemIcon}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={36} // Slightly larger icons
                    color="#ff6f00" // Vibrant icon color
                  />
                </View>
                <ThemedText
                  style={[styles.itemName, { color: "#333" }]} // Darker item name
                >
                  {item.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.itemDescription,
                    { color: "#555" }, // Darker description
                  ]}
                >
                  {item.description}
                </ThemedText>
                <View style={styles.priceTag}>
                  <ThemedText style={styles.priceText}>
                    {item.price} Points
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: -10, y: 0 }}
        fallSpeed={2500}
        explosionSpeed={350}
        fadeOut={true}
        colors={["#ff6f00", "#ff8f00", "#ffa000", "#ffb300"]} // Orange/Yellow confetti
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  points: {
    fontSize: 18, // Slightly larger points
    marginTop: 4,
    fontWeight: "600", // Bolder points
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36, // Even larger title
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    paddingHorizontal: 20,
    color: "#fff",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  itemCard: {
    width: "48%",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  itemIcon: {
    marginBottom: 10,
    alignItems: "center",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  itemDescription: {
    fontSize: 14,
    color: "#fff",
  },
  priceTag: {
    marginTop: 10,
    backgroundColor: "#ff6f00",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  priceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
