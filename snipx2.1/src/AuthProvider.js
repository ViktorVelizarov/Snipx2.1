import React, { useState, createContext, useContext, useMemo } from "react";
import { useNavigate, useOutlet } from "react-router-dom";
import { initializeApp } from "firebase/app";
import axios from "axios";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { apiUrl } from "./App";

// Firebase ("extension-360407" project) -> Project settings -> Sroll to the "Your apps" section | "SDK setup and configuration" subsection
const firebaseConfig = {
  apiKey: "AIzaSyB2FvUe6HabOJakyBvxqglg-TxO9SBkCt4",
  authDomain: "extension-360407.firebaseapp.com",
  projectId: "extension-360407",
  storageBucket: "extension-360407.appspot.com",
  messagingSenderId: "173150664134",
  appId: "1:173150664134:web:eda5d81c331ca3c2e2eec7",
  measurementId: "G-Q9FYTCBCT2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Create a context for authentication
const AuthContext = createContext();

export const AuthProvider = () => {
  const outlet = useOutlet();
  const navigate = useNavigate();
  const api = useContext(apiUrl);
  const googleProvider = new GoogleAuthProvider();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  const login = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      checkDatabase(res.user);
    } catch (err) {
      console.error(err);
      alert(err.message);
      navigate("/login");
    }
  };

  const checkDatabase = (authResponse) => {
    const url = `${api}/api/snipx_auth/firebase`;
    setLoading(true); // Set loading to true before making the API call
    axios
      .post(url, {
        idToken: authResponse.stsTokenManager.accessToken,
      })
      .then((response) => {
        setLoading(false); // Set loading to false after response
        if (response.data.email) {
          setUser(response.data);
          navigate("/home"); // Navigate to /home after successful check
        } else {
          alert("You don't have access :(");
        }
      })
      .catch((error) => {
        setLoading(false); // Set loading to false on error
        console.log(error);
      });
  };

  const logout = () => {
    signOut(auth).then(() => {
      setUser(null);
      navigate("/login");
    });
  };

  const value = useMemo(
    () => ({
      user,
      loading, // Add loading to context
      login,
      logout,
      checkDatabase,
      auth,
    }),
    [user, loading] // Include loading in dependencies
  );

  return <AuthContext.Provider value={value}>{outlet}</AuthContext.Provider>;
};

// Hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
