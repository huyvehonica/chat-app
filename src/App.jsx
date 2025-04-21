import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import NavLinks from "./components/Navlinks";
import ChatList from "./components/ChatList";
import ChatBox from "./components/ChatBox";
import SearchModal from "./components/SearchModal";
import "./index.css";
import { auth } from "./firebase/firebase";
import { Toaster } from "react-hot-toast";
import { CircleLoader } from "react-spinners";
import VideoCall from "./components/VideoCall";
import useResponsiveView from "./hooks/useResponsiveView"; // Import hook để kiểm tra chế độ mobile

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChatBox, setShowChatBox] = useState(false); // State để hiển thị ChatBox trên mobile

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setIsLoading(false);
    }
    const unSubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => {
      unSubscribe();
    };
  }, []);

  const isMobileView = useResponsiveView();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircleLoader color="#01AA85" size={100} />
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/chat" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/chat" />}
          />
          <Route
            path="/chat"
            element={
              user ? (
                <div className="flex lg:flex-row flex-col items-start w-[100%]">
                  <NavLinks />
                  {isMobileView ? (
                    showChatBox ? (
                      <ChatBox
                        selectedUser={selectedUser}
                        onBack={() => setShowChatBox(false)} // Quay lại ChatList
                      />
                    ) : (
                      <ChatList
                        setSelectedUser={(user) => {
                          setSelectedUser(user);
                          setShowChatBox(true); // Chuyển sang ChatBox
                        }}
                      />
                    )
                  ) : (
                    <>
                      <ChatList setSelectedUser={setSelectedUser} />
                      <ChatBox selectedUser={selectedUser} />
                    </>
                  )}
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/video-call" element={<VideoCall />} />
          <Route
            path="*"
            element={<Navigate to={user ? "/chat" : "/login"} />}
          />
        </Routes>
      </Router>
      <div>
        <Toaster position="top-right" />
      </div>
    </>
  );
};

export default App;
