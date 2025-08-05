// src/router/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Assuming Firebase auth setup

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // New state to track loading status
  const navigate = useNavigate();
  const auth = getAuth(); // Get the auth instance

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setIsAuthenticated(true);
      } else {
        // User is signed out, redirect to login
        setIsAuthenticated(false);
        navigate('/'); 
      }
      setLoading(false); // Authentication check is complete
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [auth, navigate]); // Depend on auth and navigate

  if (loading) {
    // While loading, render a full-screen placeholder to prevent layout shifts.
    // This div will occupy the entire viewport, keeping the screen stable.
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          width: '100vw', 
          backgroundColor: '#f0f2f5', // Match your login background or app background
          color: '#333' 
        }}
      >
        Loading application...
      </div>
    );
  }

  // If not loading and not authenticated, the navigate('/') above would have already redirected.
  // So, if we reach here and not loading, it means we are authenticated.
  return isAuthenticated ? children : null; 
};

export default ProtectedRoute;
