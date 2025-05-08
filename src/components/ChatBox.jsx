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
  listenToUserOnlineStatus,
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
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [userScrolling, setUserScrolling] = useState(false); // Thêm trạng thái để theo dõi khi người dùng đang cuộn
  const [scrollTimeout, setScrollTimeout] = useState(null); // Theo dõi timeout để tránh trigger cuộn liên tục
  const [onlineStatus, setOnlineStatus] = useState({
    status: "offline",
    lastSeen: null,
  });
  const isGroup = selectedUser?.type === "group";
  const groupData = isGroup ? selectedUser.data : null;
  const userData = isGroup ? null : selectedUser;
  const [replyingTo, setReplyingTo] = useState(null);

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
      // Sử dụng wrapper function để kiểm soát việc cuộn
      unsubscribe = listenForGroupMessages(chatId, (newMessages) => {
        // Không trigger cuộn khi nhận tin nhắn từ người khác
        setMessages(newMessages);
      });
    } else {
      unsubscribe = listenForMessages(chatId, (newMessages) => {
        setMessages(newMessages);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, isGroup]);

  // Lắng nghe trạng thái online của người dùng
  useEffect(() => {
    let onlineStatusUnsubscribe = () => {};

    if (!isGroup && userData?.uid) {
      onlineStatusUnsubscribe = listenToUserOnlineStatus(
        userData.uid,
        (status) => {
          setOnlineStatus(status);
        }
      );
    }

    return () => {
      onlineStatusUnsubscribe();
    };
  }, [isGroup, userData]);

  // Hàm bắt sự kiện cuộn thủ công của người dùng - sửa lại logic
  const handleUserScroll = () => {
    if (!scrollRef.current) return;

    // Đánh dấu người dùng đang cuộn
    setUserScrolling(true);

    // Xóa timeout cũ nếu có
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Thiết lập timeout mới để đánh dấu người dùng đã dừng cuộn
    const newTimeout = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Chỉ khi người dùng đã cuộn gần đến cuối (trong vòng 100px) và đã dừng cuộn
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        setShouldScrollToBottom(true);
      }

      setUserScrolling(false);
      setScrollTimeout(null);
    }, 300); // Đợi 300ms để xác định người dùng đã dừng cuộn

    setScrollTimeout(newTimeout);
  };

  // Effect chỉ cuộn xuống khi shouldScrollToBottom = true và người dùng không đang cuộn
  useEffect(() => {
    if (scrollRef.current && shouldScrollToBottom && !userScrolling) {
      const timer = setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        // Chỉ reset shouldScrollToBottom nếu không phải là tin nhắn mới
        setShouldScrollToBottom(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages, shouldScrollToBottom, userScrolling]);

  // Cleanup timeouts khi component unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

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

    // Kích hoạt cuộn xuống dưới khi gửi tin nhắn mới
    setShouldScrollToBottom(true);
    setUserScrolling(false); // Đảm bảo rằng khi gửi tin nhắn mới, trạng thái cuộn được reset

    try {
      if (isGroup) {
        // Send message to group
        await sendGroupMessage(sendMessageText, chatId);
      } else {
        await sendMessage(sendMessageText, chatId, user1, user2);
      }

      // Reset input field after sending
      setSendMessageText("");
      setReplyingTo(null); // Reset trạng thái replyingTo sau khi gửi tin nhắn
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
        <section className="relative flex flex-col items-start justify-start h-screen w-[100%] background-image dark:bg-gray-900 dark:bg-none">
          <header className="border-b border-gray-200 dark:border-gray-700 w-[100%] h-[81px] m:h-fit p-4 bg-white dark:bg-gray-900">
            <main className="flex items-center gap-3 jus">
              <button
                className="p-2 rounded-full hover:bg-[#D9F2ED] dark:hover:bg-gray-800 block md:hidden"
                onClick={onBack}
              >
                <RiArrowLeftLine
                  color="#01aa85"
                  className="dark:text-teal-400"
                  size={24}
                />
              </button>
              <div className="flex items-center gap-3">
                {isGroup ? (
                  <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <HiOutlineUserGroup className="text-teal-600 dark:text-teal-400 text-2xl" />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={userData?.image || imageDefault}
                      className="w-11 h-11 object-cover rounded-full"
                      alt="User avatar"
                    />
                    {onlineStatus.status === "online" && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                    )}
                  </div>
                )}
                <span>
                  <h3 className="font-semibold text-[#2A3D39] dark:text-white text-lg">
                    {isGroup
                      ? groupData?.name || "Group Chat"
                      : userData?.fullName || "Chatfrik User"}
                  </h3>
                  <p className="font-light text-[#2A3D39] dark:text-gray-300 text-lsm">
                    {isGroup
                      ? `${
                          Object.keys(groupData?.members || {}).length
                        } members`
                      : onlineStatus.status === "online"
                      ? "Đang hoạt động"
                      : onlineStatus.lastSeen
                      ? formatTimestamp(onlineStatus.lastSeen, true)
                      : userData?.username || "Chatfrik User"}
                  </p>
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <button className="p-2 rounded-full hover:bg-[#D9F2ED] dark:hover:bg-gray-800 ">
                  <CiVideoOn
                    size={22}
                    className="dark:text-white"
                    onClick={handleVideoCall}
                  />
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
            onScroll={handleUserScroll}
            setReplyingTo={setReplyingTo}
            replyingTo={replyingTo}
            onlineStatus={onlineStatus}
          />
        </section>
      ) : (
        <section className="h-screen w-full bg-[#e5f6f3] dark:bg-gray-900">
          <div className="flex flex-col justify-center items-center h-full w-full">
            <img src={logo} className=" dark:p-2 dark:rounded-lg" />
            <h1 className="text-[30px] font-bold text-teal-700 dark:text-teal-400 mt-5">
              Welcome to ChatChit
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Connect and chat with your friend easily
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default ChatBox;
