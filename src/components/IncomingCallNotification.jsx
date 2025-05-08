import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  listenForIncomingCalls,
  updateCallStatus,
  rtdb,
} from "../firebase/firebase";
import { RiPhoneFill, RiCloseLine } from "react-icons/ri";
import { ref, get } from "firebase/database";
import ringtoneSound from "../assets/ringtone.mp3";

const IncomingCallNotification = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerName, setCallerName] = useState("User");
  const [userImage, setImage] = useState(null);
  const [isGroupCall, setIsGroupCall] = useState(false);
  const [groupName, setGroupName] = useState("");
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = listenForIncomingCalls(
      auth.currentUser.uid,
      async (call) => {
        // Handle group calls
        if (call.isGroupCall && Array.isArray(call.calleeUids)) {
          // Check if current user is included in the callees for this group call
          if (!call.calleeUids.includes(auth.currentUser.uid)) return;

          setIsGroupCall(true);
          setIncomingCall(call);

          // Get group information if available
          try {
            const groupRef = ref(rtdb, `groups/${call.groupId}`);
            const groupSnapshot = await get(groupRef);

            if (groupSnapshot.exists()) {
              const groupData = groupSnapshot.val();
              setGroupName(groupData.name || "Group Call");
            } else {
              setGroupName("Group Call");
            }
          } catch (error) {
            console.error("Error fetching group information:", error);
            setGroupName("Group Call");
          }

          // Get caller information
          try {
            const userRef = ref(rtdb, `users/${call.callerUid}`);
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              setImage(userData.image || null);
              setCallerName(userData.fullName || userData.username || "User");
            }
          } catch (error) {
            console.error("Error fetching caller information:", error);
          }
        }
        // Handle 1-1 calls (existing logic)
        else if (!call.isGroupCall && call.calleeUid === auth.currentUser.uid) {
          setIsGroupCall(false);
          setIncomingCall(call);

          // Fetch caller's information from database
          try {
            const userRef = ref(rtdb, `users/${call.callerUid}`);
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              setImage(userData.image || null);
              setCallerName(userData.fullName || userData.username || "User");
            }
          } catch (error) {
            console.error("Error fetching caller information:", error);
          }
        } else {
          // Not a call for this user
          return;
        }

        // Play ringtone for all call types - fixed path by using imported audio file
        const audio = new Audio(ringtoneSound);
        audio.volume = 0.5; // Set volume to 50%
        audio.muted = false; // Ensure audio is not muted
        audio.loop = true;
        audioRef.current = audio;

        try {
          // Preload the audio file before playing
          audio.load();
          await audio.play();
          console.log("Ringtone playing successfully");
        } catch (e) {
          console.error("Could not play ringtone:", e);
          // Try alternative approach as fallback
          const fallbackAudio = document.createElement("audio");
          fallbackAudio.src = "/src/assets/ringtone.mp3";
          fallbackAudio.loop = true;
          fallbackAudio.volume = 0.5;
          document.body.appendChild(fallbackAudio);
          audioRef.current = fallbackAudio;
          fallbackAudio
            .play()
            .catch((err) => console.error("Fallback audio failed:", err));
        }
      }
    );

    return () => {
      unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [auth.currentUser]);

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    // Stop ringtone first
    stopRingtone();

    await updateCallStatus(incomingCall.callId, "accepted");

    if (isGroupCall) {
      // Navigate to video call page with group call parameters
      navigate(
        `/video-call?callId=${incomingCall.callId}&callerUserID=${incomingCall.callerUid}&calleeUserID=${auth.currentUser.uid}&isGroup=true&groupId=${incomingCall.groupId}`
      );
    } else {
      // Navigate to video call page with 1-1 call parameters
      navigate(
        `/video-call?callId=${incomingCall.callId}&callerUserID=${incomingCall.callerUid}&calleeUserID=${auth.currentUser.uid}`
      );
    }
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;

    // Stop ringtone first
    stopRingtone();

    await updateCallStatus(incomingCall.callId, "rejected");
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
      <div className="bg-white dark:bg-gray-700 border dark:border-gray-700  rounded-lg shadow-xl p-6 w-[90%] max-w-md">
        <div className="flex flex-col items-center">
          <div className="w-22 h-22 rounded-full bg-teal-100 flex items-center justify-center mb-4">
            <img
              src={
                userImage
                  ? userImage
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      callerName
                    )}&background=01AA85&color=fff`
              }
              alt="Caller"
              className="w-18 h-18 rounded-full object-cover"
            />
          </div>
          <h3 className="text-xl dark:text-white text-gray-600 font-semibold mb-1">
            {isGroupCall ? "Incoming Group Video Call" : "Incoming Video Call"}
          </h3>
          <h2 className="text-gray-600 dark:text-white mb-6 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {isGroupCall
              ? `${callerName} is calling you in ${groupName}`
              : `${callerName} is calling you`}
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
