import React, { useEffect, useRef, useState } from "react";
import { ref, set, onValue, push } from "firebase/database";
import { rtdb } from "../firebase/firebase"; // Firebase Realtime Database instance
import { useLocation } from "react-router-dom";

const VideoCallPage = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [roomId, setRoomId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Lấy roomId từ query parameters
    const queryParams = new URLSearchParams(location.search);
    const roomIdFromQuery = queryParams.get("roomId");
    setRoomId(roomIdFromQuery);

    // Truy cập camera và microphone
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Tạo kết nối WebRTC
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" }, // STUN server
          ],
        });

        // Thêm stream vào kết nối
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Lắng nghe ICE candidates và gửi lên Firebase
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidatesRef = ref(
              rtdb,
              `rooms/${roomIdFromQuery}/candidates`
            );
            push(candidatesRef, event.candidate.toJSON());
          }
        };

        // Nhận stream từ người dùng khác
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.current = pc;

        // Nếu là người gọi, tạo offer
        if (roomIdFromQuery) {
          createOffer(pc, roomIdFromQuery);
        } else {
          // Nếu là người nhận, lắng nghe offer từ Firebase
          listenForOffer(pc);
        }
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    return () => {
      // Cleanup
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [location.search]);

  const createOffer = async (pc, roomId) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Lưu offer vào Firebase
    const offerRef = ref(rtdb, `rooms/${roomId}/offer`);
    set(offerRef, offer);
  };

  const listenForOffer = (pc) => {
    const offerRef = ref(rtdb, `rooms/${roomId}/offer`);
    onValue(offerRef, async (snapshot) => {
      const offer = snapshot.val();
      if (offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Tạo answer và lưu vào Firebase
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const answerRef = ref(rtdb, `rooms/${roomId}/answer`);
        set(answerRef, answer);
      }
    });

    // Lắng nghe answer từ Firebase
    const answerRef = ref(rtdb, `rooms/${roomId}/answer`);
    onValue(answerRef, async (snapshot) => {
      const answer = snapshot.val();
      if (answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Lắng nghe ICE candidates từ Firebase
    const candidatesRef = ref(rtdb, `rooms/${roomId}/candidates`);
    onValue(candidatesRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const candidate = new RTCIceCandidate(childSnapshot.val());
        pc.addIceCandidate(candidate);
      });
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-white text-2xl mb-4">Video Call</h1>
      <div className="flex gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-[300px] h-[200px] bg-black rounded-lg"
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-[300px] h-[200px] bg-black rounded-lg"
        ></video>
      </div>
    </div>
  );
};

export default VideoCallPage;
