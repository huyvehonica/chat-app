import React from "react";
import { FaUserPlus } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Register = ({ isLogin, setIsLogin }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm(); // Sử dụng react-hook-form
  const navigate = useNavigate();
  const handleAuth = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "user", user?.uid);

      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        username: user.email?.split("@")[0],
        fullName: data.fullName,
        image: "",
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section className="flex flex-col justify-center items-center h-[100vh] background-image">
      <div className="bg-white shadow-lg p-5 rounded-xl h-[27rem] w-[20rem] flex flex-col justify-center items-center">
        <h1 className="text-center text-[28px] font-bold ">Sign Up</h1>
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
              className={`border w-full p-2 rounded-md ${
                errors.fullName
                  ? "border-red-500 bg-red-50"
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]`}
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
              className={`border w-full p-2 rounded-md ${
                errors.email
                  ? "border-red-500 bg-red-50"
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]`}
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
              className={`border w-full p-2 rounded-md ${
                errors.password
                  ? "border-red-500 bg-red-50"
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]`}
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
              className={`border w-full p-2 rounded-md ${
                errors.rePassword
                  ? "border-red-500 bg-red-50"
                  : "border-green-200 bg-[#01aa851d]"
              } text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]`}
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
