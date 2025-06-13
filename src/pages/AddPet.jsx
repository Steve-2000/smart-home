// src/pages/AddPet.jsx
import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'AddPet.jsx' FILE.
//
// Let's assume 'AddPet.jsx' is located in 'src/pages/'.
//
// Scenario 1: 'firebase.js' is directly in the 'src/' directory.
//   Your current import path: `../firebase.js`
//   This means: Go UP one directory (from 'pages/' to 'src/'), then look for 'firebase.js'.
//   -> THIS IS THE MOST COMMON AND USUALLY CORRECT SETUP for 'src/pages/' -> 'src/' imports.
//   If your 'firebase.js' is at 'src/firebase.js', this line is correct.
//
// Scenario 2: 'firebase.js' is in a 'config' folder inside 'src/'.
//   Example: 'src/config/firebase.js'
//   You would need to change the import path to: `../config/firebase.js`
//   (Go up one to 'src/', then into 'config/', then find 'firebase.js').
//
// Scenario 3: 'firebase.js' is in the SAME directory as 'AddPet.jsx'.
//   Example: 'src/pages/firebase.js' (Less common, but possible)
//   You would need to change the import path to: `./firebase.js`
//   (Look in the current directory for 'firebase.js').
//
// PLEASE DOUBLE-CHECK YOUR PROJECT'S ACTUAL FOLDER STRUCTURE FOR 'firebase.js'
// AND ADJUST THE IMPORT STATEMENT BELOW IF NECESSARY.
//
import { db } from "../firebase.jsx";
import { ref, push, onValue } from "firebase/database";

const AddPet = () => {
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState(""); // e.g., Dog, Cat, Bird
  const [petRFID, setPetRFID] = useState(""); // Optional RFID tag for pet
  const [associatedRoomId, setAssociatedRoomId] = useState(""); // To link pet to a room
  const [rooms, setRooms] = useState({}); // To populate room dropdown

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

  // Fetch rooms to allow associating a pet with a room
  useEffect(() => {
    const roomsRef = ref(db, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRooms(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPet = async (e) => {
    e.preventDefault();

    if (petName.trim() === "" || petType.trim() === "") {
      setMessage("Pet Name and Type cannot be empty!");
      setMessageType("danger");
      return;
    }

    const petsRef = ref(db, "pets"); // Reference to the 'pets' collection/node
    try {
      await push(petsRef, {
        name: petName.trim(),
        type: petType.trim(),
        rfidTag: petRFID.trim(), // Save RFID tag
        associatedRoomId: associatedRoomId || "N/A", // Save associated room ID
        createdAt: new Date().toISOString(),
        petActivity: {
          rfidDetected: false, // Default status
          lastFed: "", // No feeding yet
          lastSeenLocation: associatedRoomId ? rooms[associatedRoomId]?.name : "Unknown", // Initialize with associated room name
        },
        feederSettings: {
          enabled: false,
          lastManualTrigger: "",
          foodLevel: 100,
          portionSize: 50,
          dailyFrequency: 1 // NEW: Default to 1 time per day
        },
        waterDispenserSettings: {
          enabled: false,
          lastManualTrigger: "",
          waterLevel: 100,
          refillThreshold: 20,
          dailyFrequency: 1 // NEW: Default to 1 time per day
        },
        reminders: {
          medication: ""
        },
        alerts: []
      });
      setMessage(`Pet "${petName.trim()}" added successfully!`);
      setMessageType("success");
      setPetName("");
      setPetType("");
      setPetRFID("");
      setAssociatedRoomId("");
    } catch (error) {
      console.error("Error adding pet:", error);
      setMessage(`Failed to add pet: ${error.message}`);
      setMessageType("danger");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary fw-bold">🐶 Add New Pet Profile</h2>
      <div className="card shadow-lg rounded-xl p-4">
        <form onSubmit={handleAddPet}>
          {message && (
            <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
              {message}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

          {/* Pet Name Input */}
          <div className="mb-3">
            <label htmlFor="petNameInput" className="form-label text-muted">Pet Name</label>
            <input
              type="text"
              className="form-control form-control-lg rounded-lg shadow-sm"
              id="petNameInput"
              placeholder="e.g., Buddy, Whiskers"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              required
            />
          </div>

          {/* Pet Type Input */}
          <div className="mb-3">
            <label htmlFor="petTypeInput" className="form-label text-muted">Pet Type</label>
            <input
              type="text"
              className="form-control form-control-lg rounded-lg shadow-sm"
              id="petTypeInput"
              placeholder="e.g., Dog, Cat, Parrot"
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              required
            />
          </div>

          {/* Pet RFID Tag (Optional) */}
          <div className="mb-3">
            <label htmlFor="petRFIDInput" className="form-label text-muted">RFID Tag (Optional)</label>
            <input
              type="text"
              className="form-control rounded-lg shadow-sm"
              id="petRFIDInput"
              placeholder="e.g., ABCD123"
              value={petRFID}
              onChange={(e) => setPetRFID(e.target.value)}
            />
          </div>

          {/* Associated Room (Optional) */}
          <div className="mb-4">
            <label htmlFor="associatedRoomSelect" className="form-label text-muted">Associated Room (Optional)</label>
            <select
              id="associatedRoomSelect"
              className="form-select rounded-lg shadow-sm"
              value={associatedRoomId}
              onChange={(e) => setAssociatedRoomId(e.target.value)}
            >
              <option value="">-- Select a Room --</option>
              {Object.entries(rooms).map(([roomId, room]) => (
                <option key={roomId} value={roomId}>
                  {room.name}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">For tracking pet's primary location.</small>
          </div>

          {/* Submit Button */}
          <button className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover" type="submit">
            Add Pet
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPet;
