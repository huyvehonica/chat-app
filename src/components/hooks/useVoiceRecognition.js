import { useState, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import toast from "react-hot-toast";

/**
 * Custom hook for voice recognition functionality
 * @param {Object} options - Configuration options
 * @param {string} options.language - Language code for speech recognition (default: 'vi-VN')
 * @param {boolean} options.continuous - Whether to continue listening after results (default: true)
 * @param {boolean} options.showNotifications - Whether to show toast notifications (default: true)
 * @returns {Object} Voice recognition controls and state
 */
export const useVoiceRecognition = (options = {}) => {
  const {
    language = "vi-VN",
    continuous = true,
    showNotifications = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // Update internal state when listening status changes
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  // Update transcript text when transcript changes
  useEffect(() => {
    if (transcript) {
      setTranscriptText(transcript);
    }
  }, [transcript]);

  // Start voice recognition
  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      showNotifications &&
        toast.error("Trình duyệt không hỗ trợ nhận diện giọng nói.");
      return false;
    }

    if (!isMicrophoneAvailable) {
      showNotifications &&
        toast.error("Vui lòng cho phép truy cập microphone.");
      return false;
    }

    try {
      resetTranscript();
      SpeechRecognition.startListening({
        continuous,
        language,
      });
      showNotifications && toast.success("Đang ghi âm. Hãy nói...");
      return true;
    } catch (error) {
      console.error("Speech recognition error:", error);
      showNotifications && toast.error("Lỗi khi mở chế độ ghi âm.");
      return false;
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    try {
      SpeechRecognition.stopListening();
      return true;
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
      return false;
    }
  };

  // Toggle voice recognition state
  const toggleListening = () => {
    if (listening) {
      return stopListening();
    } else {
      return startListening();
    }
  };

  // Reset the transcript
  const clearTranscript = () => {
    resetTranscript();
    setTranscriptText("");
  };

  return {
    isListening,
    transcript: transcriptText,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  };
};

export default useVoiceRecognition;
