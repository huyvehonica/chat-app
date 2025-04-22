import { useState, useEffect } from "react";
import {
  TUICallKit,
  TUICallKitServer,
  TUICallType,
} from "@tencentcloud/call-uikit-react";
import * as GenerateTestUserSig from "../debug/GenerateTestUserSig-es";
import { useLocation } from "react-router-dom";

const VideoCall = () => {
  const SDKAppID = 20022132; // Replace with your SDKAppID
  const SDKSecretKey =
    "c25c392a16a1905567574b56e1423b87f7bfaab08d4e66838d80c071652db0fc"; // Replace with your SDKSecretKey

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const callerParam = searchParams.get("callerUserID");
  const calleeParam = searchParams.get("calleeUserID");

  const [callerUserID, setCallerUserID] = useState("");
  const [calleeUserID, setCalleeUserID] = useState("");
  const [isSDKReady, setIsSDKReady] = useState(false);

  // Set caller/callee from query on mount
  useEffect(() => {
    if (callerParam) setCallerUserID(callerParam);
    if (calleeParam) setCalleeUserID(calleeParam);
  }, [callerParam, calleeParam]);

  // Init TUICallKit when callerUserID is ready
  useEffect(() => {
    if (callerUserID) {
      const init = async () => {
        const { userSig } = GenerateTestUserSig.genTestUserSig({
          userID: callerUserID,
          SDKAppID,
          SecretKey: SDKSecretKey,
        });
        console.log("Caller UserID:", callerUserID);
        console.log("Generated UserSig:", userSig);
        try {
          await TUICallKitServer.init({
            userID: callerUserID,
            userSig,
            SDKAppID,
          });
          console.log("TUICallKit initialized successfully");
          setIsSDKReady(true); // Đánh dấu SDK đã sẵn sàng

          await TUICallKitServer.calls({
            userIDList: [calleeUserID],
            type: TUICallType.VIDEO_CALL,
          });
          console.log(`Calling ${calleeUserID}...`);
        } catch (error) {
          console.error("Error initializing or calling:", error);
        }
      };

      init();
    }
  }, [callerUserID]);

  if (!isSDKReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <h1 className="text-white text-2xl">Initializing Video Call...</h1>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-white text-2xl mb-4">Video Call</h1>
      <p>
        <strong>Caller:</strong> {callerUserID}
      </p>
      <p>
        <strong>Callee:</strong> {calleeUserID}
      </p>
      <TUICallKit />
    </div>
  );
};

export default VideoCall;
