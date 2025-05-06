import React, { useEffect, useState } from "react";

import { LuDownload, LuFile } from "react-icons/lu";
import imageDefault from "../assets/default.jpg";
import { BsThreeDots } from "react-icons/bs";
import { ref, get } from "firebase/database"; // Import Firebase Realtime Database
import { rtdb } from "../firebase/firebase"; // Import Firebase instance
import formatTimestamp from "../utils/formatTimestamp";
import { FaRegSmile } from "react-icons/fa";
import ReactionBar from "./ReactionBar";

const RecipientMessage = ({
  msg,
  selectedUser,
  handleDownloadFile,
  formatBytes,
  index,
  hoveredMessage,
  handleImageClick,
  setHoveredMessage,
  handleReaction,
  showReactionBar,
  setShowReactionBar,
}) => {
  const [senderInfo, setSenderInfo] = useState(null);

  // Lấy thông tin người gửi từ Firebase
  useEffect(() => {
    const fetchSenderInfo = async () => {
      if (msg.sender) {
        const userRef = ref(rtdb, `users/${msg.sender}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setSenderInfo(snapshot.val());
        } else {
          setSenderInfo({ fullName: "Unknown User", image: imageDefault });
        }
      }
    };
    console.log("Sender ID:", senderInfo);
    fetchSenderInfo();
  }, [msg.sender]);
  return (
    <div className="flex flex-col items-start w-full mb-4">
      <span className="flex gap-1 max-w-[70%] h-auto text-sx text-right">
        <img
          src={senderInfo?.image || imageDefault}
          alt="defaultImage"
          className="h-10 w-10 object-cover rounded-full"
        />
        <div>
          {/* Recipient's file message */}
          {msg.type === "image" ? (
            <div className="relative">
              <img
                src={msg.fileURL}
                alt={msg.name}
                onClick={() => handleImageClick(msg.fileURL)}
                className="max-w-[250px] max-h-[300px] rounded-lg shadow-sm object-cover"
              />
              {/* <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  onClick={() => handleDownloadFile(msg.fileURL, msg.name)}
                  className="bg-white/80 hover:bg-white p-1 rounded-full text-[#01aa85]"
                >
                  <LuDownload size={18} />
                </button>
              </div> */}
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
                </div>
              </div>
              {msg.status === "done" && (
                <button
                  onClick={() => handleDownloadFile(msg.fileURL, msg.name)}
                  className="ml-auto text-[#01aa85] hover:bg-[#e6f7f3] p-1 rounded-full"
                >
                  <LuDownload size={18} />
                </button>
              )}
            </div>
          ) : (
            // Regular text message
            <div className="relative bg-white px-4 py-2 rounded-lg break-all shadow-sm break-words whitespace-pre-wrap max-w-[75vw] text-left">
              <p className="text-sx text-[#2A3D39] leading-relaxed">
                {msg.isDeleted ? (
                  <i className="text-gray-400">This message has been deleted</i>
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
              {hoveredMessage === index && (
                <>
                  <div className="absolute flex justify-center items-center top-0 -right-7  h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer message-menu">
                    <BsThreeDots size={16} color="#555" />
                  </div>
                  <div
                    className="absolute flex justify-center items-center top-0 -right-14  h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer reaction-bar"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactionBar(msg.messageId);
                    }}
                  >
                    <FaRegSmile size={16} color="#555" />
                  </div>
                  {showReactionBar === msg.messageId && (
                    <div className="absolute right-[15px] top-1/3 reaction-bar-container z-50">
                      <ReactionBar
                        className="left-[120px] top-1/2 -translate-y-1/2 mr-500"
                        onSelectReaction={(emoji) => {
                          handleReaction(msg.messageId, emoji);
                          setShowReactionBar(null);
                        }}
                        position="top"
                      />
                    </div>
                  )}
                </>
              )}
              {!msg.isDeleted && msg.reactions && (
                <div className=" absolute right-0 translate-y-1/2  top-0 translate-x-1/2 bg-white p-1 rounded-full shadow text-sm flex gap-1 border border-gray-200">
                  {Object.values(msg.reactions).map((reaction, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 rounded-full text-sm  hover:bg-gray-200"
                    >
                      {reaction.emoji}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-gray-400 text-xs text-left mt-1">
            {formatTimestamp(msg.timestamp)}
          </p>
        </div>
      </span>
    </div>
  );
};

export default RecipientMessage;
