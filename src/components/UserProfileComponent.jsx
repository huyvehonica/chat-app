import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCamera, FiEdit } from "react-icons/fi";
import { UserProfileEditComponent } from "./UserProfileEditComponent";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getDatabase, ref as dbRef, update, onValue } from "firebase/database";
import toast from "react-hot-toast";
import defaultImage from "../assets/default.jpg"; // Default avatar image
import { IoSunnySharp } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [avatar, setAvatar] = useState(user?.image || defaultImage);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [previousPhotoURL, setPreviousPhotoURL] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark", !isDarkMode); // Thêm class `dark` vào thẻ <html>
  };
  useEffect(() => {
    console.log("User Profile Modal:", user);

    if (user?.image) {
      setAvatar(user?.image);
      setPreviousPhotoURL(user.image);
    }
  }, [user]);

  const openProfileEditModal = (profileUser) => {
    setSelectedProfile(profileUser);
    setShowProfileEditModal(true);
  };

  const closeProfileEditModal = () => {
    setShowProfileEditModal(false);
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File validation
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(
        "Image size exceeds 5MB limit. Please choose a smaller file."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create a consistent file path
      const filePath = `avatars/${user.uid}/profile`;

      // Get references to Firebase services
      const storage = getStorage();
      const imageRef = storageRef(storage, filePath);
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);

      // Delete previous image if it exists (to save storage space)
      if (
        previousPhotoURL &&
        previousPhotoURL.includes("avatars/" + user.uid)
      ) {
        try {
          const oldImageRef = storageRef(storage, previousPhotoURL);
          await deleteObject(oldImageRef);
          console.log("Previous avatar deleted successfully");
        } catch (error) {
          console.log("No previous image found or error deleting:", error);
        }
      }

      // Upload new image with progress tracking
      const uploadTask = await uploadBytes(imageRef, file);

      // Get download URL for the uploaded file
      const downloadURL = await getDownloadURL(uploadTask.ref);

      // Update state with new avatar URL
      setAvatar(downloadURL);
      setPreviousPhotoURL(downloadURL);

      // Update multiple locations in the database to ensure consistency
      const updates = {
        image: downloadURL,
        avatarUpdatedAt: Date.now(),
      };

      // Update the user profile in Realtime Database
      await update(userRef, updates);

      // Also update any chat references that might use the user's avatar
      const userChatsRef = dbRef(db, `userChats/${user.uid}`);
      onValue(
        userChatsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const chatIds = Object.keys(snapshot.val());

            // Update user info in each chat where the user participates
            chatIds.forEach(async (chatId) => {
              const chatParticipantsRef = dbRef(
                db,
                `chats/${chatId}/participants/${user.uid}`
              );
              await update(chatParticipantsRef, { photoURL: downloadURL });
            });
          }
        },
        { onlyOnce: true }
      );

      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Rest of the component remains the same...

  return (
    <AnimatePresence>
      {isOpen &&
        (showProfileEditModal ? (
          <UserProfileEditComponent
            isOpen={showProfileEditModal}
            onClose={() => {
              closeProfileEditModal();
              onClose();
            }}
            user={selectedProfile}
          />
        ) : (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/50 bg-opacity-40 flex justify-center items-center "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            onClick={onClose}
          >
            <motion.div
              className="bg-white  dark:bg-gray-800 dark:text-white rounded-2xl p-6 w-[90%] max-w-[400px] shadow-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.3, ease: "easeInOut" },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex flex-col items-center justify-center mb-4">
                <div
                  className="absolute top-0 right-0 p-2 cursor-pointer border bg-[#D9F2ED] w-[35px] h-[35px] items-center flex justify-center rounded-full"
                  onClick={onClose}
                >
                  <IoMdClose color="#01AA85" className="w-[20px] h-[20px]" />
                </div>
                <div className="relative w-[100px] h-[100px] mb-4 ">
                  <img
                    src={avatar}
                    className="w-full h-full rounded-full object-cover border-2 border-[#01AA85]"
                    alt="User avatar"
                  />
                  <div
                    className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 border dark:border-gray-700 p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100"
                    onClick={handleCameraClick}
                  >
                    {uploading ? (
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-t-transparent border-[#01AA85] rounded-full animate-spin" />
                        {uploadProgress > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[#01AA85]">
                            {Math.round(uploadProgress)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <FiCamera className="text-[#01AA85] w-5 h-5 " />
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <button
                  className="bg-[#D9F2ED] dark:bg-gray-700 border dark:border-gray-700 hover:bg-[#c0e8e1] text-[#01AA85] px-4 py-2 items-center flex justify-center rounded-lg cursor-pointer transition-colors"
                  onClick={() => openProfileEditModal(user)}
                >
                  <FiEdit className="mr-2" /> Edit Profile
                </button>
              </div>

              <h2 className="text-xl font-bold text-center text-gray-800">
                {user?.fullName}
              </h2>
              <p className="text-gray-500 text-center">@{user?.username}</p>
              <p className="text-gray-500 text-center">{user?.email}</p>

              <button
                onClick={onClose}
                className="mt-6 w-full py-2 bg-[#01AA85] text-white rounded-xl hover:bg-[#018e70] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        ))}
    </AnimatePresence>
  );
};

export default UserProfileModal;
