import React, { useEffect, useRef, useState } from "react";
import { ref, set, onValue, push, off } from "firebase/database";
import { rtdb } from "../firebase/firebase"; // Firebase Realtime Database instance
import { useLocation } from "react-router-dom";

const VideoCallPage = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [roomId, setRoomId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const roomIdFromQuery = queryParams.get("roomId");
    setRoomId(roomIdFromQuery);
    const isCaller = queryParams.get("caller") === "true";

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidatesRef = ref(
              rtdb,
              `rooms/${roomIdFromQuery}/candidates`
            );
            push(candidatesRef, event.candidate.toJSON());
          }
        };

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.current = pc;

        if (isCaller) {
          createOffer(pc, roomIdFromQuery);
        } else {
          listenForSignaling(pc, roomIdFromQuery);
        }
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }

      // Remove listeners to avoid duplication
      off(ref(rtdb, `rooms/${roomIdFromQuery}/offer`));
      off(ref(rtdb, `rooms/${roomIdFromQuery}/answer`));
      off(ref(rtdb, `rooms/${roomIdFromQuery}/candidates`));
    };
  }, [location.search]);

  const createOffer = async (pc, roomId) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Lưu offer vào Firebase
    const offerRef = ref(rtdb, `rooms/${roomId}/offer`);
    set(offerRef, offer);
  };

  const listenForSignaling = (pc, roomId) => {
    // Lắng nghe offer từ Firebase
    const offerRef = ref(rtdb, `rooms/${roomId}/offer`);
    onValue(offerRef, async (snapshot) => {
      const offer = snapshot.val();
      if (offer && pc.signalingState === "stable") {
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
      if (answer && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Lắng nghe ICE candidates từ Firebase
    const candidatesRef = ref(rtdb, `rooms/${roomId}/candidates`);
    onValue(candidatesRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const candidate = new RTCIceCandidate(childSnapshot.val());
        pc.addIceCandidate(candidate).catch((err) =>
          console.error("Error adding ICE candidate:", err)
        );
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
