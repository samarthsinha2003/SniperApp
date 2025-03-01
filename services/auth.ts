import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "./groups";

export const authService = {
  async signIn(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      const newUser: User = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || email.split("@")[0],
        email: email,
        points: 0,
        groups: [],
      };
      await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    }
  },

  async signUp(email: string, password: string, name: string): Promise<void> {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with name
      await updateProfile(userCredential.user, { displayName: name });

      // Create user document in Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        name,
        email,
        points: 0,
        groups: [],
      };

      // Use set with merge to ensure the document is created
      await setDoc(doc(db, "users", userCredential.user.uid), newUser, {
        merge: true,
      });
    } catch (error) {
      console.error("Error in signUp:", error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (!auth.currentUser) return null;

    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists()) {
      const newUser: User = {
        id: auth.currentUser.uid,
        name:
          auth.currentUser.displayName ||
          auth.currentUser.email?.split("@")[0] ||
          "User",
        email: auth.currentUser.email || "",
        points: 0,
        groups: [],
      };
      await setDoc(doc(db, "users", auth.currentUser.uid), newUser);
      return newUser;
    }

    return userDoc.data() as User;
  },
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },
};
