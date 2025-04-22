import { useState, useEffect } from "react";
import {
  TUICallKit,
  TUICallKitServer,
  TUICallType,
} from "@tencentcloud/call-uikit-react";
import * as GenerateTestUserSig from "../debug/GenerateTestUserSig-es";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase"; // Import your Firebase auth

const VideoCall = () => {
  const SDKAppID = 20022132;
  const SDKSecretKey =
    "c25c392a16a1905567574b56e1423b87f7bfaab08d4e66838d80c071652db0fc";

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const callerParam = searchParams.get("callerUserID");
  const calleeParam = searchParams.get("calleeUserID");

  const [isSDKReady, setIsSDKReady] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("You must be logged in to make a call");
      return;
    }

    // Ensure we have both caller and callee IDs
    if (!callerParam || !calleeParam) {
      setError("Missing caller or callee information");
      return;
    }

    const initializeCall = async () => {
      try {
        setStatus("Generating credentials...");

        // Generate user signature for the current user
        const { userSig } = GenerateTestUserSig.genTestUserSig({
          userID: currentUser.uid,
          SDKAppID,
          SecretKey: SDKSecretKey,
        });

        setStatus("Initializing TUICallKit...");

        // Initialize call kit
        await TUICallKitServer.init({
          userID: currentUser.uid,
          userSig,
          SDKAppID,
        });

        console.log("TUICallKit initialized successfully");
        setStatus("SDK Ready");
        setIsSDKReady(true);

        // If this user is the caller, initiate the call
        if (currentUser.uid === callerParam) {
          initiateCall(calleeParam);
        }
      } catch (error) {
        console.error("Error in call initialization:", error);
        setError(`Failed to initialize: ${error.message || "Unknown error"}`);
      }
    };

    initializeCall();

    // Clean up when component unmounts
    return () => {
      // Try to destroy the call kit instance if possible
      try {
        if (
          TUICallKitServer.destroy &&
          typeof TUICallKitServer.destroy === "function"
        ) {
          TUICallKitServer.destroy();
        }
      } catch (error) {
        console.error("Error destroying TUICallKit:", error);
      }
    };
  }, [callerParam, calleeParam]);

  const initiateCall = async (calleeID) => {
    try {
      setStatus("Initiating call...");
      console.log(`Calling ${calleeID}...`);

      // Check which method is available in your version
      if (typeof TUICallKitServer.call === "function") {
        await TUICallKitServer.call({
          userID: calleeID,
          type: TUICallType.VIDEO_CALL,
        });
      } else if (typeof TUICallKitServer.calls === "function") {
        await TUICallKitServer.calls({
          userIDList: [calleeID],
          type: TUICallType.VIDEO_CALL,
        });
      } else {
        throw new Error("No valid call method found on TUICallKitServer");
      }

      setStatus("Call connected");
    } catch (error) {
      console.error("Error initiating call:", error);
      setError(
        `Call failed: ${error.message || "Could not connect to recipient"}`
      );
    }
  };

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl mb-4">Video Call Error</h1>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-teal-600 rounded hover:bg-teal-700"
          onClick={() => navigate(-1)}
        >
          Return to Chat
        </button>
      </div>
    );
  }

  if (!isSDKReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl mb-4">Video Call</h1>
        <p className="mb-4">{status}</p>
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      {/* End call button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => {
            // Try to hang up if the method exists
            if (
              TUICallKitServer.hangup &&
              typeof TUICallKitServer.hangup === "function"
            ) {
              TUICallKitServer.hangup();
            }
            navigate(-1);
          }}
        >
          End Call
        </button>
      </div>

      {/* TUICallKit component */}
      <TUICallKit />
    </div>
  );
};

export default VideoCall;
