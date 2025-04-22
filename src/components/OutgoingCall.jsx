import React, { useEffect, useState } from "react";
import { ref, set, onValue, update } from "firebase/database";
import { rtdb } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

const OutgoingCall = ({ currentUser, calleeUid }) => {
  const [callStatus, setCallStatus] = useState("calling");
  const navigate = useNavigate();
  const roomId = `${currentUser.uid}-${calleeUid}-${Date.now()}`;

  useEffect(() => {
    const callRef = ref(rtdb, `calls/${roomId}`);
    set(callRef, {
      callerUid: currentUser.uid,
      calleeUid: calleeUid,
      roomId: roomId,
      status: "calling",
    });

    const statusRef = ref(rtdb, `calls/${roomId}/status`);
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setCallStatus(status);

      if (status === "accepted") {
        navigate(`/video-call?roomId=${roomId}&caller=true`);
      } else if (status === "ended") {
        navigate("/call-ended");
      }
    });
  }, [calleeUid, currentUser.uid, navigate, roomId]);

  const handleCancel = () => {
    const callRef = ref(rtdb, `calls/${roomId}`);
    update(callRef, { status: "ended" });
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-white text-2xl mb-4">Calling {calleeUid}...</h1>
      <button
        onClick={handleCancel}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Cancel
      </button>
    </div>
  );
};

export default OutgoingCall;
