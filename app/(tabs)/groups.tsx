import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useColorScheme } from "../../hooks/useColorScheme";
import { groupsService, type Group } from "../../services/groups";
import * as Clipboard from "expo-clipboard";
import { JoinGroupDialog } from "../../components/JoinGroupDialog";
import { LinearGradient } from "expo-linear-gradient";

export default function GroupsScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const formAnimation = new Animated.Value(showNewGroup ? 1 : 0);

  useEffect(() => {
    loadGroups();
  }, [user]);

  useEffect(() => {
    Animated.timing(formAnimation, {
      toValue: showNewGroup ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showNewGroup]);

  const loadGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userGroups = await groupsService.getUserGroups(user.id);
      setGroups(userGroups);
    } catch (error) {
      console.error("Error loading groups:", error);
      Alert.alert("Error", "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!user) return;

    if (newGroupName.trim() === "") {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      setLoading(true);
      const newGroup = await groupsService.createGroup(
        newGroupName.trim(),
        user.id
      );
      setGroups([...groups, newGroup]);
      setNewGroupName("");
      setShowNewGroup(false);
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const shareGroupInvite = async (group: Group) => {
    try {
      await Clipboard.setStringAsync(group.inviteCode);
      Alert.alert(
        "Invite Code Copied!",
        `Share this code with your friends: ${group.inviteCode}`
      );
    } catch (error) {
      console.error("Error copying invite code:", error);
      Alert.alert("Error", "Failed to copy invite code");
    }
  };

  const handleJoinGroup = async (inviteCode: string) => {
    if (!user || !inviteCode) return;

    try {
      setLoading(true);
      const success = await groupsService.joinGroup(inviteCode, user);
      setShowJoinDialog(false);
      if (success) {
        await loadGroups();
        Alert.alert("Success", "You have joined the group!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={isDark ? ["#1a1b1e", "#2d2d30"] : ["#ffffff", "#f9fafb"]}
          style={StyleSheet.absoluteFill}
        />
        <ThemedText
          style={[styles.loadingText, { color: isDark ? "#fff" : "#000" }]}
        >
          Loading groups...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1b1e", "#2d2d30"] : ["#ffffff", "#f9fafb"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          Your Groups
        </ThemedText>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons
            name="logout"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          onPress={() => setShowJoinDialog(true)}
        >
          <View style={styles.actionButtonIcon}>
            <MaterialIcons name="group-add" size={24} color="#4f46e5" />
          </View>
          <ThemedText
            style={[
              styles.actionButtonText,
              { color: isDark ? "#fff" : "#000" },
            ]}
          >
            Join Team
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          onPress={() => setShowNewGroup(true)}
        >
          <View style={styles.actionButtonIcon}>
            <MaterialIcons name="add" size={24} color="#4f46e5" />
          </View>
          <ThemedText
            style={[
              styles.actionButtonText,
              { color: isDark ? "#fff" : "#000" },
            ]}
          >
            New Team
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.groupList}>
        {groups.map((group) => (
          <View
            key={group.id}
            style={[
              styles.groupCard,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <View style={styles.groupHeader}>
              <ThemedText
                style={[styles.groupName, { color: isDark ? "#fff" : "#000" }]}
              >
                {group.name}
              </ThemedText>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareGroupInvite(group)}
              >
                <MaterialIcons
                  name="share"
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.membersList}>
              {group.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <MaterialIcons
                      name="person"
                      size={20}
                      color="#4f46e5"
                      style={styles.memberIcon}
                    />
                    <ThemedText
                      style={[
                        styles.memberName,
                        { color: isDark ? "#fff" : "#000" },
                      ]}
                    >
                      {member.name}
                    </ThemedText>
                  </View>
                  <LinearGradient
                    colors={["#6366f1", "#4f46e5"]}
                    style={styles.pointsBadge}
                  >
                    <ThemedText style={styles.points}>
                      {member.points} pts
                    </ThemedText>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Animated.View
        style={[
          styles.newGroupFormContainer,
          {
            opacity: formAnimation,
            transform: [
              {
                translateY: formAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showNewGroup ? "auto" : "none"}
      >
        {showNewGroup && (
          <View
            style={[
              styles.newGroupForm,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: isDark ? "#fff" : "#000",
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter group name"
              placeholderTextColor={isDark ? "#aaa" : "#666"}
              selectionColor={isDark ? "#fff" : "#000"}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewGroup(false);
                  setNewGroupName("");
                }}
              >
                <ThemedText
                  style={[
                    styles.buttonText,
                    { color: isDark ? "#fff" : "#000" },
                  ]}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.createButton]}
                onPress={createGroup}
              >
                <LinearGradient
                  colors={["#6366f1", "#4f46e5"]}
                  style={styles.buttonGradient}
                >
                  <ThemedText style={styles.buttonText}>Create</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      <JoinGroupDialog
        visible={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onSubmit={handleJoinGroup}
      />
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
  loadingText: {
    fontSize: 18,
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
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  groupList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  shareButton: {
    padding: 8,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberIcon: {
    marginRight: 8,
  },
  memberName: {
    fontSize: 16,
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  points: {
    color: "white",
    fontWeight: "600",
  },
  newGroupFormContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 160,
  },
  newGroupForm: {
    borderRadius: 15,
    padding: 15,
  },
  input: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  formButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    padding: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  createButton: {
    overflow: "hidden",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
