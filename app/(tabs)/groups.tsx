import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Animated,
  ActivityIndicator, // Import ActivityIndicator
} from "react-native";
import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { ThemedText } from "../../components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useColorScheme } from "../../hooks/useColorScheme";
import { groupsService, type Group } from "../../services/groups";
import * as Clipboard from "expo-clipboard";
import { JoinGroupDialog } from "../../components/JoinGroupDialog";
import { CreateGroupDialog } from "../../components/CreateGroupDialog";
import { LinearGradient } from "expo-linear-gradient";

export default function GroupsScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark"; // While we are forcing light theme look, this is still good to have
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const formAnimation = new Animated.Value(showNewGroup ? 1 : 0);
  const unsubscribeRefs = useRef<{ [key: string]: () => void }>({});

  const setupGroupListener = (groupId: string) => {
    // Clean up existing listener if any
    if (unsubscribeRefs.current[groupId]) {
      unsubscribeRefs.current[groupId]();
    }

    // Set up new listener
    const unsubscribe = onSnapshot(doc(db, "groups", groupId), (doc) => {
      if (doc.exists()) {
        setGroups((prevGroups) => {
          const updatedGroups = [...prevGroups];
          const index = updatedGroups.findIndex((g) => g.id === groupId);
          if (index !== -1) {
            updatedGroups[index] = doc.data() as Group;
          }
          return updatedGroups;
        });
      }
    });

    unsubscribeRefs.current[groupId] = unsubscribe;
  };

  useEffect(() => {
    async function setupListeners() {
      if (!user?.id) return;

      try {
        setLoading(true);
        // First get the initial groups
        const userGroups = await groupsService.getUserGroups(user.id);
        setGroups(userGroups);

        // Set up real-time listeners for each group
        userGroups.forEach((group) => {
          setupGroupListener(group.id);
        });
      } catch (error) {
        console.error("Error setting up group listeners:", error);
        Alert.alert("Error", "Failed to load groups");
      } finally {
        setLoading(false);
      }
    }

    setupListeners();

    // Cleanup function
    return () => {
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) =>
        unsubscribe()
      );
      unsubscribeRefs.current = {};
    };
  }, [user?.id]);

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

  const createGroup = async (name: string) => {
    if (!user) return;

    if (name.trim() === "") {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      setLoading(true);
      const newGroup = await groupsService.createGroup(name.trim(), user.id);
      setGroups([...groups, newGroup]);
      setupGroupListener(newGroup.id);
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
      const result = await groupsService.joinGroup(inviteCode, user);
      setShowJoinDialog(false);
      if (result.success && result.groupId) {
        const newGroup = await groupsService.getUserGroups(user.id);
        setGroups(newGroup);
        setupGroupListener(result.groupId);
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
          colors={["#4a00e0", "#8e2de2"]} // Auth screen gradient
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ActivityIndicator size="large" color="#ff6f00" />
        {/* Loading indicator */}
        <ThemedText style={[styles.loadingText, { color: "#fff" }]}>
          Loading teams...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]} // Auth screen gradient
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {loading ? ( // Conditional rendering for loading state
        <View style={[styles.container, styles.centered]}>
          <LinearGradient
            colors={["#4a00e0", "#8e2de2"]} // Auth screen gradient
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <ActivityIndicator size="large" color="#ff6f00" />
          <ThemedText style={[styles.loadingText, { color: "#fff" }]}>
            Loading teams...
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: "#fff" }]}>
              Your Teams
            </ThemedText>
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <MaterialIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={() => setShowJoinDialog(true)}
            >
              <View style={styles.actionButtonIcon}>
                <MaterialIcons name="group-add" size={24} color="#ff6f00" />
              </View>
              <ThemedText style={[styles.actionButtonText, { color: "#fff" }]}>
                Join Team
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton]}
              onPress={() => setShowNewGroup(true)}
            >
              <View style={styles.actionButtonIcon}>
                <MaterialIcons name="add" size={24} color="#ff6f00" />
              </View>
              <ThemedText style={[styles.actionButtonText, { color: "#fff" }]}>
                New Team
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.groupList}>
            {groups.map((group) => (
              <View key={group.id} style={[styles.groupCard]}>
                <View style={styles.groupHeader}>
                  <ThemedText style={[styles.groupName, { color: "#fff" }]}>
                    {group.name}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareGroupInvite(group)}
                  >
                    <MaterialIcons name="share" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.membersList}>
                  {group.members.map((member) => (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <MaterialIcons
                          name="person"
                          size={20}
                          color="#ff6f00"
                          style={styles.memberIcon}
                        />
                        <ThemedText
                          style={[styles.memberName, { color: "#fff" }]}
                        >
                          {member.name}
                        </ThemedText>
                      </View>
                      <View style={styles.memberActionsContainer}>
                        <View style={styles.pointsBadge}>
                          <ThemedText
                            style={[styles.points, { color: "#fff" }]}
                          >
                            {member.points}
                            <ThemedText
                              style={[styles.pointsUnit, { color: "#fff" }]}
                            >
                              {" Points"}
                            </ThemedText>
                          </ThemedText>
                        </View>
                        {user?.id !== member.id && (
                          <TouchableOpacity
                            style={styles.accuseButton}
                            onPress={() => {
                              Alert.alert(
                                "Accuse Member",
                                `Are you sure you want to accuse ${member.name} of lying about a snipe?`,
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Accuse",
                                    style: "destructive",
                                    onPress: async () => {
                                      try {
                                        if (user) {
                                          await groupsService.accuseMember(
                                            group.id,
                                            user.id,
                                            member.id
                                          );
                                        }
                                      } catch (error: any) {
                                        Alert.alert("Error", error.message);
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <MaterialIcons
                              name="gavel"
                              size={20}
                              color="#ff6f00"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
                {group.activeAccusation && user && (
                  <View style={[styles.accusationCard]}>
                    <ThemedText style={[styles.accusationText]}>
                      {group.members.find(
                        (m) => m.id === group.activeAccusation?.accuserId
                      )?.name || ""}{" "}
                      has accused{" "}
                      {group.members.find(
                        (m) => m.id === group.activeAccusation?.accusedId
                      )?.name || ""}{" "}
                      of lying about a snipe!
                    </ThemedText>
                    {group.activeAccusation &&
                      user.id !== group.activeAccusation.accusedId &&
                      !group.activeAccusation.votes?.[user.id] && (
                        <View style={[styles.voteButtonsContainer]}>
                          <TouchableOpacity
                            style={[styles.voteButton, styles.voteYes]}
                            onPress={async () => {
                              try {
                                await groupsService.voteOnAccusation(
                                  group.id,
                                  user.id,
                                  true
                                );
                              } catch (error: any) {
                                Alert.alert("Error", error.message);
                              }
                            }}
                          >
                            <ThemedText style={styles.voteButtonText}>
                              Agree
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.voteButton, styles.voteNo]}
                            onPress={async () => {
                              try {
                                await groupsService.voteOnAccusation(
                                  group.id,
                                  user.id,
                                  false
                                );
                              } catch (error: any) {
                                Alert.alert("Error", error.message);
                              }
                            }}
                          >
                            <ThemedText style={styles.voteButtonText}>
                              Disagree
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      )}
                    {group.activeAccusation &&
                      user &&
                      group.activeAccusation.votes?.[user.id] !== undefined && (
                        <ThemedText style={styles.votedText}>
                          You have cast your vote
                        </ThemedText>
                      )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <CreateGroupDialog
            visible={showNewGroup}
            onClose={() => setShowNewGroup(false)}
            onSubmit={async (name) => {
              try {
                await createGroup(name);
              } catch (error) {
                console.error("Error creating group:", error);
                Alert.alert("Error", "Failed to create group");
              }
            }}
          />

          <JoinGroupDialog
            visible={showJoinDialog}
            onClose={() => setShowJoinDialog(false)}
            onSubmit={handleJoinGroup}
          />
        </>
      )}
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
    fontSize: 20,
    fontWeight: "600",
    marginTop: 10,
    color: "#fff",
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
    fontSize: 32,
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
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 111, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  groupList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shareButton: {
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontSize: 18,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pointsBadge: {
    backgroundColor: "#ff6f00",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  points: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pointsUnit: {
    // Style for " Points" unit
    color: "white",
    fontWeight: "normal", // Or any style you want for the unit
    fontSize: 12, // Smaller unit size
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  newGroupFormContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 160,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newGroupForm: {
    borderRadius: 15,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  formButton: {
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
  buttonGradient: {
    padding: 14,
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
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  memberActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accuseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 111, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  accusationCard: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "rgba(255, 111, 0, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 111, 0, 0.3)",
  },
  accusationText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  voteButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginTop: 10,
  },
  voteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  voteYes: {
    backgroundColor: "#4CAF50",
  },
  voteNo: {
    backgroundColor: "#f44336",
  },
  voteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  votedText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
});
