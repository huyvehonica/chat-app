import React, { useState, useEffect } from "react";
import { auth, createGroupChat } from "../firebase/firebase";
import { HiOutlineUserGroup } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { CgSpinner } from "react-icons/cg";
import { ref, get, getDatabase } from "firebase/database";
import imageDefault from "../assets/default.jpg";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const rtdb = getDatabase();

  useEffect(() => {
    if (!isOpen) {
      // Reset form khi đóng modal
      setGroupName("");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedUsers([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setSearching(true);
      try {
        const usersRef = ref(rtdb, "users");
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
          const users = [];
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            const uid = childSnapshot.key;

            // Không hiển thị người dùng hiện tại trong kết quả tìm kiếm
            if (uid === auth.currentUser.uid) return;

            // Tìm kiếm theo tên hoặc username
            if (
              userData.fullName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              userData.username
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
            ) {
              users.push({
                uid,
                ...userData,
              });
            }
          });

          setSearchResults(users);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, rtdb]);

  const handleSelectUser = (user) => {
    // Kiểm tra xem người dùng đã được chọn chưa
    if (!selectedUsers.some((u) => u.uid === user.uid)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveUser = (uid) => {
    setSelectedUsers(selectedUsers.filter((user) => user.uid !== uid));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    setLoading(true);
    try {
      const currentUid = auth.currentUser.uid;
      const memberUids = selectedUsers.map((user) => user.uid);

      await createGroupChat(groupName, currentUid, memberUids);
      toast.success("Tạo nhóm thành công!");
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Không thể tạo nhóm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white rounded-lg w-full max-w-md p-5"
          >
            <div className="fixed inset-0  bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800  rounded-lg w-full max-w-md p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Create a new chat group
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <IoMdClose size={24} />
                  </button>
                </div>

                <div className="mb-4 ">
                  <label className="block text-gray-700 dark:text-white text-sm font-medium mb-2">
                    Group name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter a group name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-white text-sm font-medium mb-2">
                    Add members
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border dark:text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Find friends by name or username"
                  />

                  {/* Hiển thị kết quả tìm kiếm */}
                  {searching && (
                    <div className="flex justify-center mt-2">
                      <CgSpinner
                        className="animate-spin text-teal-500"
                        size={24}
                      />
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.uid}
                          className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleSelectUser(user)}
                        >
                          <img
                            src={user.image || imageDefault}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {user.fullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-white">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hiển thị người dùng đã chọn */}
                {selectedUsers.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-white text-sm font-medium mb-2">
                      Selected member ({selectedUsers.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.uid}
                          className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1"
                        >
                          <img
                            src={user.image || imageDefault}
                            alt={user.fullName}
                            className="w-6 h-6  rounded-full mr-1 object-cover"
                          />
                          <span className="text-sm dark:text-white">
                            {user.fullName}
                          </span>
                          <button
                            onClick={() => handleRemoveUser(user.uid)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <IoMdClose size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 border border-gray-300 dark:text-white rounded-md dark:hover:bg-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 flex items-center"
                  >
                    {loading ? (
                      <>
                        <CgSpinner className="animate-spin mr-2" size={18} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <HiOutlineUserGroup className="mr-2" size={18} />
                        Create groups
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;
