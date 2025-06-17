// src/components/LaserBoundaryDisplay.jsx
import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FILE PATH <<<
// This import path is RELATIVE to where THIS 'LaserBoundaryDisplay.jsx' file is located.
//
// Common Scenarios:
// 1. If 'LaserBoundaryDisplay.jsx' is in 'src/components/' AND 'firebase.js' is in 'src/':
//    The path should be: `../firebase.js` (go up one level to 'src/', then find 'firebase.js').
//    This is the most common and likely correct setup.
//
// 2. If 'firebase.js' is in 'src/config/' (e.g., 'src/config/firebase.js'):
//    The path should be: `../config/firebase.js` (go up one level to 'src/', then into 'config/').
//
// 3. If 'firebase.js' is in the SAME directory as 'LaserBoundaryDisplay.jsx' (less common):
//    The path should be: `./firebase.js` (look in the current directory).
//
// Please adjust the import below if your 'firebase.js' is in a different location.
import { db } from "../firebase.jsx";
import { ref, onValue } from "firebase/database";

const LaserBoundaryDisplay = () => {
  const [laserBoundaryStatus, setLaserBoundaryStatus] = useState("Unknown");
  const [lastBreachTime, setLastBreachTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reference to the houseProtection node in Firebase Realtime Database
  const houseProtectionRef = ref(db, "houseProtection");

  useEffect(() => {
    // Listen for real-time updates on the 'houseProtection' node
    const unsubscribe = onValue(houseProtectionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLaserBoundaryStatus(data.laserBoundaryStatus || "Unknown");
        setLastBreachTime(data.lastBreachTime || null);
        setError(null); // Clear any previous errors
      } else {
        // If no data exists, set to default/unknown state
        setLaserBoundaryStatus("Unknown");
        setLastBreachTime(null);
        setError("No laser boundary data found. Please configure it via the 'Laser Boundary' link.");
      }
      setLoading(false);
    }, (dbError) => {
      // Handle database read errors
      console.error("Error fetching laser boundary data:", dbError);
      setError("Failed to load laser boundary data. Check console for details.");
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [houseProtectionRef]); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return (
      <div className="card shadow-lg rounded-xl border-0 p-4 mb-5 text-center text-muted">
        <p>Loading laser boundary data...</p>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card shadow-lg rounded-xl border-danger bg-danger-subtle p-4 mb-5 text-center">
        <h5 className="text-danger fw-bold">Error:</h5>
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  const isBreached = laserBoundaryStatus === "Breached";
  const statusIcon = isBreached ? '🚨' : '✅';
  const statusColorClass = isBreached ? 'text-danger' : 'text-success';
  const cardColorClass = isBreached ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success';
  const displayBreachTime = lastBreachTime ? new Date(lastBreachTime).toLocaleString() : "Never";

  return (
    <div className={`card shadow-lg rounded-xl border-0 p-4 mb-5 ${cardColorClass}`}>
      <div className="card-body">
        <h5 className={`card-title fw-bold d-flex align-items-center ${statusColorClass}`}>
          <span className="me-2 display-6">{statusIcon}</span>
          Laser Boundary Status: {laserBoundaryStatus}
        </h5>
        <p className="card-text text-muted">
          Last Breach Detected: {displayBreachTime}
        </p>
        {isBreached && (
          <p className="text-danger fw-bold mt-2">Immediate action required! A perimeter breach has been detected.</p>
        )}
        {!isBreached && laserBoundaryStatus !== "Unknown" && (
          <p className="text-success fw-bold mt-2">The laser boundary is currently clear. Your home is protected.</p>
        )}
      </div>
    </div>
  );
};

export default LaserBoundaryDisplay;
