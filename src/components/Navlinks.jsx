import React from "react";
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
} from "react-icons/ri";
import toast from "react-hot-toast";

const NavLinks = () => {
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
    <section className="sticky lg:static top-0 flex items-center lg:items-start lg:justify-start h-[7vh] lg:h-[100vh] w-[100%] lg:w-[150px] py-8 lg:py-0 bg-[#01aa85]">
      <main className="flex lg:flex-col item-center lg:gap-10 justify-between lg::px-0 w-[100%]">
        <div className="lex items-start justify-center h-[81px] lg:border-b border-b-1 border-[#ffffffaf] lg:w[100%] p-4">
          <span className="flex items-center justify-center">
            <img
              src={logo}
              alt="logo"
              className="w-[56px] h-[53px] object-contain  bg-white rounded-lg"
            />
          </span>
        </div>
        <ul className="flex lg:flex-col flex-row items-center gap-7 md:gap-10 px-2 md:px-0">
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiChatAiLine color="#fff" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiFolderUserLine color="#fff" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiNotificationLine color="#fff" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiFile4Line color="#fff" />
            </button>
          </li>
          <li className="">
            <button className="lg:text-[28px] text-[22px] cursor-pointer">
              <RiBardLine color="#fff" />
            </button>
          </li>
          <li className="">
            <button
              onClick={handleLogout}
              className="lg:text-[28px] text-[22px] cursor-pointer"
            >
              <RiShutDownLine color="#fff" />
            </button>
          </li>
        </ul>
        <li className="">
          <button className="block lg:hidden lg:text-[28px] text-[22px]">
            <RiArrowDownSFill color="#fff" />
          </button>
        </li>
      </main>
    </section>
  );
};

export default NavLinks;
