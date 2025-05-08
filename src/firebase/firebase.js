// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  checkActionCode,
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { serverTimestamp, update, onDisconnect } from "firebase/database";
import { getDatabase, ref, set, onValue, get, push } from "firebase/database";
import { getStorage } from "firebase/storage";
import { LuMessageSquareText } from "react-icons/lu";
import { updateProfile } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

  // Check if this is a reply message
  const replyData = window.replyingToMessage;

  const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);

  // Create message data
  const messageData = {
    text: messagesText,
    sender: user1,
    timestamp: serverTimestamp(),
  };

  // Add reply information if present
  if (replyData) {
    messageData.replyTo = replyData.messageId;
    messageData.replyToSender = replyData.sender;
    messageData.replyToText = replyData.text;

    // For user display names, get the sender name if available
    if (replyData.sender) {
      const userRef = ref(rtdb, `users/${replyData.sender}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        messageData.replyToSenderName = userSnapshot.val().fullName || "User";
      }
    }

    // Handle different message types in replies
    if (replyData.type) {
      messageData.replyToType = replyData.type;
      if (replyData.type === "file" || replyData.type === "image") {
        messageData.replyToName = replyData.name;
      }
    }

    // Reset reply data
    window.replyingToMessage = null;
  }

  await set(newMessageRef, messageData);

  // Đánh dấu tin nhắn là chưa đọc cho người nhận
  const receiverId = user2; // Người nhận là người còn lại trong cuộc trò chuyện
  if (receiverId !== currentUserId) {
    await markMessageAsUnread(chatId, newMessageRef.key, receiverId);
  }
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

  // Check if this is a reply message
  const replyData = window.replyingToMessage;

  // Create message data
  const messageData = {
    text: messageText,
    sender: currentUserId,
    senderName: currentUserName, // Lưu tên người gửi
    timestamp: serverTimestamp(),
  };

  // Add reply information if present
  if (replyData) {
    messageData.replyTo = replyData.messageId;
    messageData.replyToSender = replyData.sender;
    messageData.replyToText = replyData.text;

    // For user display names, get the sender name if available
    if (replyData.sender) {
      const repliedUserRef = ref(rtdb, `users/${replyData.sender}`);
      const repliedUserSnapshot = await get(repliedUserRef);
      if (repliedUserSnapshot.exists()) {
        messageData.replyToSenderName =
          repliedUserSnapshot.val().fullName || "User";
      } else {
        messageData.replyToSenderName = replyData.senderName || "User";
      }
    }

    // Handle different message types in replies
    if (replyData.type) {
      messageData.replyToType = replyData.type;
      if (replyData.type === "file" || replyData.type === "image") {
        messageData.replyToName = replyData.name;
      }
    }

    // Reset reply data
    window.replyingToMessage = null;
  }

  // Thêm tin nhắn mới vào danh sách tin nhắn của nhóm
  const messagesRef = ref(rtdb, `groups/${groupId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, messageData);

  // Đánh dấu tin nhắn là chưa đọc cho tất cả thành viên khác trong nhóm
  try {
    // Lấy danh sách thành viên nhóm
    const groupSnapshot = await get(groupRef);
    if (groupSnapshot.exists()) {
      const groupData = groupSnapshot.val();
      const members = groupData.members || {};

      // Đánh dấu tin nhắn chưa đọc cho mỗi thành viên (trừ người gửi)
      for (const memberId of Object.keys(members)) {
        if (memberId !== currentUserId) {
          // Cập nhật trạng thái chưa đọc trong nhóm
          const unreadRef = ref(
            rtdb,
            `groups/${groupId}/unreadMessages/${memberId}/${newMessageRef.key}`
          );
          await set(unreadRef, true);

          // Cập nhật tổng số tin nhắn chưa đọc cho thành viên
          const unreadCountRef = ref(
            rtdb,
            `users/${memberId}/unreadGroups/${groupId}`
          );
          const unreadCountSnapshot = await get(unreadCountRef);

          if (unreadCountSnapshot.exists()) {
            // Tăng số lượng tin nhắn chưa đọc
            await update(unreadCountRef, {
              count: unreadCountSnapshot.val().count + 1,
            });
          } else {
            // Tạo mới nếu chưa có
            await set(unreadCountRef, { count: 1 });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error marking group message as unread:", error);
  }
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

// Hàm cập nhật trạng thái online/offline của người dùng
export const updateUserOnlineStatus = async (status) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const userRef = ref(rtdb, `users/${currentUser.uid}`);

  if (status === "offline") {
    // Khi offline, cập nhật lastSeen là thời điểm hiện tại
    await update(userRef, {
      status: "offline",
      lastSeen: serverTimestamp(),
    });
  } else {
    // Khi online, cập nhật trạng thái và xóa lastSeen (vì đang online)
    await update(userRef, {
      status: "online",
    });
  }
};

// Theo dõi kết nối internet để cập nhật trạng thái online/offline
export const setupPresenceSystem = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  // Tham chiếu đến đường dẫn .info/connected đặc biệt của Firebase
  const connectedRef = ref(rtdb, ".info/connected");

  // Tham chiếu đến trạng thái online của người dùng
  const userStatusRef = ref(rtdb, `users/${currentUser.uid}/status`);
  const userLastSeenRef = ref(rtdb, `users/${currentUser.uid}/lastSeen`);

  const unsubscribe = onValue(connectedRef, (snapshot) => {
    // Nếu đã kết nối
    if (snapshot.val() === true) {
      // Khi ngắt kết nối, trạng thái sẽ được cập nhật thành offline
      // Sử dụng onDisconnect để đảm bảo trạng thái được cập nhật ngay cả khi mất kết nối đột ngột
      set(userStatusRef, "online");

      // Khi ngắt kết nối, cập nhật lastSeen
      onDisconnect(userStatusRef).set("offline");
      onDisconnect(userLastSeenRef).set(serverTimestamp());
    } else {
      // Không kết nối được với Firebase
      set(userStatusRef, "offline");
      set(userLastSeenRef, serverTimestamp());
    }
  });

  // Đảm bảo cập nhật trạng thái khi người dùng rời khỏi trang
  window.addEventListener("beforeunload", () => {
    updateUserOnlineStatus("offline");
  });

  return unsubscribe;
};

// Hàm lấy trạng thái online của một người dùng
export const getUserOnlineStatus = async (userId) => {
  if (!userId) return { status: "offline" };

  const userRef = ref(rtdb, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();
    return {
      status: userData.status || "offline",
      lastSeen: userData.lastSeen || null,
    };
  }

  return { status: "offline" };
};

// Hàm lắng nghe sự thay đổi trạng thái online của một người dùng
export const listenToUserOnlineStatus = (userId, callback) => {
  if (!userId) return () => {};

  const userStatusRef = ref(rtdb, `users/${userId}`);

  const unsubscribe = onValue(userStatusRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      callback({
        status: userData.status || "offline",
        lastSeen: userData.lastSeen || null,
      });
    } else {
      callback({ status: "offline" });
    }
  });

  return unsubscribe;
};

// Thêm các hàm quản lý tin nhắn chưa đọc

// Hàm đánh dấu tin nhắn là chưa đọc cho người nhận
export const markMessageAsUnread = async (chatId, messageId, receiverId) => {
  // Không đánh dấu tin nhắn chưa đọc nếu người gửi và người nhận là cùng một người
  if (auth.currentUser?.uid === receiverId) return;

  // Cập nhật trạng thái chưa đọc trong chat
  const unreadRef = ref(
    rtdb,
    `chats/${chatId}/unreadMessages/${receiverId}/${messageId}`
  );
  await set(unreadRef, true);

  // Cập nhật tổng số tin nhắn chưa đọc
  const unreadCountRef = ref(rtdb, `users/${receiverId}/unreadChats/${chatId}`);
  const unreadCountSnapshot = await get(unreadCountRef);

  if (unreadCountSnapshot.exists()) {
    // Tăng số lượng tin nhắn chưa đọc
    await update(unreadCountRef, {
      count: unreadCountSnapshot.val().count + 1,
    });
  } else {
    // Tạo mới nếu chưa có
    await set(unreadCountRef, { count: 1 });
  }
};

// Hàm đánh dấu tất cả tin nhắn trong chat là đã đọc
export const markChatAsRead = async (chatId) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId || !chatId) return;

  // Xóa thông tin tin nhắn chưa đọc trong chat
  const unreadMessagesRef = ref(
    rtdb,
    `chats/${chatId}/unreadMessages/${currentUserId}`
  );
  await set(unreadMessagesRef, null);

  // Xóa thông tin số lượng tin nhắn chưa đọc cho người dùng hiện tại
  const unreadCountRef = ref(
    rtdb,
    `users/${currentUserId}/unreadChats/${chatId}`
  );
  await set(unreadCountRef, null);
};

// Hàm lắng nghe số lượng tin nhắn chưa đọc cho mỗi cuộc trò chuyện
export const listenForUnreadCounts = (callback) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return () => {};

  const unreadChatsRef = ref(rtdb, `users/${currentUserId}/unreadChats`);

  const unsubscribe = onValue(unreadChatsRef, (snapshot) => {
    const unreadCounts = {};

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const chatId = childSnapshot.key;
        const data = childSnapshot.val();
        unreadCounts[chatId] = data.count || 0;
      });
    }

    callback(unreadCounts);
  });

  return unsubscribe;
};

