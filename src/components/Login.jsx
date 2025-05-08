import React from "react";
import { FaSignInAlt } from "react-icons/fa";
import { useForm } from "react-hook-form";
import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();

  const handleAuth = async (data) => {
    await setPersistence(auth, browserLocalPersistence);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Login successful!");
      navigate("/chat");
    } catch (err) {
      console.log(err);
      toast.error("Login failed. Please check your email and password.");
    }
  };

  return (
    <section className="flex dark:bg-gray-900 flex-col justify-center items-center h-[100vh] background-image">
      <div className="bg-white dark:bg-gray-700 shadow-lg p-5 rounded-xl h-[27rem] w-[20rem] flex flex-col justify-center items-center">
        <h1 className="text-center text-gray-900 dark:text-white text-[28px] font-bold ">
          Sign In
        </h1>
        <p className="text-center text-sm text-gray-400 mb-10">
          Welcome back, login to continue
        </p>
        <form
          onSubmit={handleSubmit(handleAuth)}
          className="w-full flex flex-col gap-3"
        >
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
              className={`border w-full p-2 rounded-md ${
                errors.email
                  ? "border-red-500 "
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] dark:text-white font-medium outline-none placeholder:text-[#00493958] dark:placeholder:text-white`}
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
                  ? "border-red-500  "
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]  dark:placeholder:text-white`}
              placeholder="Password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md hover:bg-[#01aa85d1] transition duration-200 ease-in-out cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Processing..." : "Login"}
            {!isSubmitting && <FaSignInAlt />}
          </button>
        </form>

        <button
          onClick={() => navigate("/register")}
          className="mt-5 cursor-pointer w-full text-center text-gray-400 text-sm"
        >
          Don't have an account yet? Sign up
        </button>
      </div>
    </section>
  );
};

export default Login;
