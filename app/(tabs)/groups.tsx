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
import { groupsService, type Group } from "../../services/groups";
import * as Clipboard from "expo-clipboard";
import { JoinGroupDialog } from "../../components/JoinGroupDialog";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <LinearGradient
    colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
    style={[styles.card, style]}
  >
    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
    <View style={styles.cardContent}>{children}</View>
  </LinearGradient>
);

export default function GroupsScreen() {
  const { user } = useAuth();
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
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]}
        style={[styles.container, styles.centered]}
      >
        <ThemedText style={styles.loadingText}>Loading groups...</ThemedText>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Your Groups</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowJoinDialog(true)}
          >
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              style={styles.iconButtonGradient}
            >
              <MaterialIcons name="group-add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowNewGroup(true)}
          >
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              style={styles.iconButtonGradient}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

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
          <Card style={styles.newGroupForm}>
            <TextInput
              style={styles.input}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter group name"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              selectionColor="#fff"
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewGroup(false);
                  setNewGroupName("");
                }}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
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
          </Card>
        )}
      </Animated.View>

      <ScrollView style={styles.groupList}>
        {groups.map((group) => (
          <Card key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <ThemedText style={styles.groupName}>{group.name}</ThemedText>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareGroupInvite(group)}
              >
                <MaterialIcons name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.membersList}>
              {group.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <MaterialIcons
                      name="person"
                      size={20}
                      color="white"
                      style={styles.memberIcon}
                    />
                    <ThemedText style={styles.memberName}>
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
          </Card>
        ))}
      </ScrollView>

      <JoinGroupDialog
        visible={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onSubmit={handleJoinGroup}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    marginLeft: 8,
  },
  iconButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  newGroupFormContainer: {
    marginBottom: 20,
  },
  newGroupForm: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
  groupList: {
    flex: 1,
  },
  groupCard: {
    marginBottom: 16,
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
    color: "white",
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
    color: "white",
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
});
