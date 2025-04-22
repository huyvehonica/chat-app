// App.jsx
import React, { useEffect } from "react";
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
import SearchModal from "./components/SearchModal";
import VideoCall from "./components/VideoCall";
import IncomingCall from "./components/IncomingCall";
import OutgoingCall from "./components/OutgoingCall";
import CallEnded from "./components/CallEnded";

import { Toaster } from "react-hot-toast";
import { CircleLoader } from "react-spinners";
import "./index.css";

const App = () => {
  const { user, isLoggedIn, loading, listenToAuthChanges } = useAuthStore();

  const [selectedUser, setSelectedUser] = React.useState(null);
  const [showChatBox, setShowChatBox] = React.useState(false);
  const isMobileView = useResponsiveView();

  useEffect(() => {
    const unsubscribe = listenToAuthChanges();
    return () => unsubscribe(); // Cleanup
  }, []);

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
                <div className="flex lg:flex-row flex-col items-start w-[100%]">
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
          <Route path="/video-call" element={<VideoCall />} />
          <Route
            path="/incoming-call"
            element={<IncomingCall currentUser={user} />}
          />
          <Route
            path="/outgoing-call"
            element={
              <OutgoingCall currentUser={user} calleeUid="RECEIVER_UID" />
            }
          />
          <Route path="/call-ended" element={<CallEnded />} />
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />}
          />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
};

export default App;
