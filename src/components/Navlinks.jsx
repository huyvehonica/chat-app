import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { signOut } from "firebase/auth";
import {
  auth,
  getTotalUnreadCountAll,
  listenForUnreadCounts,
  listenForUnreadGroupCounts,
} from "../firebase/firebase";
import {
  RiArrowDownSFill,
  RiBardLine,
  RiChatAiLine,
  RiFile4Line,
  RiFolderUserLine,
  RiNotificationLine,
  RiShutDownLine,
  RiMoonFill,
  RiSunFill,
} from "react-icons/ri";
import toast from "react-hot-toast";

const NavLinks = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0); // State để lưu tổng số tin nhắn chưa đọc

  useEffect(() => {
    // Check for dark mode preference in localStorage
    const darkModePreference = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModePreference);
  }, []);

  // Lắng nghe tổng số tin nhắn chưa đọc
  useEffect(() => {
    if (!auth.currentUser) return;

    // Lắng nghe số lượng tin nhắn chưa đọc trong chat cá nhân
    const unreadChatsUnsubscribe = listenForUnreadCounts((chatCounts) => {
      // Tính tổng số tin nhắn chưa đọc trong chat cá nhân
      const chatTotal = Object.values(chatCounts).reduce(
        (sum, count) => sum + count,
        0
      );

      // Lắng nghe số lượng tin nhắn chưa đọc trong nhóm
      listenForUnreadGroupCounts((groupCounts) => {
        // Tính tổng số tin nhắn chưa đọc trong các nhóm
        const groupTotal = Object.values(groupCounts).reduce(
          (sum, count) => sum + count,
          0
        );

        // Cập nhật tổng số tin nhắn chưa đọc
        setTotalUnreadCount(chatTotal + groupTotal);
      });
    });

    return () => {
      unreadChatsUnsubscribe();
    };
  }, []);

  const toggleDarkMode = () => {
    setIsAnimating(true);

    // Animation time set to match the CSS transition
    setTimeout(() => {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      localStorage.setItem("darkMode", newDarkMode.toString());

      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Reset animation flag after completion
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 150);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logout successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <section className="sticky lg:static top-0 flex items-center lg:items-start lg:justify-start h-[7vh] lg:h-[100vh] w-[100%] lg:w-[150px] py-8 lg:py-0 bg-[#01aa85] dark:bg-gray-800 transition-colors duration-300 ease-in-out">
      <main className="flex lg:flex-col item-center lg:gap-10 justify-between lg::px-0 w-[100%]">
        <div className="flex items-start justify-center h-[81px] lg:border-b border-b-1 border-gray-700 lg:w[100%] p-4">
          <span className="flex items-center justify-center">
            <img
              src={logo}
              alt="logo"
              className="w-[56px] h-[53px] object-contain md:bg-white dark:bg-gray-700 rounded-lg transition-colors duration-300"
            />
          </span>
        </div>
        <ul className="flex lg:flex-col flex-row items-center gap-7 md:gap-10 px-2 md:px-0">
          <li className="relative">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiChatAiLine className="text-white transition-transform duration-300 hover:scale-110" />

              {/* Badge hiển thị số lượng tin nhắn chưa đọc */}
              {totalUnreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1 font-medium">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </div>
              )}
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiFolderUserLine className="text-white transition-transform duration-300 hover:scale-110" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiNotificationLine className="text-white transition-transform duration-300 hover:scale-110" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiFile4Line className="text-white transition-transform duration-300 hover:scale-110" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiBardLine className="text-white transition-transform duration-300 hover:scale-110" />
            </button>
          </li>
          {/* Dark Mode Toggle Button */}
          <li className="">
            <button
              onClick={toggleDarkMode}
              className="relative lg:text-[28px] text-[22px] cursor-pointer overflow-hidden"
              aria-label="Toggle Dark Mode"
            >
              <div
                className={`relative z-10 transition-all duration-300 ease-out ${
                  isAnimating
                    ? isDarkMode
                      ? "animate-spin-out"
                      : "animate-spin-in"
                    : ""
                }`}
              >
                {isDarkMode ? (
                  <RiSunFill className="text-white transition-transform duration-300 hover:scale-110" />
                ) : (
                  <RiMoonFill className="text-white transition-transform duration-300 hover:scale-110" />
                )}
              </div>
              <span
                className={`absolute inset-0 rounded-full transform scale-0 transition-transform duration-300 ${
                  isAnimating ? "scale-[8]" : "scale-0"
                }`}
              />
            </button>
          </li>
          <li className="">
            <button
              onClick={handleLogout}
              className="lg:text-[28px] text-[22px] cursor-pointer"
            >
              <RiShutDownLine className="text-white transition-transform duration-300 hover:scale-110" />
            </button>
          </li>
        </ul>
        <li className="">
          <button className="block lg:hidden lg:text-[28px] text-[22px]">
            <RiArrowDownSFill className="text-white" />
          </button>
        </li>
      </main>
    </section>
  );
};

export default NavLinks;
