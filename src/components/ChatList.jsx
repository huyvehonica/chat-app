import React, { useState, useEffect, useMemo } from "react";
import imageDefault from "../assets/default.jpg";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import chatData from "../data/chatData"; // Assuming you have a JSON file with chat data
import formatTimestamp from "../utils/formatTimestamp"; // Assuming you have a utility function to format timestamps
import { auth, db, listenForChats } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const ChatList = ({ setSelectedUser }) => {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null); // State to hold the current user
  useEffect(() => {
    const userDocRef = doc(db, "user", auth?.currentUser?.uid); // Get the current user's document reference
    const unSubscribe = onSnapshot(userDocRef, (doc) => {
      setUser(doc.data());
      // Get the user data from the document
      // Set the user state with the retrieved data
    });
    return unSubscribe;
  }, []);
  useEffect(() => {
    console.log("auth", auth?.currentUser?.uid);
    const unSubscribe = listenForChats(setChats); // Listen for chat updates from Firebase
    return () => {
      unSubscribe(); // Unsubscribe from the listener when the component unmounts
    };
    // setChats(chatData); // Load chat data from JSON file
  }, []);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTimestamp =
        a.lastMessageTimestamp?.seconds +
        a.lastMessageTimestamp?.nanoseconds / 1e9;
      const bTimestamp =
        b.lastMessageTimestamp?.seconds +
        b.lastMessageTimestamp?.nanoseconds / 1e9;
      return bTimestamp - aTimestamp; // Sort by last message timestamp in descending order
    });
  }, [chats]);

  const startChat = (user) => {
    setSelectedUser(user); // Reset selected user when starting a new chat
  };

  return (
    <section className="relative hidden lg:flex flex-col items-start justify-start bg-white h-[100vh] w-[100%] md:w-[600px]  ">
      <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 p-4 sticky md:static top-0 z-[100] border-r border-[#9090902c]">
        <main className="flex items-center gap-3">
          <img
            src={imageDefault}
            alt="user"
            className="w-[44px] h-[44px] object-cover rounded-full"
          />
          <span>
            <h3 className="p-0 font-semibold text-[#283D39] md:text-[17px]">
              {user?.fullName || "User"}
            </h3>
            <p className="p-0 font-light text-[#2A3D39] text-[15px]">
              @{user?.username || "User"}
            </p>
          </span>
        </main>
        <button className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 items-center flex justify-center rounded-lg">
          <RiMore2Fill color="#01AA85" className="w-[28px] h-[28px]" />
        </button>
      </header>
      <div className="w-[100%] mt-[10px] px-5">
        <header className="items-center flex justify-between">
          <h3 className=" text-[16px] ">Messages ({chats?.length || 0})</h3>
          <SearchModal startChat={startChat} />
        </header>
      </div>
      <main className="flex flex-col w-full items-start mt-[1.5rem] pb-3 flex-1  overflow-y-auto custom-scrollbar h-[100%]">
        {sortedChats?.map((chat) => (
          <button
            key={chat?.id}
            className="flex items-start justify-between w-[100%] border-b border-[#9090901d] px-5 pb-3 pt-3"
          >
            {chat?.users
              ?.filter((user) => user?.email !== auth?.currentUser?.email)
              ?.map((user) => (
                <div
                  className="flex items-start gap-3"
                  onClick={() => startChat(user)}
                >
                  <img
                    src={user?.image || imageDefault}
                    className="h-[40px] w-[40px] rounded-full object-cover"
                    alt="imageDefaultUser"
                  />
                  <span>
                    <h2 className="p-0 font-semibold text-[#2A3d39] text-left text-[17px]">
                      {user?.fullName || "User"}
                    </h2>
                    <p className="p-0 font-light text-[#2A3d39] text-left text-[14px] truncate max-w-[140px]">
                      {chat?.lastMessage || "Hey there, how are you?"}
                    </p>
                  </span>
                </div>
              ))}
            <p className="p-0 font-regular text-gray-400 text-[11px] w-full text-right">
              {formatTimestamp(chat?.lastMessageTimestamp)}
            </p>
          </button>
        ))}
      </main>
    </section>
  );
};

export default ChatList;
