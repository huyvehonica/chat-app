import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import useAuthStore from "./store/authStore";
import useResponsiveView from "./hooks/useResponsiveView";

import Login from "./components/Login";
import Register from "./components/Register";
import NavLinks from "./components/Navlinks";
import ChatList from "./components/ChatList";
import ChatBox from "./components/ChatBox";
import VideoCall from "./components/VideoCallPage";
import IncomingCallNotification from "./components/IncomingCallNotification";
import {
  setupPresenceSystem,
  updateUserOnlineStatus,
} from "./firebase/firebase";

import { Toaster } from "react-hot-toast";
import { CircleLoader } from "react-spinners";
import "./index.css";

const App = () => {
  const { user, isLoggedIn, loading, listenToAuthChanges } = useAuthStore();

  const [selectedUser, setSelectedUser] = React.useState(null);
  const [showChatBox, setShowChatBox] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState({});
  const isMobileView = useResponsiveView();

  useEffect(() => {
    const unsubscribe = listenToAuthChanges();

    const darkModePreference = localStorage.getItem("darkMode") === "true";
    if (darkModePreference) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    let presenceUnsubscribe = () => {};

    if (isLoggedIn) {
      updateUserOnlineStatus("online");
      presenceUnsubscribe = setupPresenceSystem();
    }

    return () => {
      presenceUnsubscribe();
    };
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircleLoader color="#01AA85" size={100} />
      </div>
    );
  }

  return (
    <>
      <Router>
        {isLoggedIn && <IncomingCallNotification selectedUser={selectedUser} />}
        <div className="transition-colors duration-300">
          <Routes>
            <Route
              path="/login"
              element={!isLoggedIn ? <Login /> : <Navigate to="/chat" />}
            />
            <Route
              path="/register"
              element={!isLoggedIn ? <Register /> : <Navigate to="/chat" />}
            />
            <Route
              path="/chat"
              element={
                isLoggedIn ? (
                  <div className="flex  lg:flex-row flex-col items-start w-[100%]">
                    <NavLinks />
                    {isMobileView ? (
                      showChatBox ? (
                        <ChatBox
                          selectedUser={selectedUser}
                          onBack={() => setShowChatBox(false)}
                        />
                      ) : (
                        <ChatList
                          setSelectedUser={(user) => {
                            setSelectedUser(user);
                            setShowChatBox(true);
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
            <Route
              path="/video-call"
              element={isLoggedIn ? <VideoCall /> : <Navigate to="/login" />}
            />
            <Route
              path="*"
              element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />}
            />
          </Routes>
        </div>
      </Router>
      <Toaster position="top-right" />
    </>
  );
};

export default App;
