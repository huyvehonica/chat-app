import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
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

  useEffect(() => {
    // Check for dark mode preference in localStorage
    const darkModePreference = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModePreference);
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
        <div className="lex items-start justify-center h-[81px] lg:border-b border-b-1 border-gray-700 lg:w[100%] p-4">
          <span className="flex items-center justify-center">
            <img
              src={logo}
              alt="logo"
              className="w-[56px] h-[53px] object-contain bg-white dark:bg-gray-700 rounded-lg transition-colors duration-300"
            />
          </span>
        </div>
        <ul className="flex lg:flex-col flex-row items-center gap-7 md:gap-10 px-2 md:px-0">
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiChatAiLine className="text-white transition-transform duration-300 hover:scale-110" />
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
