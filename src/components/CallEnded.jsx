import React from "react";
import { useNavigate } from "react-router-dom";

const CallEnded = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-white text-2xl mb-4">Call Ended</h1>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Back to Home
      </button>
    </div>
  );
};

export default CallEnded;
