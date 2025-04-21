import React, { useMemo, useRef } from "react";
import formatTimestamp from "../utils/formatTimestamp"; // Assuming you have a utility function to format timestamps
import imageDefault from "../assets/default.jpg";
import { RiArrowLeftLine, RiSendPlaneFill } from "react-icons/ri";
import { messageData } from "../data/messageData";
import { useState, useEffect } from "react";
import { auth, listenForMessages, sendMessage } from "../firebase/firebase";
import logo from "../assets/logo.png"; // Assuming you have a logo image
import CallVideoIcon from "./CallVideoIcon";
import MessageList from "./MessageList";

const ChatBox = ({ selectedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [sendMessageText, setSendMessageText] = useState("");

  const scrollRef = useRef(null);
  const chatId =
    auth?.currentUser?.uid < selectedUser?.uid
      ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
      : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;
  const user1 = auth?.currentUser?.uid;
  const user2 = selectedUser?.uid;
  const senderEmail = auth?.currentUser?.uid;
  useEffect(() => {
    listenForMessages(chatId, setMessages); // Load chat data from JSON file
  }, [chatId]);
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
      await sendMessage(sendMessageText, chatId, user1, user2);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const handleVideoCall = () => {
    const roomId = `${auth.currentUser.uid}-${selectedUser.uid}`;
    const videoCallUrl = `/video-call?roomId=${roomId}`;
    window.open(videoCallUrl, "_blank", "width=800,height=600");
  };
  return (
    <>
      {selectedUser ? (
        <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
          <header className=" border-b border-gray-200 w-[100%] h-[81px] m:h-fit p-4 bg-white">
            <main className="  flex items-center gap-3 jus">
              <button
                className="p-2 rounded-full hover:bg-[#D9F2ED] block md:hidden"
                onClick={onBack}
              >
                <RiArrowLeftLine color="#01aa85" size={24} />
              </button>
              <div className="flex items-center gap-3">
                <span>
                  <img
                    src={selectedUser?.image || imageDefault}
                    className="w-11 h-11 object-cover rounded-full"
                  />
                </span>
                <span>
                  <h3 className="font-semibold text-[#2A3D39] text-lg">
                    {selectedUser?.fullName || "Chatfrik User"}
                  </h3>
                  <p className="font-light text-[#2A3D39] text-lsm">
                    {" "}
                    {selectedUser?.username || "Chatfrik User"}
                  </p>
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <CallVideoIcon onClick={handleVideoCall} />
              </div>
            </main>
          </header>
          <MessageList
            messages={sortedMessages}
            senderEmail={senderEmail}
            scrollRef={scrollRef}
            sendMessageText={sendMessageText}
            setSendMessageText={setSendMessageText}
            handleSendMessage={handleSendMessage}
            selectedUser={selectedUser}
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
