import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { groupsService, type Group } from "../../services/groups";
import * as Clipboard from "expo-clipboard";
import { JoinGroupDialog } from "../../components/JoinGroupDialog";

export default function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [user]);

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
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Loading groups...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Your Groups</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={() => setShowJoinDialog(true)}
          >
            <MaterialIcons name="group-add" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={() => setShowNewGroup(true)}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {showNewGroup && (
        <View style={styles.newGroupForm}>
          <TextInput
            style={styles.input}
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="Enter group name"
            placeholderTextColor="#666"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowNewGroup(false);
                setNewGroupName("");
              }}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={createGroup}
            >
              <ThemedText>Create</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.groupList}>
        {groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <ThemedText style={styles.groupName}>{group.name}</ThemedText>
              <TouchableOpacity onPress={() => shareGroupInvite(group)}>
                <MaterialIcons name="share" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.membersList}>
              {group.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <ThemedText>{member.name}</ThemedText>
                  <ThemedText style={styles.points}>
                    {member.points} pts
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <JoinGroupDialog
        visible={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onSubmit={handleJoinGroup}
      />
    </ThemedView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: "#ff4040",
  },
  joinButton: {
    backgroundColor: "#4CAF50",
  },
  newGroupForm: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    backgroundColor: "#ddd",
    marginRight: 10,
  },
  createButton: {
    backgroundColor: "#ff4040",
  },
  groupList: {
    flex: 1,
  },
  groupCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  membersList: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  points: {
    color: "#666",
  },
});
