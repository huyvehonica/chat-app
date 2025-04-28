import React, { useEffect, useState } from "react";
import {
  TUICallKit,
  TUICallKitServer,
  TUICallType,
} from "@tencentcloud/call-uikit-react";
import * as GenerateTestUserSig from "../debug/GenerateTestUserSig-es";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  auth,
  initiateCall,
  updateCallStatus,
  endCall,
  getCurrentUserProfile,
  rtdb,
} from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";

const SDKAppID = 20022132; // Replace with your actual AppID
const SDKSecretKey =
  "c25c392a16a1905567574b56e1423b87f7bfaab08d4e66838d80c071652db0fc"; // Don't use this key in production

const VideoCallPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const callId = searchParams.get("callId");
  const callerUserID = searchParams.get("callerUserID");
  const calleeUserID = searchParams.get("calleeUserID");
  const isGroup = searchParams.get("isGroup") === "true";
  const groupId = searchParams.get("groupId");

  const [initSuccess, setInitSuccess] = useState(false);
  const [currentUserID, setCurrentUserID] = useState("");
  const [callInitiated, setCallInitiated] = useState(false);

  // Handle TUICallKit initialization
  useEffect(() => {
    const initTUICallKit = async () => {
      if (!auth.currentUser) {
        console.error("User not authenticated");
        navigate("/login");
        return;
      }
      console.log("Authenticated user:", auth.currentUser);
      try {
        const userID = auth.currentUser.uid;

        console.error("User ID:", userID);

        setCurrentUserID(userID);

        const { userSig } = GenerateTestUserSig.genTestUserSig({
          userID,
          SDKAppID,
          SecretKey: SDKSecretKey,
        });

        await TUICallKitServer.init({
          userID,
          userSig,
          SDKAppID,
        });
        const userProfile = await getCurrentUserProfile();
        await TUICallKitServer.setSelfInfo({
          nickName: userProfile.fullName || "Unknown",
          avatar:
            userProfile.photoURL ||
            "https://default-avatar-url.com/default.png",
        });
        try {
          TUICallKitServer.enableFloatWindow(true);
        } catch (error) {
          alert(`[TUICallKit] enableFloatWindow failed. Reason: ${error}`);
        }

        setInitSuccess(true);
      } catch (err) {
        console.error("TUICallKit init failed:", err);
      }
    };

    initTUICallKit();

    // Clean up when component unmounts
    return () => {
      if (callId) {
        endCall(callId).catch(console.error);
      }
    };
  }, [navigate]);

  // Handle call initiation or joining
  useEffect(() => {
    if (!initSuccess || callInitiated) return;

    const makeOrJoinCall = async () => {
      try {
        // If group call
        if (isGroup && groupId) {
          // Get group information
          const groupRef = ref(rtdb, `groups/${groupId}`);
          const groupSnapshot = await get(groupRef);

          if (groupSnapshot.exists()) {
            const groupData = groupSnapshot.val();

            // Get all members except the current user
            const memberIds = Object.keys(groupData.members || {}).filter(
              (uid) => uid !== auth.currentUser.uid
            );

            if (memberIds.length > 0) {
              // Call all members using TUICallKit
              const params = {
                userIDList: memberIds,
                type: TUICallType.VIDEO_CALL,
              };
              console.log("Group Call Params:", params);
              await TUICallKitServer.calls(params);
            } else {
              console.warn("No members to call in this group");
            }
          }
        }
        // Individual call logic (existing code)
        else if (callerUserID === auth.currentUser.uid && calleeUserID) {
          // Make the call
          await TUICallKitServer.calls({
            userIDList: [calleeUserID],
            type: TUICallType.VIDEO_CALL,
          });
        }
        // If receiver of a call that's been accepted
        else if (callId && calleeUserID === auth.currentUser.uid) {
          // Update call status to joined
          await updateCallStatus(callId, "joined");
        }

        setCallInitiated(true);
      } catch (error) {
        console.error("Error making or joining call:", error);
        alert("Failed to connect: " + error.message);
        navigate("/chat");
      }
    };

    makeOrJoinCall();
  }, [
    initSuccess,
    callerUserID,
    calleeUserID,
    callId,
    callInitiated,
    isGroup,
    groupId,
  ]);

  // Handle call events
  useEffect(() => {
    const handleCallEnded = () => {
      if (callId) {
        endCall(callId).catch(console.error);
      }
      navigate("/chat");
    };

    // Add event listeners for call events
    if (initSuccess) {
      // Listen for call end events
      // (Note: This depends on TUICallKit API, adjust as needed)
      // TUICallKitServer.on("onCallEnd", handleCallEnded);

      return () => {
        // TUICallKitServer.off("onCallEnd", handleCallEnded);
      };
    }
  }, [initSuccess, callId, navigate]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {initSuccess && (
        <TUICallKit allowedMinimized={true} allowedFullScree={true} />
      )}
    </div>
  );
};

export default VideoCallPage;
