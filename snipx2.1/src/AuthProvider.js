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
// Initialize Firebase with the Firebase config, don't delete even that we don't use app const
const app = initializeApp(firebaseConfig);
// Create a context for authentication
const AuthContext = createContext();

export const AuthProvider = () => {
  // Use React Router's outlet and navigate hooks
  const outlet = useOutlet();
  const navigate = useNavigate();
  const api = useContext(apiUrl);
  // Initialize Google auth provider and Firebase auth
  const googleProvider = new GoogleAuthProvider();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  console.log("current user:")
  console.log(user)

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

  // Check if user is in the database (also on backend we verify user's token)
  const checkDatabase = (authResponse) => {
    const url = `${api}/api/snipx_auth/firebase`;
    axios
      .post(url, {
        idToken: authResponse.stsTokenManager.accessToken,
      })
      .then((response) => {
        if (response.data.email) {
          setUser(response.data);
          navigate("/login");
        } else {
          alert("You don't have acces :(");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // logout user both locally and in firebase and navigate it to login page
  const logout = () => {
    signOut(auth).then(() => {
      setUser("");
      navigate("/login");
    });
  };

  // Define the value provided to the AuthContext
  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      checkDatabase,
      auth,
    }),
    [user]
  );
  // Provide the AuthContext to children
  return <AuthContext.Provider value={value}>{outlet}</AuthContext.Provider>;
};

// Hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
