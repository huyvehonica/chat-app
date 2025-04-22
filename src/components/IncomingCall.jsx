import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { rtdb } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

const IncomingCall = ({ currentUser }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const callsRef = ref(rtdb, "calls");
    onValue(callsRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const callData = childSnapshot.val();
        if (callData.calleeUid === currentUser.uid && callData.status === "calling") {
          setIncomingCall({ roomId: callData.roomId, callerUid: callData.callerUid });
        }
      });
    });
  }, [currentUser.uid]);

  const handleAccept = () => {
    if (incomingCall) {
      const callRef = ref(rtdb, `calls/${incomingCall.roomId}`);
      update(callRef, { status: "accepted" });
      navigate(`/video-call?roomId=${incomingCall.roomId}&caller=false`);
    }
  };

  const handleDecline = () => {
    if (incomingCall) {
      const callRef = ref(rtdb, `calls/${incomingCall.roomId}`);
      update(callRef, { status: "ended" });
      setIncomingCall(null);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
      {incomingCall ? (
        <>
          <h1 className="text-white text-2xl mb-4">Incoming Call</h1>
          <p className="text-white mb-4">Caller: {incomingCall.callerUid}</p>
          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Decline
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-400">No incoming calls...</p>
      )}
    </div>
  );
};

export default IncomingCall;