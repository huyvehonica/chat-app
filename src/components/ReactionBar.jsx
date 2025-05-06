// ReactionBar.jsx - Create this new component
import React from "react";

const ReactionBar = ({ onSelectReaction, position = "bottom" }) => {
  const defaultReactions = ["👍", "❤️", "😆", "😮", "😢", "😠"];

  return (
    <div
      className={`absolute ${
        position === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } left-0 z-30 bg-white rounded-full shadow-lg px-2 py-1 flex items-center gap-1`}
    >
      {defaultReactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelectReaction(emoji)}
          className="hover:bg-gray-100 p-1 rounded-full transition-transform hover:scale-125"
        >
          <span className="text-lg">{emoji}</span>
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
