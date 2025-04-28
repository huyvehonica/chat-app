import React, { useMemo, useRef } from "react";
import formatTimestamp from "../utils/formatTimestamp"; // Assuming you have a utility function to format timestamps
import imageDefault from "../assets/default.jpg";
import { RiArrowLeftLine, RiSendPlaneFill } from "react-icons/ri";
import { messageData } from "../data/messageData";
import { useState, useEffect } from "react";
import {
  auth,
  initiateCall,
  initiateGroupCall,
  listenForGroupMessages,
  listenForMessages,
  sendGroupMessage,
  sendMessage,
} from "../firebase/firebase";
import logo from "../assets/logo.png"; // Assuming you have a logo image
import CallVideoIcon from "./icons/CallVideoIcon";
import MessageList from "./MessageList";
import { CiVideoOn } from "react-icons/ci";
import { HiOutlineUserGroup } from "react-icons/hi2";
import chatData from "../data/chatData";

const ChatBox = ({ selectedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [sendMessageText, setSendMessageText] = useState("");
  const isGroup = selectedUser?.type === "group";
  const groupData = isGroup ? selectedUser.data : null;
  const userData = isGroup ? null : selectedUser;

  const scrollRef = useRef(null);
  const chatId = isGroup
    ? groupData?.id
    : auth?.currentUser?.uid < selectedUser?.uid
    ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
    : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;
  const user1 = auth?.currentUser?.uid;
  const user2 = selectedUser?.uid;
  const senderEmail = auth?.currentUser?.uid;

  useEffect(() => {
    if (!chatId) return;

    console.log("Chat ID:", chatId, groupData);

    let unsubscribe;
    if (isGroup) {
      // Lắng nghe tin nhắn nhóm
      unsubscribe = listenForGroupMessages(chatId, setMessages);
    } else {
      // Lắng nghe tin nhắn cá nhân
      unsubscribe = listenForMessages(chatId, setMessages);
    }

    // Hủy đăng ký khi component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, isGroup]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0); // Trì hoãn để đảm bảo DOM đã được cập nhật
    }
  }, [messages]);
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      return a.timestamp - b.timestamp; // Tăng dần
    });
  }, [messages]);
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!sendMessageText.trim()) {
      return;
    }
    const newMessage = {
      sender: senderEmail,
      text: sendMessageText,
      timestamp: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setSendMessageText("");

    try {
      if (isGroup) {
        // Send message to group
        await sendGroupMessage(sendMessageText, chatId);
      } else {
        await sendMessage(sendMessageText, chatId, user1, user2);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const handleVideoCall = async () => {
    if (!auth.currentUser) {
      return;
    }

    try {
      if (isGroup) {
        // For group calls
        const { callId, memberUids } = await initiateGroupCall(
          auth.currentUser.uid,
          chatId,
          "video"
        );

        // Navigate to video call page for group call
        const videoCallUrl = `/video-call?callId=${callId}&callerUserID=${auth.currentUser.uid}&isGroup=true&groupId=${chatId}`;
        window.open(videoCallUrl, "_blank", "width=800,height=600");
      } else {
        // For individual calls (existing code)
        const callId = await initiateCall(
          auth.currentUser.uid,
          selectedUser.uid,
          "video"
        );
        const videoCallUrl = `/video-call?callId=${callId}&callerUserID=${auth.currentUser.uid}&calleeUserID=${selectedUser.uid}`;
        window.open(videoCallUrl, "_blank", "width=800,height=600");
      }
    } catch (error) {
      console.error("Error initiating video call:", error);
      alert("Failed to initiate call: " + error.message);
    }
  };

  return (
    <>
      {selectedUser ? (
        <section className="relative flex flex-col items-start justify-start h-screen w-[100%] background-image">
          <header className=" border-b border-gray-200 w-[100%] h-[81px] m:h-fit p-4 bg-white">
            <main className="  flex items-center gap-3 jus">
              <button
                className="p-2 rounded-full hover:bg-[#D9F2ED] block md:hidden"
                onClick={onBack}
              >
                <RiArrowLeftLine color="#01aa85" size={24} />
              </button>
              <div className="flex items-center gap-3">
                {isGroup ? (
                  <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                    <HiOutlineUserGroup className="text-teal-600 text-2xl" />
                  </div>
                ) : (
                  <img
                    src={userData?.image || imageDefault}
                    className="w-11 h-11 object-cover rounded-full"
                    alt="User avatar"
                  />
                )}
                <span>
                  <h3 className="font-semibold text-[#2A3D39] text-lg">
                    {isGroup
                      ? groupData?.name || "Group Chat"
                      : userData?.fullName || "Chatfrik User"}
                  </h3>
                  <p className="font-light text-[#2A3D39] text-lsm">
                    {isGroup
                      ? `${
                          Object.keys(groupData?.members || {}).length
                        } members`
                      : userData?.username || "Chatfrik User"}
                  </p>
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <button className="p-2 rounded-full hover:bg-[#D9F2ED] hidden md:block">
                  <CiVideoOn size={22} onClick={handleVideoCall} />
                </button>
              </div>
            </main>
          </header>

          <MessageList
            messages={sortedMessages}
            senderEmail={senderEmail}
            scrollRef={scrollRef}
            setMessages={setMessages}
            sendMessageText={sendMessageText}
            setSendMessageText={setSendMessageText}
            handleSendMessage={handleSendMessage}
            selectedUser={selectedUser}
            chatId={chatId}
          />
        </section>
      ) : (
        <section className="h-screen w-full bg-[#e5f6f3]">
          <div className="flex flex-col justify-center items-center h-full w-full">
            <img src={logo} />
            <h1 className="text-[30px] font-bold text-teal-700 mt-5">
              Welcome to ChatChit
            </h1>
            <p className="text-gray-500">
              Connect and chat with your friend easily
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default ChatBox;
