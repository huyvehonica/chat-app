import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  listenForIncomingCalls,
  updateCallStatus,
  rtdb,
} from "../firebase/firebase";
import { RiPhoneFill, RiCloseLine } from "react-icons/ri";
import { ref, get } from "firebase/database";

const IncomingCallNotification = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerName, setCallerName] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    let audio;

    const unsubscribe = listenForIncomingCalls(
      auth.currentUser.uid,
      async (call) => {
        setIncomingCall(call);

        // Fetch caller's information from the database
        try {
          const userRef = ref(rtdb, `users/${call.callerUid}`);
          const userSnapshot = await get(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setCallerName(userData.fullName || userData.username || "User");
            console.log("Caller data:", userData);
          }
        } catch (error) {
          console.error("Error fetching caller information:", error);
        }

        // Play ringtone
        audio = new Audio("/ringtone.mp3");
        audio.loop = true;
        audio.play().catch((e) => console.error("Could not play ringtone:", e));
      }
    );

    return () => {
      unsubscribe();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [auth.currentUser]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    await updateCallStatus(incomingCall.callId, "accepted");
    navigate(
      `/video-call?callId=${incomingCall.callId}&callerUserID=${incomingCall.callerUid}&calleeUserID=${auth.currentUser.uid}`
    );
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;

    await updateCallStatus(incomingCall.callId, "rejected");
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                callerName
              )}&background=01AA85&color=fff`}
              alt="Caller"
              className="w-16 h-16 rounded-full"
            />
          </div>
          <h3 className="text-xl text-gray-600 font-semibold mb-1">
            Incoming Video Call
          </h3>
          <h2 className="text-gray-600 mb-6scroll-m-20  pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {callerName} is calling you
          </h2>

          <div className="flex justify-center gap-6 w-full">
            <button
              onClick={handleRejectCall}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
            >
              <RiCloseLine size={24} />
            </button>
            <button
              onClick={handleAcceptCall}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
            >
              <RiPhoneFill size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;
