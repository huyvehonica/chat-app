// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  checkActionCode,
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { serverTimestamp, update } from "firebase/database";
import { getDatabase, ref, set, onValue, get, push } from "firebase/database";

import { LuMessageSquareText } from "react-icons/lu";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
console.log("Firebase Config Variables:");
console.log("API Key exists:", !!import.meta.env.VITE_API_KEY);
console.log("Auth Domain exists:", !!import.meta.env.VITE_AUTH_DOMAIN);
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};
const app = initializeApp(firebaseConfig); // Khởi tạo Firebase tại đây

// Initialize services
const auth = getAuth(app);
const db = getDatabase(app);
const rtdb = getDatabase(app);
export const listenForChats = (setChats) => {
  console.log("Listening for chats...");
  const chatRef = ref(rtdb, "chats");

  const unSubscribe = onValue(chatRef, (snapshot) => {
    const chatList = [];
    snapshot.forEach((childSnapshot) => {
      chatList.push({
        id: childSnapshot.key, // id = uid1-uid2
        ...childSnapshot.val(),
      });
    });

    console.log("Chat list:", chatList);

    // Lấy UID người dùng hiện tại
    const currentUid = auth?.currentUser?.uid;

    // Lọc những chat mà id chứa uid hiện tại
    const filterChats = chatList.filter((chat) =>
      chat?.id.includes(currentUid)
    );

    console.log("Filtered chats:", filterChats);
    setChats(filterChats);
  });

  return unSubscribe;
};
export const listenForMessages = (chatId, setMessages) => {
  const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messages = data ? Object.values(data) : [];
    setMessages(messages); // Cập nhật state với các tin nhắn mới
  });
};
export const sendMessage = async (messagesText, chatId, user1, user2) => {
  if (!messagesText || !chatId || !user1 || !user2) {
    console.error("sendMessage error: Missing parameters", {
      messagesText,
      chatId,
      user1,
      user2,
    });
  }
  const chatRef = ref(rtdb, `chats/${chatId}`); // Use Realtime Database reference
  const chatData = {
    users: [user1, user2],
    lastMessage: messagesText,
    lastMessageTimestamp: serverTimestamp(),
  };
  const chatSnapshot = await get(chatRef); // Kiểm tra chat có tồn tại không
  if (!chatSnapshot.exists()) {
    await set(chatRef, chatData); // Tạo chat mới nếu không tồn tại
  } else {
    await update(chatRef, {
      lastMessage: messagesText,
      lastMessageTimestamp: serverTimestamp(),
    }); // Cập nhật tin nhắn cuối cùng
  }
  const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, {
    text: messagesText,
    sender: user1, // Hoặc lấy từ auth.currentUser.email nếu người gửi là người dùng hiện tại
    timestamp: serverTimestamp(),
  });
};

// Initialize Firebase

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});
export { auth, db, rtdb };
