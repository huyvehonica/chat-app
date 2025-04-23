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
} from "../firebase/firebase";

const SDKAppID = 20022132; // Replace with your actual AppID
const SDKSecretKey =
  "c25c392a16a1905567574b56e1423b87f7bfaab08d4e66838d80c071652db0fc"; // Don't use this key in production

const VideoCallPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const callId = searchParams.get("callId");
  const callerUserID = searchParams.get("callerUserID");
  const calleeUserID = searchParams.get("calleeUserID");

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

      try {
        const userID = auth.currentUser.uid;
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
      // If caller
      if (callerUserID === auth.currentUser.uid && calleeUserID) {
        // Create a new call if not already provided
        if (!callId) {
          const newCallId = await initiateCall(
            callerUserID,
            calleeUserID,
            "video"
          );
          console.log("Created new call with ID:", newCallId);
        }

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
        // The TUICallKit should automatically handle incoming calls
      }

      setCallInitiated(true);
    };

    makeOrJoinCall();
  }, [initSuccess, callerUserID, calleeUserID, callId, callInitiated]);

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
      {initSuccess && <TUICallKit />}
    </div>
  );
};

export default VideoCallPage;
