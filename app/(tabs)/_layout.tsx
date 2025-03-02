import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuth();
  const isDark = colorScheme === "dark";

  if (!user) {
    return null;
  }

  const TabBarBackground = () => {
    if (Platform.OS === "ios") {
      return (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={80}
          style={StyleSheet.absoluteFill}
        />
      );
    }
    return (
      <LinearGradient
        colors={
          isDark
            ? ["rgba(26, 32, 44, 0.9)", "rgba(17, 24, 39, 0.9)"]
            : ["rgba(255, 255, 255, 0.9)", "rgba(249, 250, 251, 0.9)"]
        }
        style={StyleSheet.absoluteFill}
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 30 : 15,
        },
        tabBarBackground: TabBarBackground,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: isDark
          ? "rgba(255, 255, 255, 0.6)"
          : "rgba(0, 0, 0, 0.4)",
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialIcons
                name="camera"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : null}
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerButton}>
              <MaterialIcons
                name="logout"
                size={24}
                color={isDark ? "#fff" : "#000"}
                onPress={signOut}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialIcons
                name="store"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : null}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialIcons
                name="inventory"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : null}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialIcons
                name="group"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : null}
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerButton}>
              <MaterialIcons
                name="logout"
                size={24}
                color={isDark ? "#fff" : "#000"}
                onPress={signOut}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  activeIconContainer: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  headerButton: {
    marginRight: 15,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
});
