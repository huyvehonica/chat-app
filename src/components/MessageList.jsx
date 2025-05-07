import React, { useRef, useEffect, useState } from "react";
import formatTimestamp from "../utils/formatTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import { BsThreeDots } from "react-icons/bs";
import { FaRegSmile } from "react-icons/fa";
import { ref as dbRef, set, update } from "firebase/database";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { listenForGroupMessages, rtdb, storage } from "../firebase/firebase";
import { RemoveMessageDialogComponent } from "./RemoveMessageDialogComponent";
import { LucideUploadCloud, Mic, MicOff } from "lucide-react";
import { LuFile, LuDownload } from "react-icons/lu";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";
import RecipientMessage from "./RecipientMessage";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import MessageReactions from "./MessageReactions";
import ReactionBar from "./ReactionBar";

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
  onScroll, // Thêm prop onScroll
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileInputRef] = useState(React.createRef());
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [prevTranscript, setPrevTranscript] = useState(""); // Track previous transcript

  const chatBoxRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const [showReactionBar, setShowReactionBar] = useState(null);
  const [messageWithOpenMenu, setMessageWithOpenMenu] = useState(null);
  const [messageWithOpenEmoji, setMessageWithOpenEmoji] = useState(null);
  const handleReaction = async (messageId, emoji) => {
    // Xác định xem đây là chat 1-1 hay chat nhóm dựa theo selectedUser
    const isGroupChat = selectedUser?.type === "group";

    // Tạo đường dẫn tới nút reaction phù hợp
    const reactionPath = isGroupChat
      ? `groups/${chatId}/messages/${messageId}/reactions/${senderEmail.replace(
          /[.#$\/[\]]/g,
          "_"
        )}`
      : `chats/${chatId}/messages/${messageId}/reactions/${senderEmail.replace(
          /[.#$\/[\]]/g,
          "_"
        )}`;

    const messageRef = dbRef(rtdb, reactionPath);

    await set(messageRef, {
      emoji,
      timestamp: Date.now(),
      userId: senderEmail,
    });

    setShowReactionBar(null); // Hide reaction bar after selecting
  };
  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Update message input with speech transcript (optimized)
  useEffect(() => {
    if (transcript && transcript !== prevTranscript && listening) {
      // Only update when transcript changes
      const newText = transcript.slice(prevTranscript.length);
      if (newText.trim()) {
        setSendMessageText((prev) => prev + newText);
        setPrevTranscript(transcript);
      }
    }
  }, [transcript, prevTranscript, listening]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if clicking on emoji button
      if (
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target) &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }

      // Check if clicking on message menu
      const isClickingOnMenu = event.target.closest(".message-menu");
      if (!isClickingOnMenu && messageWithOpenMenu !== null) {
        setMessageWithOpenMenu(null);
      }

      // Check if clicking on reaction bar or its container
      const isClickingOnReactionBar = event.target.closest(".reaction-bar");
      const isClickingOnReactionContainer = event.target.closest(
        ".reaction-bar-container"
      );

      if (
        !isClickingOnReactionBar &&
        !isClickingOnReactionContainer &&
        messageWithOpenEmoji !== null
      ) {
        setShowReactionBar(null);
        setMessageWithOpenEmoji(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [messageWithOpenMenu, messageWithOpenEmoji]);

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (listening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Start speech recognition with proper setup
  const startSpeechRecognition = () => {
    resetTranscript();
    setPrevTranscript("");
    setTimeout(() => {
      SpeechRecognition.startListening({
        continuous: true,
        language: "vi-VN", // Tiếng Việt
        interimResults: true,
      });
      setIsSpeechActive(true);
      toast.success("Mở chế độ ghi âm. Hãy nói...");
    }, 100);
  };

  // Stop speech recognition
  const stopSpeechRecognition = () => {
    SpeechRecognition.stopListening();
    setIsSpeechActive(false);
    const finalTranscript = transcript;
    setTimeout(() => {
      resetTranscript();
      setPrevTranscript("");
    }, 100);
  };

  const toggleMenu = (messageId) => {
    setMessageWithOpenMenu((prev) => (prev === messageId ? null : messageId));
    // Reset emoji picker state nếu mở menu
    if (messageWithOpenEmoji === messageId) {
      setShowReactionBar(null);
      setMessageWithOpenEmoji(null);
    }
  };
  const toggleEmojiReaction = (messageId) => {
    setMessageWithOpenEmoji((prev) => (prev === messageId ? null : messageId));
    setShowReactionBar((prev) => (prev === messageId ? null : messageId));
    // Reset menu state nếu mở emoji picker
    if (messageWithOpenMenu === messageId) {
      setMessageWithOpenMenu(null);
    }
  };
  const [hoveredMessage, setHoveredMessage] = useState(null);
  useEffect(() => {
    if (selectedUser?.type === "group") {
      const unsubscribe = listenForGroupMessages(chatId, setMessages);
      return () => unsubscribe();
    }
  }, [chatId, selectedUser]);

  const editMessage = async (chatId, messageId, newText) => {
    const messageRef = dbRef(rtdb, `chats/${chatId}/messages/${messageId}`);
    await update(messageRef, {
      text: newText,
      isEdited: true,
    });
  };

  const deleteMessage = async (chatId, messageId) => {
    const messageRef = dbRef(rtdb, `chats/${chatId}/messages/${messageId}`);
    await update(messageRef, { isDeleted: true });
  };
  const isImageFile = (fileName) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    const extension = fileName.split(".").pop().toLowerCase();
    return imageExtensions.includes(extension);
  };
  // Handle file upload to Firebase Storage
  const uploadFileToFirebase = async (file, messageId) => {
    try {
      // Create storage reference
      const fileStorageRef = storageRef(
        storage,
        `chat-files/${chatId}/${messageId}_${file.name}`
      );

      // Start upload
      const uploadTask = uploadBytesResumable(fileStorageRef, file);

      // Monitor upload progress and update state
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [messageId]: progress,
          }));
        },
        (error) => {
          console.error("Upload error:", error);
          updateMessageStatus(messageId, "error");
        },
        async () => {
          // Upload complete, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save file message to Realtime Database
          const messageRef = dbRef(
            rtdb,
            `chats/${chatId}/messages/${messageId}`
          );
          const isImage = isImageFile(file.name);
          await update(messageRef, {
            type: isImage ? "image" : "file",
            name: file.name,
            size: file.size,
            fileURL: downloadURL,
            status: "done",
            sender: senderEmail,
            timestamp: Date.now(),
          });

          // Update local message state
          updateMessageStatus(
            messageId,
            "done",
            downloadURL,
            isImage ? "image" : "file"
          );
        }
      );
    } catch (error) {
      console.error("File upload error:", error);
      updateMessageStatus(messageId, "error");
    }
  };

  const updateMessageStatus = (id, status, fileURL = null, type = null) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === id
          ? { ...msg, status, fileURL, ...(type ? { type } : {}) }
          : msg
      )
    );
  };

  const handleFileUpload = (file) => {
    // Check file size limit (100MB)
    if (file.size > 104857600) {
      toast.error("File size exceeds 100MB limit.");
      return;
    }

    // Create initial message object
    const messageId = Date.now().toString();
    const fileMessage = {
      messageId,
      type: isImageFile(file.name) ? "image" : "file",
      name: file.name,
      size: file.size,
      sender: senderEmail,
      timestamp: Date.now(),
      status: "uploading",
    };

    // Add message to local state
    setMessages((prev) => [...prev, fileMessage]);

    // Add initial message to database
    const messageRef = dbRef(rtdb, `chats/${chatId}/messages/${messageId}`);
    set(messageRef, fileMessage);

    // Start upload process
    uploadFileToFirebase(file, messageId);
  };

  const handleDownloadFile = (fileURL, fileName) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = fileURL;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
      e.stopPropagation();
    };

    const handleDropFile = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
      }
    };

    // Add event listeners
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDropFile);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDropFile);
    };
  }, [chatId, senderEmail]);

  // Handle manual file selection
  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Render upload progress
  const renderProgress = (progress) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div
          className="bg-green-500 h-1.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };
  const handleImageClick = (imageURL) => {
    setSelectedImage(imageURL);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Custom handle send message with speech recognition support
  const handleSendMessageWithSpeech = (e) => {
    e.preventDefault();

    // If speech recognition is active, stop it when sending
    if (listening) {
      // Dừng listen trước tiên
      SpeechRecognition.stopListening();
      setIsSpeechActive(false);

      // Gửi message với text hiện tại, không đợi transcript thêm vào
      setTimeout(() => {
        // Reset sau khi đã gửi
        resetTranscript();
        setPrevTranscript("");
      }, 100);
    }

    // Close emoji picker if open when sending message
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }

    // Call the original handleSendMessage function
    handleSendMessage(e);
  };

  // Cleanup speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [listening]);

  // Thêm handler cho sự kiện cuộn
  useEffect(() => {
    const scrollContainer = scrollRef.current;

    if (scrollContainer && onScroll) {
      scrollContainer.addEventListener("scroll", onScroll);

      return () => {
        scrollContainer.removeEventListener("scroll", onScroll);
      };
    }
  }, [scrollRef, onScroll]);

  console.log("Messages:", messages);

  return (
    <main className="custom-scrollbar relative h-full w-[100%] flex flex-col justify-between">
      {/* Hidden file input for manual file selection */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
            e.target.value = null; // Reset input
          }
        }}
      />

      <section className="px-3 pt-5" ref={chatBoxRef}>
        <div
          ref={scrollRef}
          className="overflow-auto h-[80vh] custom-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages?.map((msg, index) => (
            <div
              key={msg.messageId}
              className="relative group"
              onMouseEnter={() => setHoveredMessage(index)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {msg?.sender === senderEmail ? (
                // Tin nhắn của người gửi hiện tại
                <div
                  className="flex flex-col items-end justify-end w-full mb-4"
                  onMouseEnter={() => setHoveredMessage(index)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className="flex justify-end gap-1 max-w-[70%] h-auto text-sx text-left">
                    <div className="relative">
                      {/* Hiển thị tin nhắn */}
                      {msg.type === "image" ? (
                        <div className="relative">
                          <img
                            src={msg.fileURL}
                            alt={msg.name}
                            className="max-w-[250px] max-h-[300px] rounded-lg shadow-sm object-cover"
                            onLoad={() => {
                              // Scroll to bottom when image loads
                              if (scrollRef.current) {
                                scrollRef.current.scrollTop =
                                  scrollRef.current.scrollHeight;
                              }
                            }}
                            onClick={() => handleImageClick(msg.fileURL)}
                          />
                          {/* <div className="absolute bottom-2 right-2 flex gap-1">
                            <button
                              onClick={() =>
                                handleDownloadFile(msg.fileURL, msg.name)
                              }
                              className="bg-white/80 hover:bg-white p-1 rounded-full text-[#01aa85]"
                            >
                              <LuDownload size={18} />
                            </button>
                          </div> */}
                          {msg.status === "uploading" &&
                            uploadProgress[msg.messageId] && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                                <div className="bg-white rounded-full p-2">
                                  <CgSpinner
                                    className="animate-spin text-[#01aa85]"
                                    size={24}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      ) : msg.type === "file" ? (
                        <div className="bg-white relative flex justify-between items-center gap-3 p-3 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl text-[#01aa85]">
                              <LuFile className="shrink-0" />
                            </div>
                            <div className="flex flex-col text-sm max-w-[140px]">
                              <span className="font-medium text-gray-800 truncate">
                                {msg.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatBytes(msg.size)}
                              </span>
                              {msg.status === "uploading" &&
                                uploadProgress[msg.messageId] &&
                                renderProgress(uploadProgress[msg.messageId])}
                            </div>
                          </div>
                          <div className="ml-auto text-[#01aa85]">
                            {msg.status === "uploading" ? (
                              <CgSpinner className="animate-spin" size={20} />
                            ) : msg.status === "done" ? (
                              <button
                                onClick={() =>
                                  handleDownloadFile(msg.fileURL, msg.name)
                                }
                                className="hover:bg-[#e6f7f3] p-1 rounded-full"
                              >
                                <LuDownload size={18} />
                              </button>
                            ) : (
                              <span className="text-red-500 text-xs">
                                Error
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
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
                            <div className="relative w-fit">
                              <div className="inline-block">
                                <p className="text-sx text-[#2A3D39] leading-relaxed inline-block">
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
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                          {(hoveredMessage === index ||
                            messageWithOpenMenu === msg.messageId ||
                            messageWithOpenEmoji === msg.messageId) && (
                            <>
                              <div
                                className="absolute left-[-30px] top-0 flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer message-menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(msg.messageId);
                                }}
                              >
                                <BsThreeDots size={16} color="#555" />
                                {messageWithOpenMenu === msg.messageId && (
                                  <div className="absolute top-8 right-0 bg-white shadow-lg rounded-lg p-2 w-40 z-50 message-menu-container">
                                    <ul className="text-sm text-gray-700">
                                      {msg.isDeleted ? (
                                        <li
                                          className="p-2 hover:bg-gray-100 cursor-pointer"
                                          onClick={() => {
                                            // Handle permanent delete
                                            setActiveMenu(null);
                                            setIsDialogOpen(true);
                                          }}
                                        >
                                          Remove
                                        </li>
                                      ) : (
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
                                              setEditingMessageId(
                                                msg.messageId
                                              );
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
                              </div>

                              <div
                                className="absolute left-[-60px] top-0 flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer reaction-bar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEmojiReaction(msg.messageId);
                                }}
                              >
                                <FaRegSmile size={16} color="#555" />
                                {showReactionBar === msg.messageId && (
                                  <div className="absolute -left-40 top-1/5 reaction-bar-container z-1000">
                                    <ReactionBar
                                      className="right-[120px] top-1/2 -translate-y-1/2 mr-500"
                                      onSelectReaction={(emoji) => {
                                        handleReaction(msg.messageId, emoji);
                                        setShowReactionBar(null);
                                        setMessageWithOpenEmoji(null);
                                      }}
                                      position="top"
                                    />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                          {!msg.isDeleted && (
                            <MessageReactions message={msg} chatId={chatId} />
                          )}
                        </div>
                      )}
                      <p className="text-gray-400 text-xs text-right mt-1">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Tin nhắn của người khác
                <RecipientMessage
                  msg={msg}
                  selectedUser={selectedUser}
                  handleDownloadFile={handleDownloadFile}
                  formatBytes={formatBytes}
                  index={index}
                  hoveredMessage={hoveredMessage}
                  setHoveredMessage={setHoveredMessage}
                  selectedImage={selectedImage}
                  handleImageClick={handleImageClick}
                  closeImageModal={closeImageModal}
                  handleReaction={handleReaction}
                  showReactionBar={showReactionBar}
                  setShowReactionBar={setShowReactionBar}
                  chatId={chatId}
                />
              )}
            </div>
          ))}
        </div>
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-none transition-all duration-300">
            <div className="flex flex-col items-center gap-2 bg-white p-6 rounded-xl shadow-2xl text-center text-[#01aa85] font-semibold animate-fade-in max-w-sm w-full">
              <div className="text-4xl">
                <LucideUploadCloud className="animate-bounce" />
              </div>
              <div>Drop files here to submit</div>
              <div className="text-sm text-gray-500">Maximum 100MB</div>
            </div>
          </div>
        )}
      </section>
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeImageModal}
        >
          <img
            src={selectedImage}
            alt="Full Screen"
            className="max-w-full max-h-full"
          />

          <button
            className="absolute top-5 right-5 text-white text-2xl"
            onClick={closeImageModal}
          >
            &times;
          </button>
        </div>
      )}
      <div className="sticky lg:bottom-0 bottom-[20px] p-3 h-fit w-full">
        <div>
          <form
            onSubmit={handleSendMessageWithSpeech}
            className="flex items-center bg-white h-[45px] w-full px-2 rounded-lg relative shadow-lg"
          >
            <input
              type="text"
              value={sendMessageText}
              onChange={(e) => setSendMessageText(e.target.value)}
              placeholder={listening ? "Đang ghi âm..." : "Write your message"}
              className={`h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[90px] rounded-lg w-[100%] ${
                listening ? "bg-[#f0f9f7]" : ""
              }`}
            />
            <div className="relative">
              <button
                type="button"
                ref={emojiButtonRef}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex absolute top-1/2 -translate-y-1/2 right-[110px] p-2 rounded-full hover:bg-[#e6f7f3]"
              >
                <FaRegSmile color="#01AA85" size={18} />
              </button>

              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute lg:bottom-[50px] bottom-[60px] lg:right-[120px] right-[60px] z-[100] shadow-lg scale-[0.85] lg:scale-100 origin-bottom-right"
                >
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji) => {
                      setSendMessageText((prev) => prev + emoji.native);
                    }}
                  />
                </div>
              )}
            </div>
            {/* Speech-to-text button */}
            {browserSupportsSpeechRecognition && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center justify-center absolute right-[50px] p-2 rounded-full ${
                  listening ? "bg-[#ff4d4f] text-white" : "hover:bg-[#e6f7f3]"
                }`}
                title={listening ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
              >
                {listening ? (
                  <MicOff size={18} />
                ) : (
                  <Mic color="#01AA85" size={18} />
                )}
              </button>
            )}

            {/* Add file upload button */}
            <button
              type="button"
              onClick={handleFileSelect}
              className="flex items-center justify-center absolute right-[80px] p-2 rounded-full hover:bg-[#e6f7f3]"
            >
              <LucideUploadCloud color="#01AA85" size={18} />
            </button>

            <button
              type="submit"
              className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3]"
            >
              <RiSendPlaneFill color="#01AA85" />
            </button>
          </form>

          {/* Speech recognition status indicator */}
          {listening && (
            <div className="absolute bottom-[-24px] left-3 flex items-center gap-1 text-xs text-[#01AA85]">
              <div className="w-2 h-2 rounded-full bg-[#ff4d4f] animate-pulse"></div>
              <span>Đang ghi âm...</span>
            </div>
          )}
        </div>
      </div>
      <RemoveMessageDialogComponent
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={async (selectedOption) => {
          if (selectedMessage) {
            if (selectedOption === "all") {
              await deleteMessage(
                selectedMessage.chatId,
                selectedMessage.messageId
              );
            } else if (selectedOption === "you") {
              setMessages((prevMessages) =>
                prevMessages.filter(
                  (msg) => msg.messageId !== selectedMessage.messageId
                )
              );
            }
            setIsDialogOpen(false);
          }
        }}
      />
    </main>
  );
};

export default MessageList;
