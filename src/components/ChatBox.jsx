import React, { useMemo, useRef } from "react";
import formatTimestamp from "../utils/formatTimestamp"; // Assuming you have a utility function to format timestamps
import imageDefault from "../assets/default.jpg";
import { RiSendPlaneFill } from "react-icons/ri";
import { messageData } from "../data/messageData";
import { useState, useEffect } from "react";
import { auth, listenForMessages, sendMessage } from "../firebase/firebase";
import logo from "../assets/logo.png"; // Assuming you have a logo image
const ChatBox = ({ selectedUser }) => {
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

  return (
    <>
      {selectedUser ? (
        <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
          <header className="border-b border-gray-200 w-[100%] h-[81px] m:h-fit p-4 bg-white">
            <main className="flex items-center gap-3">
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
            </main>
          </header>
          <main className="custom-scrollbar relative h-full w-[100%] flex flex-col justify-between ">
            <section className="px-3 pt-5">
              <div
                ref={scrollRef}
                className="overflow-auto h-[80vh] custom-scrollbar"
                style={{ scrollBehavior: "smooth" }}
              >
                {sortedMessages?.map((msg, index) => (
                  <div key={index}>
                    {msg?.sender === senderEmail ? (
                      <div
                        key={index}
                        className="flex flex-col items-end justify-end w-full"
                      >
                        <div className="flex justify-end gap-1 w-[70%] h-auto text-sx text-left">
                          <div>
                            <div className="bg-white flex justify-end px-4 py-2 rounded-lg shadow-sm break-all break-words whitespace-pre-wrap max-w-[75vw]">
                              <p className="text-sx text-[#2A3D39] leading-relaxed tex">
                                {msg.text}
                              </p>
                            </div>
                            <p className="text-gray-400 text-xs text-right mt-3">
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start w-full">
                        <span className="flex gap-1  w-[70%] h-auto text-sx text-right">
                          <img
                            src={imageDefault}
                            alt="defaultImage"
                            className="h-11 w-11 object-cover rounded-full"
                          />
                          <div>
                            <div className="bg-white px-4 py-2 rounded-lg break-all shadow-sm break-words whitespace-pre-wrap max-w-[75vw] text-left">
                              <p className="text-sx text-[#2A3D39] leading-relaxed">
                                {msg.text}
                              </p>
                            </div>
                            <p className="text-gray-400 text-xs text-left mt-1">
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <div className="fixed lg:bottom-0 bottom-[20px] p-3 h-fit w-full">
              <div>
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center bg-white h-[45px] w-full px-2 rounded-lg relative shadow-lg"
                >
                  <input
                    type="text"
                    value={sendMessageText}
                    onChange={(e) => setSendMessageText(e.target.value)}
                    placeholder="Write your message"
                    className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3]"
                  >
                    <RiSendPlaneFill color="#01AA85" />
                  </button>
                </form>
              </div>
            </div>
          </main>
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
