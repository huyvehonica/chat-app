// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  checkActionCode,
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { serverTimestamp, update } from "firebase/database";
import { getDatabase, ref, set, onValue, get, push } from "firebase/database";
import { getStorage } from "firebase/storage";
import { LuMessageSquareText } from "react-icons/lu";
import { updateProfile } from "firebase/auth";

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
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        messageId: childSnapshot.key, // Lấy messageId
        ...childSnapshot.val(),
      });
    });
    setMessages(messages); // Cập nhật state với các tin nhắn mới
  });
};

export const sendMessage = async (messagesText, chatId, user1, user2) => {
  const currentUserId = auth.currentUser.uid;
  console.log("Current user ID:", currentUserId);
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
    lastMessageSenderId: currentUserId,
    lastMessageTimestamp: serverTimestamp(),
  };
  const chatSnapshot = await get(chatRef); // Kiểm tra chat có tồn tại không
  if (!chatSnapshot.exists()) {
    await set(chatRef, chatData); // Tạo chat mới nếu không tồn tại
  } else {
    await update(chatRef, {
      lastMessage: messagesText,
      lastMessageSenderId: currentUserId,
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
export const initiateCall = async (callerUid, calleeUid, callType) => {
  const callId = `${callerUid}-${calleeUid}-${Date.now()}`;
  const callRef = ref(rtdb, `calls/${callId}`);

  await set(callRef, {
    callId,
    callerUid,
    calleeUid, // Make sure this property is consistently named
    receiverUid: calleeUid, // Add this for backward compatibility
    callType,
    status: "initiating",
    isGroupCall: false, // Explicitly mark as not a group call
    createdAt: serverTimestamp(),
  });

  return callId;
};
export const initiateGroupCall = async (callerUid, groupId, callType) => {
  try {
    // Get group members
    const groupRef = ref(rtdb, `groups/${groupId}`);
    const groupSnapshot = await get(groupRef);

    if (!groupSnapshot.exists()) {
      throw new Error("Group not found");
    }

    const groupData = groupSnapshot.val();
    // Get all members except the caller
    const memberUids = Object.keys(groupData.members || {}).filter(
      (uid) => uid !== callerUid
    );

    if (memberUids.length === 0) {
      throw new Error("No other members in the group");
    }

    // Create a unique call ID
    const callId = `group-${groupId}-${Date.now()}`;
    const callRef = ref(rtdb, `calls/${callId}`);

    // Save call information
    await set(callRef, {
      callId,
      callerUid,
      calleeUids: memberUids, // Array of all members to be called
      groupId,
      isGroupCall: true,
      callType,
      status: "initiating",
      createdAt: serverTimestamp(),
    });

    return { callId, memberUids };
  } catch (error) {
    console.error("Error initiating group call:", error);
    throw error;
  }
};
// Listen for incoming calls
export const listenForIncomingCalls = (currentUserUid, onIncomingCall) => {
  const callsRef = ref(rtdb, "calls");

  return onValue(callsRef, (snapshot) => {
    if (!snapshot.exists()) return;

    snapshot.forEach((childSnapshot) => {
      const call = childSnapshot.val();
      console.log("Detected call:", call);

      // Handle individual calls - check both formats (receiverUid and calleeUid)
      if (
        !call.isGroupCall &&
        (call.receiverUid === currentUserUid ||
          call.calleeUid === currentUserUid) &&
        call.status === "initiating"
      ) {
        console.log("Individual call detected for current user");
        onIncomingCall(call);
      }
      // Handle group calls
      else if (
        call.isGroupCall &&
        Array.isArray(call.calleeUids) &&
        call.calleeUids.includes(currentUserUid) &&
        call.status === "initiating"
      ) {
        console.log("Group call detected for current user");
        onIncomingCall(call);
      }
    });
  });
};

// Update call status
export const updateCallStatus = async (callId, status) => {
  const callRef = ref(rtdb, `calls/${callId}`);
  await update(callRef, { status });
};

// End call
export const endCall = async (callId) => {
  await updateCallStatus(callId, "ended");
};
export const storage = getStorage(app);
/////////////////////////////////Group chat
// Thêm vào firebase.js

// Hàm tạo nhóm mới
export const createGroupChat = async (
  groupName,
  creatorUid,
  memberUids = []
) => {
  const groupId = `group-${Date.now()}`;
  const members = [creatorUid, ...memberUids].reduce((acc, uid) => {
    acc[uid] = {
      role: uid === creatorUid ? "admin" : "member",
      joinedAt: serverTimestamp(),
    };
    return acc;
  }, {});

  const groupData = {
    id: groupId,
    name: groupName,
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    members,
    type: "group",
    lastMessage: "Group created",
    lastMessageSenderId: creatorUid,
    lastMessageTimestamp: serverTimestamp(),
  };

  // Lưu thông tin nhóm trong Realtime Database
  const groupRef = ref(rtdb, `groups/${groupId}`);
  await set(groupRef, groupData);

  return groupId;
};

// Hàm lắng nghe danh sách nhóm mà người dùng là thành viên
export const listenForGroups = (setGroups) => {
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid) return () => {};

  console.log("Listening for groups for user:", currentUid);

  const groupsRef = ref(rtdb, "groups");

  const unsubscribe = onValue(groupsRef, (snapshot) => {
    const groupList = [];

    snapshot.forEach((childSnapshot) => {
      const group = childSnapshot.val();

      // Kiểm tra xem người dùng hiện tại có phải là thành viên không
      if (group.members && group.members[currentUid]) {
        groupList.push(group);
      }
    });

    console.log("Group list:", groupList);
    setGroups(groupList);
  });

  return unsubscribe;
};

// Hàm lắng nghe tin nhắn trong nhóm
export const listenForGroupMessages = (groupId, setMessages) => {
  const messagesRef = ref(rtdb, `groups/${groupId}/messages`);

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        messageId: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });
    messages.sort((a, b) => a.timestamp - b.timestamp);
    setMessages(messages);
  });

  return () => unsubscribe();
};

