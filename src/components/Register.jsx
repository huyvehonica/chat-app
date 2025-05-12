import React from "react";
import { FaUserPlus } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, rtdb } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ref, set } from "firebase/database";
import { TUICallKitServer } from "@tencentcloud/call-uikit-react";
import * as GenerateTestUserSig from "../debug/GenerateTestUserSig-es";

const SDKAppID = 20023019;
const SDKSecretKey =
  "4b710e4c87f271c6fe00067b6dfb8f13769564c8c82cd841628f487298bf1445";
const Register = ({ isLogin, setIsLogin }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();
  const handleAuth = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;
      console.log("User UID:", user.uid);
      console.log("User Ref Path:", `users/${user.uid}`);

      const userRef = ref(rtdb, `users/${user.uid}`);
      console.log("User Ref Path:", userRef.toString());
      await set(userRef, {
        uid: user.uid,
        email: user.email,
        fullName: data.fullName,
        username: user.email?.split("@")[0],
        image: "",
      });
      const { userSig } = GenerateTestUserSig.genTestUserSig({
        userID: user.uid,
        SDKAppID,
        SecretKey: SDKSecretKey,
      });

      await TUICallKitServer.init({
        userID: user.uid,
        userSig,
        SDKAppID,
      })
        .then(() => {
          console.log("Data written successfully!");
        })
        .catch((error) => {
          console.error("Error writing data:", error);
        });

      toast.success("Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed!");
    }
  };
  return (
    <section className="flex flex-col dark:bg-gray-900 justify-center items-center min-h-screen  background-image">
      <div className="bg-white shadow-lg p-5 dark:bg-gray-700 rounded-xl w-80 md:w-90 flex flex-col justify-center items-center">
        <h1 className="text-center text-[28px] dark:text-white font-bold ">
          Sign Up
        </h1>
        <p className="text-center text-sm text-gray-400 mb-10">
          Welcome, create an account to continue
        </p>
        <form
          onSubmit={handleSubmit(handleAuth)}
          className="w-full flex flex-col gap-3"
        >
          {/* Full Name Input */}
          <div>
            <input
              type="text"
              {...register("fullName", {
                required: "Full name is required",
                minLength: {
                  value: 3,
                  message: "Full name must be at least 3 characters",
                },
              })}
              className={`border dark:text-white w-full p-2 rounded-md ${
                errors.fullName
                  ? "border-red-500 "
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958] dark:placeholder:text-white`}
              placeholder="Full Name"
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <input
              type="text"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              className={`border dark:text-white w-full p-2 rounded-md ${
                errors.email
                  ? "border-red-500 "
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958] dark:placeholder:text-white`}
              placeholder="Email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              className={`border dark:text-white w-full p-2 rounded-md ${
                errors.password
                  ? "border-red-500"
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958] dark:placeholder:text-white`}
              placeholder="Password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <input
              type="password"
              {...register("rePassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
              className={`border dark:text-white w-full p-2 rounded-md ${
                errors.rePassword
                  ? "border-red-500 "
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958] dark:placeholder:text-white`}
              placeholder="Re-enter Password"
            />
            {errors.rePassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.rePassword.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md hover:bg-[#01aa85d1] transition duration-200 ease-in-out cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Processing..." : "Register"}
            {!isSubmitting && <FaUserPlus />}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="mt-5 cursor-pointer w-full text-center text-gray-400 text-sm"
        >
          Already have an account? Sign in
        </button>
      </div>
    </section>
  );
};

export default Register;
