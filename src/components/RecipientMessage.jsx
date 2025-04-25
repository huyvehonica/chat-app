import React from "react";
import { LuDownload, LuFile } from "react-icons/lu";
import imageDefault from "../assets/default.jpg";
import { BsThreeDots } from "react-icons/bs";

const RecipientMessage = ({
  msg,
  selectedUser,
  handleDownloadFile,
  formatBytes,
  index,
  hoveredMessage,
  handleImageClick,
  setHoveredMessage,
}) => {
  return (
    <div className="flex flex-col items-start w-full mb-4">
      <span className="flex gap-1 max-w-[70%] h-auto text-sx text-right">
        <img
          src={selectedUser?.image || imageDefault}
          alt="defaultImage"
          className="h-11 w-11 object-cover rounded-full"
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
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  onClick={() => handleDownloadFile(msg.fileURL, msg.name)}
                  className="bg-white/80 hover:bg-white p-1 rounded-full text-[#01aa85]"
                >
                  <LuDownload size={18} />
                </button>
              </div>
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
                  msg.text
                )}
              </p>
              {hoveredMessage === index && (
                <div className="absolute flex justify-center items-center top-1/2 -right-7 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer">
                  <BsThreeDots size={16} color="#555" />
                </div>
              )}
            </div>
          )}

          <p className="text-gray-400 text-xs text-left mt-1">
            {new Date(msg.timestamp).toLocaleString()}
          </p>
        </div>
      </span>
    </div>
  );
};

export default RecipientMessage;
