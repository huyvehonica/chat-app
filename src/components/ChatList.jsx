import React, { useState, useEffect, useMemo } from "react";
import imageDefault from "../assets/default.jpg";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import chatData from "../data/chatData"; // Assuming you have a JSON file with chat data
import formatTimestamp from "../utils/formatTimestamp"; // Assuming you have a utility function to format timestamps
import {
  auth,
  db,
  listenForChats,
  listenForGroups,
  listenForUnreadCounts,
  listenForUnreadGroupCounts,
  rtdb,
} from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import UserProfileModal from "./UserProfileComponent";
import { getDatabase, ref as dbRef, update } from "firebase/database";
import { HiOutlineUserAdd, HiOutlineUserGroup } from "react-icons/hi";
import CreateGroupModal from "./CreateGroupModal";

const ChatList = ({ setSelectedUser }) => {
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [unreadGroupCounts, setUnreadGroupCounts] = useState({});
  const [groupSenderNames, setGroupSenderNames] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(rtdb, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser(userData);
          } else {
            console.log("No user data found in Realtime DB.");
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const unSubscribe = listenForChats(setChats);
    const unsubscribeGroups = listenForGroups(setGroups);
    return () => {
      unSubscribe();
      unsubscribeGroups();
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unreadChatsUnsubscribe = listenForUnreadCounts((counts) => {
      setUnreadCounts(counts);
    });
    const unreadGroupsUnsubscribe = listenForUnreadGroupCounts((counts) => {
      setUnreadGroupCounts(counts);
    });

    return () => {
      unreadChatsUnsubscribe();
      unreadGroupsUnsubscribe();
    };
  }, []);

  const fetchUserDetails = (uid) => {
    if (userDetails[uid]) return;

    const userRef = ref(rtdb, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserDetails((prev) => ({
          ...prev,
          [uid]: {
            ...userData,
            status: userData.status || "offline",
            lastSeen: userData.lastSeen || null,
          },
        }));
      }
    });
  };
  const getTimestampValue = (timestamp) => {
    if (!timestamp) return 0;
    if (typeof timestamp === "number") return timestamp;
    if (
      timestamp.seconds !== undefined &&
      timestamp.nanoseconds !== undefined
    ) {
      return timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6;
    }
    return 0;
  };

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTimestamp = getTimestampValue(a.lastMessageTimestamp);
      const bTimestamp = getTimestampValue(b.lastMessageTimestamp);
      return bTimestamp - aTimestamp;
    });
  }, [chats]);
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const aTimestamp = getTimestampValue(a.lastMessageTimestamp);
      const bTimestamp = getTimestampValue(b.lastMessageTimestamp);
      return bTimestamp - aTimestamp;
    });
  }, [groups]);
  const startChat = (user) => {
    setSelectedUser(user);
  };
  const startGroupChat = (group) => {
    setSelectedUser({
      type: "group",
      data: group,
    });
  };
  const openProfileModal = (profileUser) => {
    setSelectedProfile(profileUser);
    setShowProfileModal(true);
  };
  const closeProfileModal = () => {
    setShowProfileModal(false);
  };
  const openCreateGroupModal = () => {
    setShowCreateGroupModal(true);
  };

  const closeCreateGroupModal = () => {
    setShowCreateGroupModal(false);
  };

  const fetchLastMessageSender = async (senderId) => {
    if (!senderId || groupSenderNames[senderId]) return;

    const userRef = ref(rtdb, `users/${senderId}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setGroupSenderNames((prev) => ({
          ...prev,
          [senderId]: userData.fullName || userData.username || "Unknown User",
        }));
      }
    });
  };
  useEffect(() => {
    groups.forEach((group) => {
      if (group.lastMessageSenderId) {
        fetchLastMessageSender(group.lastMessageSenderId);
      }
    });
  }, [groups]);

  console.log("groups", groups);
  return (
    <section className="relative lg:flex flex-col items-start justify-start border-r bg-white dark:bg-gray-900 dark:border-gray-700 h-[100vh] w-[100%] lg:w-[600px]">
      <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 p-4 sticky md:static top-0  border-[#9090902c] dark:border-gray-700 dark:bg-gray-900">
        <main
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => openProfileModal(user)}
        >
          <div>
            <img
              src={user?.image || imageDefault}
              alt="user"
              className="w-[44px] h-[44px] object-cover rounded-full"
            />
          </div>
          <span>
            <h3 className="p-0 font-semibold text-[#283D39] dark:text-white md:text-[17px]">
              {user?.fullName || "User"}
            </h3>
            <p className="p-0 font-light text-[#2A3D39] dark:text-gray-300 text-[15px]">
              @{user?.username || "User"}
            </p>
          </span>
        </main>

        <SearchModal startChat={startChat} currentUser={user} />
      </header>
      <div className="w-full flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "chats"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("chats")}
        >
          Conversation
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "groups"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Group
        </button>
      </div>
      <div className="w-full mt-[10px] px-5">
        <header className="items-center flex justify-between">
          <h3 className="text-gray-800 dark:text-gray-200 text-[16px]">
            {activeTab === "chats"
              ? `Tin nhắn (${chats?.length || 0})`
              : `Nhóm chat (${groups?.length || 0})`}
          </h3>
          <div className="flex items-center gap-2">
            {activeTab === "groups" && (
              <button
                onClick={openCreateGroupModal}
                className="flex items-center text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/50"
              >
                <HiOutlineUserAdd className="mr-1" size={16} />
                <span className="text-sm">Create Group</span>
              </button>
            )}
          </div>
        </header>
      </div>
      <main className="flex flex-col w-full items-start mt-[1.5rem] pb-3 flex-1 overflow-y-auto custom-scrollbar h-[100%]">
        {activeTab === "chats"
          ? // Hiển thị danh sách chat 1:1
            sortedChats?.map((chat) => {
              const otherUsers = chat?.users?.filter(
                (uid) => uid !== auth?.currentUser?.uid
              );

              otherUsers.forEach((uid) => fetchUserDetails(uid));

              return (
                <button
                  key={chat?.id}
                  className="cursor-pointer flex items-start justify-between w-[100%] border-b border-[#9090901d] dark:border-gray-700 px-5 pb-3 pt-3 hover:bg-accent dark:hover:bg-gray-800"
                  onClick={() => startChat(userDetails[otherUsers[0]])}
                >
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3">
                    <div className="relative w-11 h-11">
                      <img
                        src={userDetails[otherUsers[0]]?.image || imageDefault}
                        className="object-cover w-full h-full rounded-full"
                        alt="imageDefaultUser"
                      />

                      {/* Chỉ báo trạng thái online */}
                      {userDetails[otherUsers[0]]?.status === "online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                      )}
                    </div>

                    <span>
                      <h2 className="p-0 font-semibold text-[#2A3d39] dark:text-white text-left text-[17px]">
                        {userDetails[otherUsers[0]]?.fullName}
                      </h2>
                      <p className="p-0 font-light text-gray-500 dark:text-gray-400 text-left text-[14px] truncate max-w-[140px]">
                        {chat?.lastMessageSenderId === auth?.currentUser?.uid
                          ? `You: ${chat?.lastMessage}`
                          : chat?.lastMessage}
                      </p>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="p-0 font-regular text-gray-400 text-[11px] w-fit text-right">
                      {formatTimestamp(chat?.lastMessageTimestamp)}
                    </p>

                    {/* Số lượng tin nhắn chưa đọc */}
                    {unreadCounts[chat?.id] > 0 && (
                      <div className="bg-teal-500 text-white rounded-full h-5 min-w-5 flex items-center justify-center text-xs font-medium px-1 mt-1">
                        {unreadCounts[chat?.id] > 99
                          ? "99+"
                          : unreadCounts[chat?.id]}
                      </div>
                    )}

                    {/* Hiển thị trạng thái "online" hoặc "last seen" */}
                  </div>
                </button>
              );
            })
          : // Hiển thị danh sách nhóm chat
            sortedGroups?.map((group) => (
              <button
                key={group?.id}
                className="cursor-pointer flex items-start justify-between w-[100%] border-b border-[#9090901d] dark:border-gray-700 px-5 pb-3 pt-3 hover:bg-accent dark:hover:bg-gray-800"
                onClick={() => startGroupChat(group)}
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden">
                    <img
                      src={imageDefault}
                      className="object-cover w-full h-full"
                      alt="imageDefaultUser"
                    />
                  </div>

                  <span>
                    <h2 className="p-0 line-clamp-1 font-semibold text-[#2A3d39] dark:text-white text-left text-[17px]">
                      {group?.name}
                    </h2>
                    <p className="p-0 font-light text-gray-500 dark:text-gray-400 text-left text-[14px] truncate max-w-[140px]">
                      {group?.lastMessageSenderId === auth?.currentUser?.uid
                        ? `You: ${group?.lastMessage}`
                        : `${
                            groupSenderNames[group?.lastMessageSenderId] ||
                            "Unknown User"
                          }: ${group?.lastMessage}`}
                    </p>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <p className="p-0 w-fit font-regular text-gray-400 text-[11px] text-right">
                    {formatTimestamp(group?.lastMessageTimestamp)}
                  </p>

                  {/* Hiển thị số lượng tin nhắn chưa đọc trong nhóm */}
                  {unreadGroupCounts[group?.id] > 0 && (
                    <div className="bg-teal-500 text-white rounded-full h-5 min-w-5 flex items-center justify-center text-xs font-medium px-1 mt-1">
                      {unreadGroupCounts[group?.id] > 99
                        ? "99+"
                        : unreadGroupCounts[group?.id]}
                    </div>
                  )}
                </div>
              </button>
            ))}

        {/* Hiển thị tin nhắn nếu không có cuộc trò chuyện nào */}
        {activeTab === "chats" && sortedChats.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-40">
            <p className="text-gray-500 dark:text-gray-400">
              You have no conversations yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Search for users to start chatting with{" "}
            </p>
          </div>
        )}

        {/* Hiển thị tin nhắn nếu không có nhóm nào */}
        {activeTab === "groups" && sortedGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-40">
            <p className="text-gray-500 dark:text-gray-400">
              Bạn chưa tham gia nhóm nào
            </p>
            <button
              onClick={openCreateGroupModal}
              className="mt-2 flex items-center text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/50"
            >
              <HiOutlineUserAdd className="mr-1" size={16} />
              <span>Tạo nhóm mới</span>
            </button>
          </div>
        )}
      </main>
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={closeProfileModal}
        user={selectedProfile}
      />
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={closeCreateGroupModal}
      />
    </section>
  );
};

export default ChatList;
