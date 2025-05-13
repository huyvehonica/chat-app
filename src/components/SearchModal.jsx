import React, { useCallback, useEffect, useState } from "react";
import { useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { RiSearchLine } from "react-icons/ri";
import imageDefault from "../assets/default.jpg";
import {
  collection,
  getDocs,
  query,
  snapshotEqual,
  where,
} from "firebase/firestore";
import { db, rtdb } from "../firebase/firebase";
import { endAt, get, orderByChild, ref, startAt } from "firebase/database";
import toast from "react-hot-toast";
import debounce from "lodash/debounce";
import { motion, AnimatePresence } from "framer-motion";

const SearchModal = ({ startChat, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTem, setSearchTem] = useState("");
  const [users, setUsers] = useState([]);
  const [visibleUSers, setVisibleUsers] = useState(5);

  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTem("");
    setUsers([]);
  };
  const handleSearch = async (term) => {
    if (!term.trim()) {
      toast("Please enter a search term", {
        icon: "😥",
      });
      setUsers([]);
      return;
    }
    try {
      const normalizedSearchTerm = term.toLowerCase();
      const usersRef = ref(rtdb, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const matchedUsers = Object.values(usersData).filter((user) => {
          // Kiểm tra xem người dùng có khớp với điều kiện tìm kiếm không
          const usernameMatch =
            user.username &&
            user.username.toLowerCase().includes(normalizedSearchTerm);
          const emailMatch =
            user.email &&
            user.email.toLowerCase().includes(normalizedSearchTerm);

          // Người dùng phải không phải là người dùng hiện tại
          const notCurrentUser = user.uid !== currentUser?.uid;

          // Trả về true nếu khớp username hoặc email và không phải người dùng hiện tại
          return (usernameMatch || emailMatch) && notCurrentUser;
        });
        console.log("Matched Users:", matchedUsers);
        setUsers(matchedUsers);
        if (matchedUsers.length === 0) {
          toast("No users found", {
            icon: "😥",
          });
        }
      } else {
        toast("No users found", {
          icon: "😥",
        });
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };
  const debouncedSearch = useCallback(
    debounce((term) => handleSearch(term), 500),
    []
  );
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTem(value);
    debouncedSearch(value);
  };
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setVisibleUsers((prev) => prev + 5);
    }
  };
  useEffect(() => {
    if (isModalOpen) {
      setVisibleUsers(5);
    }
  }, [isModalOpen]);
  return (
    <>
      <button
        onClick={openModal}
        className="bg-[#D9F2ED] dark:bg-gray-700 w-[35px] h-[35px] p-2 items-center  flex justify-center rounded-lg"
      >
        <RiSearchLine color="#01AA85" className="w-[18px] h-[18px]" />
      </button>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0  bg-black/50 z-[100] flex justify-center items-center "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            onClick={closeModal}
          >
            <div
              className="fixed inset-0 z-[100] flex justify-center items-center"
              onClick={closeModal}
            >
              <div
                className="relative p-4 w-full max-w-md max-h-full"
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="relative bg-[#01AA85] dark:bg-gray-800  w-[100%] rounded-md shadow-lg">
                  <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-300">
                    <h3 className="text-xl font-semibold text-white">
                      Search Chat
                    </h3>
                    <button
                      onClick={closeModal}
                      className="text-white bg-transparent hover:bg-[#D9f2ed] hover:text-[#01AA85] rounded-lg text-sm w-8 h-8 inline-flex items-center justify-center"
                    >
                      <FaXmark size={20} />
                    </button>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {" "}
                        <input
                          type="text"
                          value={searchTem}
                          onChange={handleInputChange}
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg outline-none w-full p-2.5"
                          placeholder="Tìm kiếm theo tên người dùng hoặc email"
                        />
                        <button
                          onClick={() => handleSearch(searchTem)}
                          className="bg-green-900 text-white px-3 py-2 rounded-lg"
                        >
                          <FaSearch />
                        </button>
                      </div>
                    </div>
                    <div
                      className="mt-6 custom-scrollbar max-h-[300px] overflow-y-auto scrollBehavior-smooth"
                      onScroll={handleScroll}
                    >
                      {users?.map((user) => {
                        return (
                          <div
                            onClick={() => {
                              startChat(user);
                              closeModal();
                            }}
                            className="flex items-start gap-3 border border-gray-200 p-2 mb-2 rounded-lg cursor-pointer hover:bg-[#2c947d]  dark:hover:bg-gray-700 shadow-lg "
                          >
                            <img
                              src={user?.image || imageDefault}
                              className="w-11 h-11 object-cover rounded-full"
                              alt=""
                            />{" "}
                            <span>
                              <h2 className="p-0 font-semibold text-white text-[18px]">
                                {user?.fullName || "User"}
                              </h2>
                              <p className="text-[13px] text-white">
                                @{user?.username}
                              </p>
                              {user?.email && (
                                <p className="text-[12px] text-gray-200">
                                  {user.email}
                                </p>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchModal;
