import React, { useEffect, useState, useRef } from "react";
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

// Sử dụng biến môi trường để lấy các key bảo mật
const SDKAppID = import.meta.env.VITE_TENCENTRTC_APPID ? parseInt(import.meta.env.VITE_TENCENTRTC_APPID) : 0;
const SDKSecretKey = import.meta.env.VITE_TENCENTRTC_SDKSECRETKEY || ""; // Lấy từ biến môi trường

const VideoCallPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const callId = searchParams.get("callId");
  const callerUserID = searchParams.get("callerUserID");
  const calleeUserID = searchParams.get("calleeUserID");
  const isGroup = searchParams.get("isGroup") === "true";
  const groupId = searchParams.get("groupId");
  // Create a ref to store the autoAccept state
  const shouldAutoAccept = useRef(
    callId && calleeUserID === auth.currentUser?.uid
  );

  const [initSuccess, setInitSuccess] = useState(false);
  const [currentUserID, setCurrentUserID] = useState("");
  const [callInitiated, setCallInitiated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

        console.log("User ID:", userID);

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

        // If this is a received call that was already accepted via IncomingCallNotification
        // We'll attempt to auto-accept after a short delay to ensure TUICallKit is ready
        if (shouldAutoAccept.current) {
          console.log(
            "Call was pre-accepted, will try to auto-accept in TUICallKit"
          );
          setTimeout(() => {
            try {
              // Direct call to accept the incoming call
              console.log("Attempting to auto-accept call in TUICallKit");
              TUICallKitServer.accept()
                .then(() => console.log("Call auto-accepted successfully"))
                .catch((err) => console.error("Auto-accept failed:", err));
            } catch (error) {
              console.error("Error during auto-accept:", error);
            }
          }, 1000); // Give TUICallKit a second to register the incoming call
        }
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
  }, [navigate, callId, calleeUserID]);

  // Handle call initiation or joining
  useEffect(() => {
    if (!initSuccess || callInitiated || isProcessing) return;

    const makeOrJoinCall = async () => {
      console.log("Making or joining call...");
      setIsProcessing(true);

      try {
        // Determine which call scenario we're in
        const currentUserId = auth.currentUser?.uid;

        // SCENARIO 1: Group call initiator
        if (isGroup && groupId && (!callId || callerUserID === currentUserId)) {
          console.log("Initiating group call for group:", groupId);

          // Get group information
          const groupRef = ref(rtdb, `groups/${groupId}`);
          const groupSnapshot = await get(groupRef);

          if (groupSnapshot.exists()) {
            console.log("Group data:", groupSnapshot.val());
            const groupData = groupSnapshot.val();

            // Get all members except the current user
            const memberIds = Object.keys(groupData.members || {}).filter(
              (uid) => uid !== currentUserId
            );
            console.log("Group members to call:", memberIds);

            if (memberIds.length > 0) {
              // Call all members using TUICallKit
              const params = {
                userIDList: memberIds,
                type: TUICallType.VIDEO_CALL,
              };
              console.log("Group Call Params:", params);
              await TUICallKitServer.calls(params);

              // If we have a callId, update its status
              if (callId) {
                await updateCallStatus(callId, "active");
              } else {
                // Create a new call record if needed
                // initiateCall() implementation depends on your firebase setup
              }
            } else {
              console.warn("No members to call in this group");
              alert("No members to call in this group");
              navigate("/chat");
              return;
            }
          } else {
            console.error("Group not found");
            alert("Group not found");
            navigate("/chat");
            return;
          }
        }
        // SCENARIO 2: Individual call initiator (1-1 call)
        else if (!isGroup && callerUserID === currentUserId && calleeUserID) {
          console.log("Initiating 1-1 call to:", calleeUserID);

          // Make the call
          await TUICallKitServer.calls({
            userIDList: [calleeUserID],
            type: TUICallType.VIDEO_CALL,
          });

          // Update call status if we have a callId
          if (callId) {
            await updateCallStatus(callId, "active");
          }
        }
        // SCENARIO 3: Call receiver - someone has called the current user
        else if (callId && calleeUserID === currentUserId) {
          console.log("Joining call as receiver, callId:", callId);
          // Just update call status to joined - the actual receiving of the call
          // is handled by TUICallKit automatically
          await updateCallStatus(callId, "joined");
        }
        // SCENARIO 4: Unknown scenario
        else {
          console.error("Unhandled call scenario", {
            isGroup,
            groupId,
            callId,
            callerUserID,
            calleeUserID,
            currentUserId,
          });
          alert("Invalid call parameters");
          navigate("/chat");
          return;
        }

        setCallInitiated(true);
      } catch (error) {
        console.error("Error making or joining call:", error);
        alert("Failed to connect: " + error.message);
        navigate("/chat");
      } finally {
        setIsProcessing(false);
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
    isProcessing,
    navigate,
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
        <TUICallKit allowedMinimized={true} allowedFullScreen={true} />
      )}
    </div>
  );
};

export default VideoCallPage;
