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
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
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
};
export const listenForChats = (setChats) => {
  const chatRef = collection(db, "chats");
  const unSubscribe = onSnapshot(chatRef, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const filterChats = chatList.filter((chat) =>
      chat?.users.some((user) => user?.email === auth?.currentUser?.email)
    );
    setChats(filterChats);
  });
  return unSubscribe;
};
export const listenForMessages = (chatId, setMessages) => {
  const chatRef = collection(db, "chats", chatId, "messages");
  onSnapshot(chatRef, (snapshot) => {
    const messages = snapshot.docs.map((doc) => doc.data());
    setMessages(messages);
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
  const chatRef = doc(db, "chats", chatId);
  const user1Doc = await getDoc(doc(db, "user", user1));
  const user2Doc = await getDoc(doc(db, "user", user2));
  const user1Data = user1Doc.data();
  const user2Data = user2Doc.data();
  const chatDoc = await getDoc(chatRef);
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      users: [user1Data, user2Data],
      lastMessage: messagesText,
      lastMessageTimestamp: serverTimestamp(),
    });
  } else {
    await updateDoc(chatRef, {
      lastMessage: messagesText,
      lastMessageTimestamp: serverTimestamp(),
    });
  }
  const messageRef = collection(db, "chats", chatId, "messages");
  await addDoc(messageRef, {
    text: messagesText,
    sender: auth.currentUser.email,
    timestamp: serverTimestamp(),
  });
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});
export { auth, db };
