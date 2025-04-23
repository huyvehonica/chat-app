import { motion, AnimatePresence } from "framer-motion";
import user1 from "../assets/user1.png"; // Placeholder image, replace with actual user image
import { FiEdit } from "react-icons/fi";
import { useState } from "react";
import { UserProfileEditComponent } from "./UserProfileEditComponent";
// import { UserProfileEditComponent } from "./UserProfileEditComponent";

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const openProfileEditModal = (profileUser) => {
    setSelectedProfile(profileUser);
    setShowProfileEditModal(true);
  };

  // Hàm đóng modal profile
  const closeProfileEditModal = () => {
    setShowProfileEditModal(false);
  };
  return (
    <AnimatePresence>
      {isOpen &&
        (showProfileEditModal ? (
          <UserProfileEditComponent
            isOpen={showProfileEditModal}
            onClose={() => {
              closeProfileEditModal();
              onClose(); // Đóng toàn bộ modal nếu muốn
            }}
            user={selectedProfile}
          />
        ) : (
          <motion.div
            className="fixed inset-0 z-[200] bg-opacity-40 flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            onClick={onClose}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-[90%] max-w-[400px] shadow-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.3, ease: "easeInOut" },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center justify-center mb-4">
                <img
                  src={user1 || "/default.jpg"}
                  className="w-[100px] h-[100px] rounded-full object-cover mx-auto mb-4"
                  alt="User avatar"
                />
                <button
                  className="bg-[#D9F2ED] hover:bg-gray-400 px-2 py-1 items-center flex justify-center rounded-lg cursor-pointer"
                  onClick={() => openProfileEditModal(user)}
                >
                  <h3>Edit Profile</h3>
                </button>
              </div>
              <h2 className="text-xl text-gray-500 font-bold text-center">
                {user?.fullName}
              </h2>
              <p className="text-gray-500 text-center">@{user?.username}</p>
              <p className="text-gray-500 text-center">{user?.email}</p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-2 bg-[#01AA85] text-white rounded-xl"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        ))}
    </AnimatePresence>
  );
};

export default UserProfileModal;
