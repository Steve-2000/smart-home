// src/components/LaserBoundaryControl.jsx
import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'LaserBoundaryControl.jsx' FILE.
//
// Let's assume 'LaserBoundaryControl.jsx' is located in 'src/components/'.
//
// Scenario 1: 'firebase.js' is directly in the 'src/' directory.
//   Your current import path: `../firebase.js`
//   This means: Go UP one directory (from 'components/' to 'src/'), then look for 'firebase.js'.
//   -> THIS IS THE MOST COMMON AND USUALLY CORRECT SETUP for 'src/components/' -> 'src/' imports.
//   If your 'firebase.js' is at 'src/firebase.js', this line is correct.
//
// Scenario 2: 'firebase.js' is in a 'config' or 'utils' folder inside 'src/'.
//   Example: 'src/config/firebase.js' or 'src/utils/firebase.js'
//   You would need to change the import path to: `../config/firebase.js` or `../utils/firebase.js`
//   (Go up one to 'src/', then into 'config/' or 'utils/', then find 'firebase.js').
//
// Scenario 3: 'firebase.js' is in the SAME directory as 'LaserBoundaryControl.jsx'.
//   Example: 'src/components/firebase.js' (Less common, but possible)
//   You would need to change the import path to: `./firebase.js`
//   (Look in the current directory for 'firebase.js').
//
// PLEASE DOUBLE-CHECK YOUR PROJECT'S ACTUAL FOLDER STRUCTURE FOR 'firebase.js'
// AND ADJUST THE IMPORT STATEMENT BELOW IF NECESSARY.
//
import { db } from "../firebase.jsx"; // IMPORTANT: Verify this path to your firebase.js file
import { ref, onValue, update } from "firebase/database";

const LaserBoundaryControl = () => {
  // State for the laser boundary status ("Clear" or "Breached")
  const [laserBoundaryStatus, setLaserBoundaryStatus] = useState("Clear");
  // State for the timestamp of the last breach
  const [lastBreachTime, setLastBreachTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

  // Reference to the houseProtection node in Firebase Realtime Database
  // This is a new, general node for house-wide settings, not room-specific.
  const houseProtectionRef = ref(db, "houseProtection");

  // Effect to fetch initial data and listen for real-time updates
  useEffect(() => {
    const unsubscribe = onValue(houseProtectionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLaserBoundaryStatus(data.laserBoundaryStatus || "Clear");
        setLastBreachTime(data.lastBreachTime || null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching house protection data:", error);
      setMessage("Failed to load laser boundary data.");
      setMessageType("danger");
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [houseProtectionRef]);

  // Handler for changing the laser boundary status
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setLaserBoundaryStatus(newStatus); // Update local state immediately

    let updateData = {
      laserBoundaryStatus: newStatus,
    };

    // If status is changed to "Breached", record the current time
    if (newStatus === "Breached") {
      const now = new Date().toISOString();
      setLastBreachTime(now); // Update local state
      updateData.lastBreachTime = now;
    } else if (newStatus === "Clear" && laserBoundaryStatus === "Breached") {
        // If status changes from Breached to Clear, also update lastBreachTime to clear it
        setLastBreachTime(null);
        updateData.lastBreachTime = null;
    }

    try {
      // Update Firebase with the new status and (conditionally) breach time
      await update(houseProtectionRef, updateData);
      setMessage("Laser boundary status updated successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating laser boundary status:", error);
      setMessage(`Failed to update status: ${error.message}`);
      setMessageType("danger");
    }
  };

  if (loading) {
    return <div className="text-center p-5 text-muted">Loading laser boundary status...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-5 text-primary fw-bold">🚨 House Protection: Laser Boundary</h2>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      <div className="card shadow-lg rounded-xl border-0 p-4 mb-4">
        <h5 className="card-title text-dark mb-3 fw-bold">Current Laser Boundary Status:</h5>
        <div className="mb-3">
          <select
            className="form-select form-select-lg rounded-lg shadow-sm"
            value={laserBoundaryStatus}
            onChange={handleStatusChange}
            style={{ maxWidth: '300px' }}
          >
            <option value="Clear">Clear (No Intrusion)</option>
            <option value="Breached">Breached (Intrusion Detected)</option>
          </select>
        </div>
        <p className="text-muted mb-0">
          Last known breach:{" "}
          {lastBreachTime ? new Date(lastBreachTime).toLocaleString() : "Never"}
        </p>
        <small className="form-text text-info">
          This status is for the overall house protection system. Setting "Breached" will mark an intrusion.
        </small>
      </div>

      {/* Optionally, add a "Reset" button if the "Clear" option isn't sufficient for immediate visual reset */}
      {laserBoundaryStatus === "Breached" && (
        <div className="mt-4">
          <button
            className="btn btn-outline-secondary btn-lg rounded-pill px-4 py-2"
            onClick={() => handleStatusChange({ target: { value: "Clear" } })}
          >
            Clear Boundary Status
          </button>
        </div>
      )}
    </div>
  );
};

export default LaserBoundaryControl;
