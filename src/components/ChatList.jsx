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
  const [user, setUser] = useState(null); // State to hold the current user
  const [userDetails, setUserDetails] = useState({}); // Lưu thông tin người dùng theo UID
  const [showProfileModal, setShowProfileModal] = useState(false); // State để kiểm soát hiển thị modal
  const [selectedProfile, setSelectedProfile] = useState(null); // State để lưu thông tin người dùng được chọn
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'groups'

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
    // Listen for chat updates from Firebase
    const unsubscribeGroups = listenForGroups(setGroups);
    return () => {
      unSubscribe();
      unsubscribeGroups(); // Unsubscribe from the listener when the component unmounts
    };
  }, []);

  const fetchUserDetails = (uid) => {
    if (userDetails[uid]) return; // Nếu đã có thông tin, không cần lấy lại

    const userRef = ref(rtdb, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserDetails((prev) => ({
          ...prev,
          [uid]: snapshot.val(),
        }));
      }
    });
  };
  const getTimestampValue = (timestamp) => {
    if (!timestamp) return 0;
    if (typeof timestamp === "number") return timestamp; // milliseconds
    if (
      timestamp.seconds !== undefined &&
      timestamp.nanoseconds !== undefined
    ) {
      return timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6; // convert to ms
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
    setSelectedUser(user); // Reset selected user when starting a new chat
  };
  const startGroupChat = (group) => {
    setSelectedUser({
      type: "group",
      data: group,
    }); // Reset selected user when starting a new chat
  };
  const openProfileModal = (profileUser) => {
    setSelectedProfile(profileUser);
    setShowProfileModal(true);
  };

  // Hàm đóng modal profile
  const closeProfileModal = () => {
    setShowProfileModal(false);
  };
  const openCreateGroupModal = () => {
    setShowCreateGroupModal(true);
  };

  const closeCreateGroupModal = () => {
    setShowCreateGroupModal(false);
  };
  return (
    <section className="relative  lg:flex flex-col items-start justify-start bg-white h-[100vh] w-[100%] lg:w-[600px]  ">
      <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 p-4 sticky md:static top-0 z-[50] border-r border-[#9090902c]">
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
            <h3 className="p-0 font-semibold text-[#283D39] md:text-[17px]">
              {user?.fullName || "User"}
            </h3>
            <p className="p-0 font-light text-[#2A3D39] text-[15px]">
              @{user?.username || "User"}
            </p>
          </span>
        </main>

        <button
          className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 items-center flex justify-center rounded-lg"
          onClick={openCreateGroupModal}
          title="Tạo nhóm mới"
        >
          <HiOutlineUserGroup color="#01AA85" className="w-[28px] h-[28px]" />
        </button>
      </header>
      <div className="w-full flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "chats"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("chats")}
        >
          Cuộc trò chuyện
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "groups"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Nhóm
        </button>
      </div>
      <div className="w-full mt-[10px] px-5">
        <header className="items-center flex justify-between">
          <h3 className="text-gray-800 text-[16px] ">
            {activeTab === "chats"
              ? `Tin nhắn (${chats?.length || 0})`
              : `Nhóm chat (${groups?.length || 0})`}
          </h3>
          <div className="flex items-center gap-2">
            {activeTab === "groups" && (
              <button
                onClick={openCreateGroupModal}
                className="flex items-center text-teal-600 bg-teal-50 px-2 py-1 rounded-md hover:bg-teal-100"
              >
                <HiOutlineUserAdd className="mr-1" size={16} />
                <span className="text-sm">Tạo nhóm</span>
              </button>
            )}
            <SearchModal startChat={startChat} />
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
                  className="cursor-pointer flex items-start justify-between w-[100%] border-b border-[#9090901d] px-5 pb-3 pt-3 hover:bg-accent"
                  onClick={() => startChat(userDetails[otherUsers[0]])}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden">
                      <img
                        src={userDetails[otherUsers[0]]?.image || imageDefault}
                        className="object-cover w-full h-full"
                        alt="imageDefaultUser"
                      />
                    </div>

                    <span>
                      <h2 className="p-0 font-semibold text-[#2A3d39] text-left text-[17px]">
                        {userDetails[otherUsers[0]]?.fullName}
                      </h2>
                      <p className="p-0 font-light text-gray-500 text-left text-[14px] truncate max-w-[140px]">
                        {chat?.lastMessageSenderId === auth?.currentUser?.uid
                          ? `You: ${chat?.lastMessage}`
                          : chat?.lastMessage}
                      </p>
                    </span>
                  </div>
                  <p className="p-0 font-regular text-gray-400 text-[11px] w-full text-right">
                    {formatTimestamp(chat?.lastMessageTimestamp)}
                  </p>
                </button>
              );
            })
          : // Hiển thị danh sách nhóm chat
            sortedGroups?.map((group) => (
              <button
                key={group?.id}
                className="cursor-pointer flex items-start justify-between w-[100%] border-b border-[#9090901d] px-5 pb-3 pt-3 hover:bg-accent"
                onClick={() => startGroupChat(group)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                    <HiOutlineUserGroup className="text-teal-600 text-2xl" />
                  </div>

                  <span>
                    <h2 className="p-0 font-semibold text-[#2A3d39] text-left text-[17px]">
                      {group?.name}
                    </h2>
                    <p className="p-0 font-light text-gray-500 text-left text-[14px] truncate max-w-[140px]">
                      {group?.lastMessageSenderId === auth?.currentUser?.uid
                        ? `You: ${group?.lastMessage}`
                        : group?.lastMessage}
                    </p>
                  </span>
                </div>
                <p className="p-0 font-regular text-gray-400 text-[11px] w-full text-right">
                  {formatTimestamp(group?.lastMessageTimestamp)}
                </p>
              </button>
            ))}

        {/* Hiển thị tin nhắn nếu không có cuộc trò chuyện nào */}
        {activeTab === "chats" && sortedChats.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-40">
            <p className="text-gray-500">Bạn chưa có cuộc trò chuyện nào</p>
            <p className="text-gray-400 text-sm">
              Hãy tìm kiếm người dùng để bắt đầu trò chuyện
            </p>
          </div>
        )}

        {/* Hiển thị tin nhắn nếu không có nhóm nào */}
        {activeTab === "groups" && sortedGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-40">
            <p className="text-gray-500">Bạn chưa tham gia nhóm nào</p>
            <button
              onClick={openCreateGroupModal}
              className="mt-2 flex items-center text-teal-600 bg-teal-50 px-3 py-2 rounded-md hover:bg-teal-100"
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
