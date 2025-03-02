import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  groups: string[]; // Array of group IDs
  inventory?: {
    id: string;
    purchasedAt: number;
    used?: boolean;
  }[];
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: {
    id: string;
    name: string;
    points: number;
  }[];
  inviteCode: string;
  activeAccusation?: {
    accusedId: string;
    accuserId: string;
    votes: { [userId: string]: boolean };
    timestamp: number;
  };
}

export const groupsService = {
  async createGroup(name: string, userId: string): Promise<Group> {
    const groupsRef = collection(db, "groups");
    const groupDoc = doc(groupsRef);

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newGroup: Group = {
      id: groupDoc.id,
      name,
      createdBy: userId,
      members: [],
      inviteCode,
    };

    await setDoc(groupDoc, newGroup);

    // Add the group to the user's groups
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      groups: arrayUnion(groupDoc.id),
    });

    return newGroup;
  },

  async joinGroup(
    inviteCode: string,
    user: User
  ): Promise<{ success: boolean; groupId?: string }> {
    // Find group by invite code
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, where("inviteCode", "==", inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Invalid invite code");
    }

    const groupDoc = querySnapshot.docs[0];
    const group = groupDoc.data() as Group;

    // Check if user is already a member
    if (group.members.some((member) => member.id === user.id)) {
      return { success: false };
    }

    // Add user to group
    await updateDoc(groupDoc.ref, {
      members: arrayUnion({
        id: user.id,
        name: user.name,
        points: 0,
      }),
    });

    // Add group to user's groups
    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, {
      groups: arrayUnion(groupDoc.id),
    });

    return { success: true, groupId: groupDoc.id };
  },

  async getUserGroups(userId: string): Promise<Group[]> {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    const groups: Group[] = [];

    // Get all groups that the user is a member of
    for (const groupId of userData.groups) {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);

      if (groupDoc.exists()) {
        groups.push(groupDoc.data() as Group);
      }
    }

    return groups;
  },

  async updatePoints(
    groupId: string,
    userId: string,
    points: number
  ): Promise<void> {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }

    const group = groupDoc.data() as Group;
    const memberIndex = group.members.findIndex((m) => m.id === userId);

    if (memberIndex === -1) {
      throw new Error("User is not a member of this group");
    }

    // Update member's points
    const updatedMembers = [...group.members];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      points: updatedMembers[memberIndex].points + points,
    };

    await updateDoc(groupRef, { members: updatedMembers });

    // Update user's total points
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    const userData = userDoc.data() as User;

    await updateDoc(userRef, {
      points: userData.points + points,
    });
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }

    const group = groupDoc.data() as Group;

    // Remove user from group members
    await updateDoc(groupRef, {
      members: group.members.filter((member) => member.id !== userId),
    });

    // Remove group from user's groups
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      groups: arrayRemove(groupId),
    });
  },

  async accuseMember(
    groupId: string,
    accuserId: string,
    accusedId: string
  ): Promise<void> {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }

    const group = groupDoc.data() as Group;

    // Check if there's already an active accusation
    if (group.activeAccusation) {
      throw new Error("There is already an active accusation in this group");
    }

    // Check if accuser and accused are in the group
    if (
      !group.members.some((m) => m.id === accuserId) ||
      !group.members.some((m) => m.id === accusedId)
    ) {
      throw new Error("Invalid member IDs");
    }

    // Create new accusation
    await updateDoc(groupRef, {
      activeAccusation: {
        accusedId,
        accuserId,
        votes: { [accuserId]: true }, // Accuser automatically votes yes
        timestamp: Date.now(),
      },
    });
  },

  async voteOnAccusation(
    groupId: string,
    voterId: string,
    vote: boolean
  ): Promise<void> {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error("Group not found");
    }

    const group = groupDoc.data() as Group;

    if (!group.activeAccusation) {
      throw new Error("No active accusation");
    }

    if (voterId === group.activeAccusation.accusedId) {
      throw new Error("The accused member cannot vote");
    }

    // Update the vote
    const updatedVotes = {
      ...group.activeAccusation.votes,
      [voterId]: vote,
    };

    await updateDoc(groupRef, {
      "activeAccusation.votes": updatedVotes,
    });

    // Check if all members (except accused) have voted
    const totalVoters = group.members.length - 1; // Exclude the accused
    const votesCount = Object.keys(updatedVotes).length;

    if (votesCount === totalVoters) {
      // Calculate result
      const yesVotes = Object.values(updatedVotes).filter((v) => v).length;
      const allVotedYes = yesVotes === totalVoters;

      if (allVotedYes) {
        // Everyone voted that the person lied - deduct a point
        await this.updatePoints(groupId, group.activeAccusation.accusedId, -1);
      }

      // Clear the accusation
      await updateDoc(groupRef, {
        activeAccusation: null,
      });
    }
  },
};
