// src/pages/AddPet.jsx
import React, { useState } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'AddPet.jsx' FILE.
//
// Common Scenarios for 'AddPet.jsx' (assuming it's in 'src/pages/'):
//
// 1. If 'firebase.js' is directly in the 'src/' directory (i.e., 'src/firebase.js'):
//    The path should be: `../firebase.js`
//    This means: Go UP one directory (from 'pages/' to 'src/'), then look for 'firebase.js'.
//    -> THIS IS THE MOST COMMON AND LIKELY CORRECT SETUP for files in 'src/pages/'
//
// 2. If 'firebase.js' is in 'src/config/' (e.g., 'src/config/firebase.js'):
//    The path should be: `../config/firebase.js`
//    This means: Go UP one directory (from 'pages/' to 'src/'), then into 'config/', then find 'firebase.js'.
//
// 3. If 'firebase.js' is in the SAME directory as 'AddPet.jsx' (less common, e.g., 'src/pages/firebase.js'):
//    The path should be: `./firebase.js`
//    This means: Look in the current directory ('src/pages/') for 'firebase.js'.
//
// Please adjust the import below if your 'firebase.js' is in a different location.
import { db } from "../firebase.jsx";
import { ref, push } from "firebase/database";

const AddPet = () => {
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("Dog"); // Default pet type
  const [foodContainerLength, setFoodContainerLength] = useState(""); // NEW: Food container total length
  const [waterContainerLength, setWaterContainerLength] = useState(""); // NEW: Water container total length
  const [petRFID, setPetRFID] = useState(""); // State for RFID tag number
  const [rfidDetectedStatus, setRfidDetectedStatus] = useState(false); // NEW: State for RFID Detected Status

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

  const handleAddPet = async (e) => {
    e.preventDefault();

    if (petName.trim() === "") {
      setMessage("Pet name cannot be empty!");
      setMessageType("danger");
      return;
    }

    if (foodContainerLength !== "" && (isNaN(foodContainerLength) || parseFloat(foodContainerLength) <= 0)) {
        setMessage("Food container length must be a positive number.");
        setMessageType("danger");
        return;
    }

    if (waterContainerLength !== "" && (isNaN(waterContainerLength) || parseFloat(waterContainerLength) <= 0)) {
        setMessage("Water container length must be a positive number.");
        setMessageType("danger");
        return;
    }

    const petsRef = ref(db, "pets"); // Path to your 'pets' collection/node in DB
    try {
      await push(petsRef, {
        name: petName.trim(),
        type: petType,
        rfidTag: petRFID.trim(), // Save RFID tag
        foodContainerLength: foodContainerLength ? parseFloat(foodContainerLength) : 0, // Save as number
        waterContainerLength: waterContainerLength ? parseFloat(waterContainerLength) : 0, // Save as number
        currentFoodDistance: foodContainerLength ? parseFloat(foodContainerLength) : 0, // Initially full (distance 0 from sensor means full)
        currentWaterDistance: waterContainerLength ? parseFloat(waterContainerLength) : 0, // Initially full
        // NEW: Initialize petActivity with rfidDetected status
        petActivity: {
          rfidDetected: rfidDetectedStatus,
          lastFed: null, // Still null initially
          lastWatered: null, // Still null initially
        },
        createdAt: new Date().toISOString(),
      });
      setMessage(`Pet "${petName.trim()}" added successfully!`);
      setMessageType("success");
      setPetName(""); // Clear input fields
      setPetType("Dog");
      setFoodContainerLength("");
      setWaterContainerLength("");
      setPetRFID(""); // Clear RFID input
      setRfidDetectedStatus(false); // Reset RFID detected status
    } catch (error) {
      console.error("Error adding pet:", error);
      setMessage(`Failed to add pet: ${error.message}`);
      setMessageType("danger");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary fw-bold">➕ Add New Pet</h2>
      <div className="card shadow-lg rounded-xl p-4">
        <form onSubmit={handleAddPet}>
          {message && (
            <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
              {message}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}
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
          <div className="mb-3">
            <label htmlFor="petTypeSelect" className="form-label text-muted">Pet Type</label>
            <select
              className="form-select form-select-lg rounded-lg shadow-sm"
              id="petTypeSelect"
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {/* NEW: Pet RFID Tag Input */}
          <div className="mb-3">
            <label htmlFor="petRFIDInput" className="form-label text-muted">RFID Tag Number (Optional)</label>
            <input
              type="text"
              className="form-control rounded-lg shadow-sm"
              id="petRFIDInput"
              placeholder="e.g., 1234567890ABCD"
              value={petRFID}
              onChange={(e) => setPetRFID(e.target.value)}
            />
            <small className="form-text text-muted">
              Enter the unique RFID tag number for your pet, if applicable.
            </small>
          </div>
          {/* NEW: RFID Detected Status */}
          <div className="mb-3 form-check form-switch form-check-lg">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="rfidDetectedSwitch"
              checked={rfidDetectedStatus}
              onChange={(e) => setRfidDetectedStatus(e.target.checked)}
            />
            <label className="form-check-label ms-2 fs-5 text-muted" htmlFor="rfidDetectedSwitch">
              RFID Currently Detected
            </label>
            <small className="form-text text-muted d-block">
              Set this if the pet's RFID is currently being detected by a sensor.
            </small>
          </div>
          {/* NEW: Food Container Length */}
          <div className="mb-3">
            <label htmlFor="foodContainerLengthInput" className="form-label text-muted">Food Container Total Length (cm)</label>
            <input
              type="number"
              step="0.1"
              className="form-control rounded-lg shadow-sm"
              id="foodContainerLengthInput"
              placeholder="e.g., 30 (total length from sensor to bottom)"
              value={foodContainerLength}
              onChange={(e) => setFoodContainerLength(e.target.value)}
            />
            <small className="form-text text-muted">Enter the total length of the food container for accurate level calculation. (e.g., 30 for a 30cm deep container)</small>
          </div>
          {/* NEW: Water Container Length */}
          <div className="mb-3">
            <label htmlFor="waterContainerLengthInput" className="form-label text-muted">Water Container Total Length (cm)</label>
            <input
              type="number"
              step="0.1"
              className="form-control rounded-lg shadow-sm"
              id="waterContainerLengthInput"
              placeholder="e.g., 20 (total length from sensor to bottom)"
              value={waterContainerLength}
              onChange={(e) => setWaterContainerLength(e.target.value)}
            />
            <small className="form-text text-muted">Enter the total length of the water container for accurate level calculation. (e.g., 20 for a 20cm deep container)</small>
          </div>

          <button className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover" type="submit">
            Add Pet
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPet;
