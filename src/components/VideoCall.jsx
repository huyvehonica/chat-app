// src/pages/VideoCallPage.jsx
import React, { useEffect, useState } from "react";
import {
  TUICallKit,
  TUICallKitServer,
  TUICallType,
} from "@tencentcloud/call-uikit-react";
import * as GenerateTestUserSig from "../debug/GenerateTestUserSig-es"; // Giữ đúng đường dẫn
import { useSearchParams } from "react-router-dom";

const SDKAppID = 20022132; // Thay bằng AppID thật của bạn
const SDKSecretKey =
  "c25c392a16a1905567574b56e1423b87f7bfaab08d4e66838d80c071652db0fc"; // KHÔNG dùng key này trên production

const VideoCallPage = () => {
  const [searchParams] = useSearchParams();
  const callerUserID = searchParams.get("callerUserID");
  const calleeUserID = searchParams.get("calleeUserID");
  const [initSuccess, setInitSuccess] = useState(false);

  useEffect(() => {
    const initTUICallKit = async () => {
      try {
        const { userSig } = GenerateTestUserSig.genTestUserSig({
          userID: callerUserID,
          SDKAppID,
          SecretKey: SDKSecretKey,
        });

        await TUICallKitServer.init({
          userID: callerUserID,
          userSig,
          SDKAppID,
        });

        setInitSuccess(true);

        await TUICallKitServer.calls({
          userIDList: [calleeUserID],
          type: TUICallType.VIDEO_CALL,
        });
      } catch (err) {
        console.error("TUICallKit init failed:", err);
      }
    };

    if (callerUserID && calleeUserID) {
      initTUICallKit();
    }
  }, [callerUserID, calleeUserID]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {initSuccess && <TUICallKit />}
    </div>
  );
};

export default VideoCallPage;
