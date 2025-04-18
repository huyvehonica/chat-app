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
import ChatList from "./components/Chatlist";
import ChatBox from "./components/Chatbox";
import SearchModal from "./components/SearchModal";
import "./index.css";
import { auth } from "./firebase/firebase";
import { Toaster } from "react-hot-toast";

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái loading

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }
    const unSubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => {
      unSubscribe();
    };
  }, []);

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
                  <ChatList setSelectedUser={setSelectedUser} />
                  <ChatBox selectedUser={selectedUser} />
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          {/* Mặc định chuyển hướng đến /login nếu không khớp route */}
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
