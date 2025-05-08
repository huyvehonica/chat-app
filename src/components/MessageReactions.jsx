// MessageReactions.jsx - Create this new component
import React, { useState, useEffect } from "react";
import { ref, set, get } from "firebase/database";
import { rtdb } from "../firebase/firebase";
import { getAuth } from "firebase/auth";

const MessageReactions = ({ message, chatId, showCount = true }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [showReactors, setShowReactors] = useState(null);
  const [userDetails, setUserDetails] = useState({});

  // Xác định xem đây có phải tin nhắn nhóm không
  const isGroupChat =
    message.sender &&
    typeof message.sender === "string" &&
    !message.sender.includes("@");

  // Convert reactions object to array
  const getReactionsArray = () => {
    if (!message.reactions) return [];

    const reactionsArray = Object.entries(message.reactions).map(
      ([userId, reaction]) => ({
        userId,
        ...reaction,
      })
    );

    return reactionsArray;
  };

  // Fetch user details for reactions
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!message.reactions) return;

      const reactions = getReactionsArray();
      const details = {};

      for (const reaction of reactions) {
        if (!userDetails[reaction.userId]) {
          try {
            const userRef = ref(rtdb, `users/${reaction.userId}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
              details[reaction.userId] = snapshot.val();
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
          }
        }
      }

      if (Object.keys(details).length > 0) {
        setUserDetails((prev) => ({ ...prev, ...details }));
      }
    };

    fetchUserDetails();
  }, [message.reactions]);

  // Group reactions by emoji
  const getGroupedReactions = () => {
    const reactions = getReactionsArray();
    const grouped = {};

    reactions.forEach((reaction) => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = [];
      }
      grouped[reaction.emoji].push(reaction);
    });

    return grouped;
  };

  // Toggle user's reaction
  const toggleReaction = async (emoji) => {
    if (!currentUser) return;

    const userReaction = getReactionsArray().find(
      (r) => r.userId === currentUser.uid
    );

    // Create the appropriate reference path
    const reactionPath = isGroupChat
      ? `groups/${chatId}/messages/${message.messageId}/reactions/${currentUser.uid}`
      : `chats/${chatId}/messages/${message.messageId}/reactions/${currentUser.uid}`;

    const reactionRef = ref(rtdb, reactionPath);

    if (userReaction && userReaction.emoji === emoji) {
      // Remove reaction if clicking the same emoji
      await set(reactionRef, null);
    } else {
      // Add or change reaction
      await set(reactionRef, {
        emoji,
        timestamp: Date.now(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        displayName: currentUser.displayName || currentUser.email.split("@")[0],
      });
    }
  };

  const groupedReactions = getGroupedReactions();
  const reactionsExist = Object.keys(groupedReactions).length > 0;

  // Hiển thị danh sách người dùng đã thả emoji này
  const handleShowReactors = (emoji) => {
    setShowReactors(showReactors === emoji ? null : emoji);
  };

  // Get user display name from various sources
  const getUserDisplayName = (reaction) => {
    // Kiểm tra trong cache userDetails đã fetch
    if (userDetails[reaction.userId]?.fullName) {
      return userDetails[reaction.userId].fullName;
    }

    // Kiểm tra trong dữ liệu phản ứng
    if (reaction.displayName) {
      return reaction.displayName;
    }

    // Nếu có userEmail, hiển thị phần trước @
    if (reaction.userEmail) {
      return reaction.userEmail.split("@")[0];
    }

    // Trường hợp không có thông tin nào
    return "User";
  };

  return (
    <>
      {reactionsExist && (
        <div className="absolute left-0 top-0 translate-y-4 -translate-x-6 bg-white rounded-full shadow text-sm flex gap-1 border border-gray-200">
          {Object.entries(groupedReactions).map(([emoji, reactions]) => (
            <div key={emoji} className="relative">
              <button
                onClick={() => toggleReaction(emoji)}
                onMouseEnter={() => isGroupChat && handleShowReactors(emoji)}
                onMouseLeave={() => isGroupChat && setShowReactors(null)}
                className={`flex items-center gap-[1px] text-sm rounded-full transition ${
                  reactions.some((r) => r.userId === currentUser?.uid)
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <span>{emoji}</span>
                {/* Luôn hiển thị số lượng cho nhóm chat */}
                {(showCount || isGroupChat) && reactions.length > 1 && (
                  <span className="text-xs font-medium ml-0.5">
                    {reactions.length}
                  </span>
                )}
              </button>

              {/* Tooltip để hiển thị danh sách người đã thả emoji */}
              {isGroupChat &&
                showReactors === emoji &&
                reactions.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white shadow-md rounded-md p-1 text-xs min-w-[120px] z-50">
                    <div className="font-semibold border-b pb-1 mb-1 text-gray-700">
                      {reactions.length} người đã thả {emoji}
                    </div>
                    <ul className="max-h-[100px] overflow-y-auto">
                      {reactions.map((reaction, idx) => (
                        <li key={idx} className="py-0.5 text-gray-700">
                          {getUserDisplayName(reaction)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MessageReactions;
