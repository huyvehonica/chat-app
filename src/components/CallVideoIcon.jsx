import React from "react";

const CallVideoIcon = ({ onClick }) => {
  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={onClick}
          className="flex items-center justify-center bg-[#D9F2ED] hover:bg-[#c8eae3] p-2 rounded-full shadow-md"
          title="Video Call"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#01AA85"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m0 0l-3.553 1.776A1 1 0 0110 14.382V9.618a1 1 0 011.447-.894L15 10zm0 0v4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CallVideoIcon;