// Hàm gửi tin nhắn trong nhóm
export const sendGroupMessage = async (messageText, groupId) => {
  if (!messageText || !groupId) {
    console.error("sendGroupMessage error: Missing parameters", {
      messageText,
      groupId,
    });
    return;
  }

  const currentUserId = auth.currentUser.uid;

  // Lấy tên người dùng từ Realtime Database
  const userRef = ref(rtdb, `users/${currentUserId}`);
  const userSnapshot = await get(userRef);

  let currentUserName = "Unknown User"; // Giá trị mặc định
  if (userSnapshot.exists()) {
    currentUserName = userSnapshot.val().fullName || "Unknown User";
  }

  // Cập nhật thông tin tin nhắn mới nhất của nhóm
  const groupRef = ref(rtdb, `groups/${groupId}`);
  await update(groupRef, {
    lastMessage: messageText,
    lastMessageSenderId: currentUserId,
    lastMessageTimestamp: serverTimestamp(),
  });

  // Thêm tin nhắn mới vào danh sách tin nhắn của nhóm
  const messagesRef = ref(rtdb, `groups/${groupId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, {
    text: messageText,
    sender: currentUserId,
    senderName: currentUserName, // Lưu tên người gửi
    timestamp: serverTimestamp(),
  });
};

// Hàm thêm thành viên vào nhóm
export const addMemberToGroup = async (groupId, userUid) => {
  const memberRef = ref(rtdb, `groups/${groupId}/members/${userUid}`);
  await set(memberRef, {
    role: "member",
    joinedAt: serverTimestamp(),
  });
};

// Hàm xóa thành viên khỏi nhóm
export const removeMemberFromGroup = async (groupId, userUid) => {
  const memberRef = ref(rtdb, `groups/${groupId}/members/${userUid}`);
  await set(memberRef, null);
};

// Hàm lấy thông tin của tất cả thành viên trong nhóm
export const getGroupMembers = async (groupId) => {
  const groupRef = ref(rtdb, `groups/${groupId}`);
  const snapshot = await get(groupRef);

  if (snapshot.exists()) {
    const group = snapshot.val();
    const memberUids = group.members ? Object.keys(group.members) : [];

    const members = [];
    for (const uid of memberUids) {
      const userRef = ref(rtdb, `users/${uid}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        members.push({
          uid,
          ...userSnapshot.val(),
          role: group.members[uid].role,
        });
      }
    }

    return members;
  }

  return [];
};

// Hàm kiểm tra người dùng có phải là admin của nhóm không
export const isGroupAdmin = async (groupId, userUid) => {
  const memberRef = ref(rtdb, `groups/${groupId}/members/${userUid}`);
  const snapshot = await get(memberRef);

  if (snapshot.exists()) {
    const memberData = snapshot.val();
    return memberData.role === "admin";
  }

  return false;
};
export const getCurrentUserProfile = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const userRef = ref(rtdb, `users/${currentUser.uid}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }

  // If profile doesn't exist yet, create a default one
  const defaultProfile = {
    email: currentUser.email,
    fullName: currentUser.displayName || currentUser.email.split("@")[0],
    photoURL:
      currentUser.photoURL || "https://default-avatar-url.com/default.png",
    uid: currentUser.uid,
  };

  // Store the default profile
  await set(userRef, defaultProfile);

  return defaultProfile;
};
export const updateUserProfile = async (profileData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No authenticated user found");

  const userRef = ref(rtdb, `users/${currentUser.uid}`);
  await update(userRef, {
    ...profileData,
    updatedAt: serverTimestamp(),
  });

  // If you want to also update the auth profile
  if (profileData.fullName) {
    await updateProfile(currentUser, { displayName: profileData.fullName });
  }

  if (profileData.photoURL) {
    await updateProfile(currentUser, { photoURL: profileData.photoURL });
  }

  return await getCurrentUserProfile();
};
