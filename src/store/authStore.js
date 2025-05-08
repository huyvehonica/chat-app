import { create } from "zustand";
import { auth, updateUserOnlineStatus } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { Navigate } from "react-router-dom";

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,
  error: null,

  // Đăng ký
  signup: async (email, password, displayName = "") => {
    try {
      set({ loading: true, error: null });
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      set({ user: userData, isLoggedIn: true, loading: false });
      localStorage.setItem("user", JSON.stringify(userData));

      // Cập nhật trạng thái online khi đăng ký
      await updateUserOnlineStatus("online");

      return userData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Đăng nhập
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      set({ user: userData, isLoggedIn: true, loading: false });
      localStorage.setItem("user", JSON.stringify(userData));

      // Cập nhật trạng thái online khi đăng nhập
      await updateUserOnlineStatus("online");

      return userData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      // Cập nhật trạng thái offline trước khi đăng xuất
      await updateUserOnlineStatus("offline");

      await signOut(auth);
      set({ user: null, isLoggedIn: false, loading: false });
      localStorage.removeItem("user");
      Navigate("/login"); // Chuyển hướng về trang đăng nhập
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  // Theo dõi trạng thái đăng nhập
  listenToAuthChanges: () => {
    set({ loading: true });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        set({ user: userData, isLoggedIn: true, loading: false });
      } else {
        localStorage.removeItem("user");
        set({ user: null, isLoggedIn: false, loading: false });
      }
    });

    return unsubscribe;
  },
}));

export default useAuthStore;
