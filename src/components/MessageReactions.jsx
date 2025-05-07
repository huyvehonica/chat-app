// MessageReactions.jsx - Create this new component
import React from "react";
import { ref, set } from "firebase/database";
import { rtdb } from "../firebase/firebase";
import { getAuth } from "firebase/auth";

const MessageReactions = ({ message, chatId, showCount = true }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

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

    // Determine if this is a group chat message or regular chat message based on the message structure
    const isGroupChat =
      message.sender &&
      typeof message.sender === "string" &&
      !message.sender.includes("@");

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
      });
    }
  };

  const groupedReactions = getGroupedReactions();
  const reactionsExist = Object.keys(groupedReactions).length > 0;

  // Check if current user has reacted
  const getUserReaction = () => {
    const reactions = getReactionsArray();
    return reactions.find((r) => r.userId === currentUser?.uid)?.emoji;
  };

  return (
    <>
      {reactionsExist && (
        <div className="absolute left-0 top-0 translate-y-1/2 -translate-x-1/2  bg-white p-1 rounded-full shadow text-sm flex gap-1 border border-gray-200">
          {Object.entries(groupedReactions).map(([emoji, reactions]) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              className={`flex items-center gap-[1px] text-sm rounded-full transition ${
                reactions.some((r) => r.userId === currentUser?.uid)
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <span>{emoji}</span>
              {showCount && reactions.length > 1 && (
                <span className="text-xs">{reactions.length}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default MessageReactions;
