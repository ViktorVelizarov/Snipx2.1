import React from "react";
import { Navigate, useOutlet, Link } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import './ProtectedLayout.css';
import { useAuthState } from "react-firebase-hooks/auth";

export const ProtectedLayout = () => {
  const { user, loading, checkDatabase, auth } = useAuth(); // Get loading state from context
  const [firebaseUser] = useAuthState(auth); // Firebase user state
  const outlet = useOutlet();

  // If the user is still loading, show a loading indicator
  if (loading) {
    return (
      <div className="loading">
        <h1>Loading...</h1>
      </div>
    );
  }

  // Check if the Firebase user exists but local user is not set yet
  if (!user && firebaseUser) {
    // Trigger backend check to set the local user
    checkDatabase(firebaseUser);
    return (
      <div className="loading">
        <h1>Checking user in database...</h1>
      </div>
    );
  }

  // If there's no user at all, navigate to the login page
  if (!user || !user.email) {
    return (
      <div className="access-restricted">
        <h1>Access Restricted</h1>
        <p>You need to log in to access this page.</p>
        <Link to="/login" className="login-link">
          Go to Login Page
        </Link>
      </div>
    );
  }

  // If the user is authenticated but not an admin, redirect to "Not Authorized"
  if (user.role !== "admin") {
    return <Navigate to="/not-authorized" />;
  }

  // Once everything is loaded and user is authorized, render the protected content
  return <>{outlet}</>;
};
