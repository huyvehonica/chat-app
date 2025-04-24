import React, { useRef, useEffect, useState } from "react";
import formatTimestamp from "../utils/formatTimestamp";
import imageDefault from "../assets/default.jpg";
import { RiSendPlaneFill } from "react-icons/ri";
import { BsThreeDots } from "react-icons/bs"; // Import dấu "..."
import { ref, set, update } from "firebase/database";
import { rtdb } from "../firebase/firebase";
import { RemoveMessageDialogComponent } from "./RemoveMessageDialogComponent";

const MessageList = ({
  messages,
  senderEmail,
  scrollRef,
  sendMessageText,
  setSendMessageText,
  setMessages,
  handleSendMessage,
  selectedUser,
  chatId,
}) => {
  console.log("messages", messages);
  console.log("selectedUser", selectedUser);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null); // Lưu thông tin tin nhắn cần xóa
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const toggleMenu = (index) => {
    setActiveMenu((prev) => (prev === index ? null : index)); // Toggle menu visibility
  };
  const [hoveredMessage, setHoveredMessage] = useState(null);
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);
  const editMessage = async (chatId, messageId, newText) => {
    const messageRef = ref(rtdb, `chats/${chatId}/messages/${messageId}`);
    await update(messageRef, {
      text: newText,
      isEdited: true,
    });
    console.log(`Message ${messageId} updated with new text: ${newText}`);
  };

  const deleteMessage = async (chatId, messageId) => {
    const messageRef = ref(rtdb, `chats/${chatId}/messages/${messageId}`);
    await update(messageRef, { isDeleted: true });
    console.log(`Message ${messageId} deleted`);
  };
  return (
    <main className="custom-scrollbar relative h-full w-[100%] flex flex-col justify-between">
      <section className="px-3 pt-5">
        <div
          ref={scrollRef}
          className="overflow-auto h-[80vh] custom-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages?.map((msg, index) => (
            <div
              key={msg.messageId}
              className="relative group" // Add group for hover effect
              onMouseEnter={() => setHoveredMessage(index)} // Set hovered message
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {msg?.sender === senderEmail ? (
                <div
                  className="flex flex-col items-end justify-end w-full"
                  onMouseEnter={() => setHoveredMessage(index)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className=" flex justify-end gap-1 max-w-[70%] h-auto text-sx text-left">
                    <div>
                      <div className="bg-white relative flex justify-end px-4 py-2 rounded-lg shadow-sm break-all break-words whitespace-pre-wrap max-w-[75vw]">
                        {editingMessageId === msg.messageId ? (
                          <input
                            value={editText}
                            autoFocus
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                await editMessage(
                                  chatId,
                                  msg.messageId,
                                  editText
                                );
                                setEditingMessageId(null);
                              } else if (e.key === "Escape") {
                                setEditingMessageId(null);
                              }
                            }}
                            onBlur={async () => {
                              if (editText.trim() !== msg.text) {
                                await editMessage(
                                  chatId,
                                  msg.messageId,
                                  editText
                                );
                              }
                              setEditingMessageId(null);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none"
                          />
                        ) : (
                          <p className="text-sx text-[#2A3D39] leading-relaxed">
                            {msg.isDeleted ? (
                              <i className="text-gray-400">
                                Message has been deleted
                              </i>
                            ) : (
                              <>
                                {msg.text}
                                {msg.isEdited && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    (edited)
                                  </span>
                                  // hoặc dùng icon chỉnh sửa tùy theo bạn thích
                                  // <EditIcon className="inline w-3 h-3 ml-1 text-gray-400" />
                                )}
                              </>
                            )}
                          </p>
                        )}
                        {hoveredMessage === index && (
                          <>
                            <div
                              className="absolute left-[-30px] top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer"
                              onClick={() => toggleMenu(index)}
                            >
                              <BsThreeDots size={16} color="#555" />
                            </div>
                            {activeMenu === index && (
                              <div className="absolute top-8 right-0 bg-white shadow-lg rounded-lg p-2 w-40 z-10">
                                <ul className="text-sm text-gray-700">
                                  {msg.isDeleted ? (
                                    // Nếu tin nhắn đã bị xóa, chỉ hiện "Remove"
                                    <li
                                      className="p-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        deleteMessagePermanently(
                                          chatId,
                                          msg.messageId
                                        );
                                        setActiveMenu(null);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      Remove
                                    </li>
                                  ) : (
                                    // Nếu chưa xóa, hiện đủ lựa chọn
                                    <>
                                      <li
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() =>
                                          console.log("Reply clicked")
                                        }
                                      >
                                        Reply
                                      </li>
                                      <li
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          setEditingMessageId(msg.messageId);
                                          setEditText(msg.text);
                                          setActiveMenu(null);
                                        }}
                                      >
                                        Edit
                                      </li>
                                      <li
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          setSelectedMessage({
                                            chatId,
                                            messageId: msg.messageId,
                                          });
                                          setIsDialogOpen(true);
                                        }}
                                      >
                                        Delete
                                      </li>
                                    </>
                                  )}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <p className="text-gray-400 text-xs text-right mt-3">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start w-full">
                  <span className="flex gap-1 max-w-[70%] h-auto text-sx text-right">
                    <img
                      src={selectedUser?.image || imageDefault}
                      alt="defaultImage"
                      className="h-11 w-11 object-cover rounded-full"
                    />
                    <div>
                      <div className="relative bg-white px-4 py-2 rounded-lg break-all shadow-sm break-words whitespace-pre-wrap max-w-[75vw] text-left">
                        <p className="text-sx text-[#2A3D39] leading-relaxed">
                          {msg.isDeleted ? (
                            <i className="text-gray-400">
                              This message has been deleted
                            </i>
                          ) : (
                            msg.text
                          )}
                        </p>
                        {hoveredMessage === index && (
                          <div className="absolute flex justify-center items-center top-1/2 -right-7 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer">
                            <BsThreeDots size={16} color="#555" />
                          </div>
                        )}
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
      <div className="sticky lg:bottom-0 bottom-[20px] p-3 h-fit w-full">
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
      <RemoveMessageDialogComponent
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)} // Đóng dialog
        onConfirm={async (selectedOption) => {
          if (selectedMessage) {
            if (selectedOption === "all") {
              // Xóa tin nhắn với mọi người
              await deleteMessage(
                selectedMessage.chatId,
                selectedMessage.messageId
              );
            } else if (selectedOption === "you") {
              // Xóa tin nhắn chỉ với bạn (ẩn khỏi giao diện)
              setMessages((prevMessages) =>
                prevMessages.filter(
                  (msg) => msg.messageId !== selectedMessage.messageId
                )
              );
            }
            setIsDialogOpen(false); // Đóng dialog sau khi xử lý
          }
        }}
      />
    </main>
  );
};

export default MessageList;
