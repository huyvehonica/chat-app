import React, { useCallback, useState } from "react";
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

const SearchModal = ({ startChat }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTem, setSearchTem] = useState("");
  const [users, setUsers] = useState([]);

  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleSearch = async (term) => {
    if (!term.trim()) {
      toast("Please enter a search term", {
        icon: "😥",
      });
      return;
    }
    try {
      const normalizedSearchTerm = term.toLowerCase();
      const usersRef = ref(rtdb, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const matchedUsers = Object.values(usersData).filter(
          (user) =>
            user.username &&
            user.username.toLowerCase().includes(normalizedSearchTerm)
        );
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
  return (
    <>
      <button
        onClick={openModal}
        className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 items-center flex justify-center rounded-lg"
      >
        <RiSearchLine color="#01AA85" className="w-[18px] h-[18px]" />
      </button>
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-center items-center bg-[#00170cb7]"
          onClick={closeModal}
        >
          <div
            className="relative p-4 w-full max-w-md max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#01AA85] w-[100%] rounded-md shadow-lg">
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
                    <input
                      type="text"
                      value={searchTem}
                      onChange={handleInputChange}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg outline-none w-full p-2.5"
                    />
                    <button
                      onClick={() => handleSearch(searchTem)}
                      className="bg-green-900 text-white px-3 py-2 rounded-lg"
                    >
                      <FaSearch />
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  {users?.map((user) => {
                    return (
                      <div
                        onClick={() => {
                          startChat(user);
                          closeModal();
                        }}
                        className="flex items-start gap-3 bg-[#15eabc34] p-2 mb-2 rounded-lg cursor-pointer border-[#ffffff20] shadow-lg "
                      >
                        <img
                          src={user?.image || imageDefault}
                          className="h-[40px] w-[40px] rounded-full"
                          alt=""
                        />
                        <span>
                          <h2 className="p-0 font-semibold text-white text-[18px]">
                            {user?.fullName || "User"}
                          </h2>
                          <p className="text-[13px] text-white">
                            {user?.username}
                          </p>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchModal;
