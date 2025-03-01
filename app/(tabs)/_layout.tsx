import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAuth } from "../../contexts/AuthContext";
import { View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
        tabBarActiveTintColor: "#ff4040",
        tabBarInactiveTintColor: "#999",
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
        headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="camera" size={24} color={color} />
          ),
          headerRight: () => (
            <View style={{ marginRight: 15 }}>
              <MaterialIcons
                name="logout"
                size={24}
                color={colorScheme === "dark" ? "#fff" : "#000"}
                onPress={signOut}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="group" size={24} color={color} />
          ),
          headerRight: () => (
            <View style={{ marginRight: 15 }}>
              <MaterialIcons
                name="logout"
                size={24}
                color={colorScheme === "dark" ? "#fff" : "#000"}
                onPress={signOut}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