// Hàm lấy tổng số tin nhắn chưa đọc
export const getTotalUnreadCount = async () => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return 0;

  const unreadChatsRef = ref(rtdb, `users/${currentUserId}/unreadChats`);
  const snapshot = await get(unreadChatsRef);

  let totalCount = 0;

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      totalCount += data.count || 0;
    });
  }

  return totalCount;
};

// Hàm đánh dấu tất cả tin nhắn trong nhóm là đã đọc
export const markGroupAsRead = async (groupId) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId || !groupId) return;

  // Xóa thông tin tin nhắn chưa đọc trong nhóm
  const unreadMessagesRef = ref(
    rtdb,
    `groups/${groupId}/unreadMessages/${currentUserId}`
  );
  await set(unreadMessagesRef, null);

  // Xóa thông tin số lượng tin nhắn chưa đọc cho người dùng hiện tại
  const unreadCountRef = ref(
    rtdb,
    `users/${currentUserId}/unreadGroups/${groupId}`
  );
  await set(unreadCountRef, null);
};

// Hàm lắng nghe số lượng tin nhắn chưa đọc trong nhóm
export const listenForUnreadGroupCounts = (callback) => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return () => {};

  const unreadGroupsRef = ref(rtdb, `users/${currentUserId}/unreadGroups`);

  const unsubscribe = onValue(unreadGroupsRef, (snapshot) => {
    const unreadCounts = {};

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const groupId = childSnapshot.key;
        const data = childSnapshot.val();
        unreadCounts[groupId] = data.count || 0;
      });
    }

    callback(unreadCounts);
  });

  return unsubscribe;
};

// Hàm lấy tổng số tin nhắn chưa đọc cả chat cá nhân và nhóm
export const getTotalUnreadCountAll = async () => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return 0;

  let totalCount = 0;

  // Đếm số tin nhắn chưa đọc trong chat cá nhân
  const unreadChatsRef = ref(rtdb, `users/${currentUserId}/unreadChats`);
  const chatsSnapshot = await get(unreadChatsRef);

  if (chatsSnapshot.exists()) {
    chatsSnapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      totalCount += data.count || 0;
    });
  }

  // Đếm số tin nhắn chưa đọc trong nhóm
  const unreadGroupsRef = ref(rtdb, `users/${currentUserId}/unreadGroups`);
  const groupsSnapshot = await get(unreadGroupsRef);

  if (groupsSnapshot.exists()) {
    groupsSnapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      totalCount += data.count || 0;
    });
  }

  return totalCount;
};
