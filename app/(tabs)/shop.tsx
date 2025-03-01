import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";

const shopItems = [
  {
    id: "crosshair1",
    name: "Precision Crosshair",
    description: "A precise dot for accurate targeting",
    price: 100,
    icon: "add",
    type: "crosshair",
  },
  {
    id: "crosshair2",
    name: "Pro Crosshair",
    description: "Four-point professional crosshair",
    price: 200,
    icon: "add-circle",
    type: "crosshair",
  },
  {
    id: "powerup1",
    name: "Double Points",
    description: "Earn double points for your next 3 snipes",
    price: 300,
    icon: "star",
    type: "powerup",
  },
  {
    id: "powerup2",
    name: "Stealth Mode",
    description: "No notification sent to target for next snipe",
    price: 500,
    icon: "visibility-off",
    type: "powerup",
  },
];

export default function ShopScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePurchase = (item: (typeof shopItems)[0]) => {
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
          onPress: () => {
            // TODO: Implement purchase logic
            Alert.alert("Success", `You purchased ${item.name}!`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1b1e", "#2d2d30"] : ["#ffffff", "#f9fafb"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          Shop
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons
            name="logout"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}
        >
          Crosshairs
        </Text>
        <View style={styles.itemsGrid}>
          {shopItems
            .filter((item) => item.type === "crosshair")
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
                onPress={() => handlePurchase(item)}
              >
                <View style={styles.itemIcon}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={32}
                    color="#4f46e5"
                  />
                </View>
                <Text
                  style={[styles.itemName, { color: isDark ? "#fff" : "#000" }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.itemDescription,
                    { color: isDark ? "#aaa" : "#666" },
                  ]}
                >
                  {item.description}
                </Text>
                <LinearGradient
                  colors={["#6366f1", "#4f46e5"]}
                  style={styles.priceTag}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.priceText}>{item.price} points</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
        </View>

        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}
        >
          Power-ups
        </Text>
        <View style={styles.itemsGrid}>
          {shopItems
            .filter((item) => item.type === "powerup")
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
                onPress={() => handlePurchase(item)}
              >
                <View style={styles.itemIcon}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={32}
                    color="#4f46e5"
                  />
                </View>
                <Text
                  style={[styles.itemName, { color: isDark ? "#fff" : "#000" }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.itemDescription,
                    { color: isDark ? "#aaa" : "#666" },
                  ]}
                >
                  {item.description}
                </Text>
                <LinearGradient
                  colors={["#6366f1", "#4f46e5"]}
                  style={styles.priceTag}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.priceText}>{item.price} points</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
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
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 12,
    marginBottom: 10,
  },
  priceTag: {
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  priceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
});
