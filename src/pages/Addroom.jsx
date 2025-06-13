// src/pages/Addroom.jsx
import React, { useState } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'Addroom.jsx' FILE.
//
// Let's assume 'Addroom.jsx' is located in 'src/pages/'.
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
// Scenario 3: 'firebase.js' is in the SAME directory as 'Addroom.jsx'.
//   Example: 'src/pages/firebase.js' (Less common, but possible)
//   You would need to change the import path to: `./firebase.js`
//   (Look in the current directory for 'firebase.js').
//
// PLEASE DOUBLE-CHECK YOUR PROJECT'S ACTUAL FOLDER STRUCTURE FOR 'firebase.js'
// AND ADJUST THE IMPORT STATEMENT BELOW IF NECESSARY.
//
import { db } from "../firebase.jsx";
import { ref, push } from "firebase/database";

const Addroom = () => {
  const [roomName, setRoomName] = useState("");
  // State to hold devices to be added with the current room
  const [devicesToAdd, setDevicesToAdd] = useState([]);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceInitialState, setNewDeviceInitialState] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

  // Function to add a device to the temporary list (not Firebase yet)
  const handleAddDevice = () => {
    if (newDeviceName.trim() === "") {
      setMessage("Device name cannot be empty.");
      setMessageType("danger");
      return;
    }
    // Check for duplicate device names (case-insensitive) within the current list
    if (devicesToAdd.some(device => device.name.toLowerCase() === newDeviceName.trim().toLowerCase())) {
      setMessage("Device with this name already added for this room. Please choose a unique name.");
      setMessageType("danger");
      return;
    }

    setDevicesToAdd([...devicesToAdd, { name: newDeviceName.trim(), initialState: newDeviceInitialState }]);
    setNewDeviceName(""); // Clear input after adding
    setNewDeviceInitialState(false); // Reset checkbox
    setMessage(""); // Clear previous message
  };

  // Function to remove a device from the temporary list
  const handleRemoveDevice = (indexToRemove) => {
    setDevicesToAdd(devicesToAdd.filter((_, index) => index !== indexToRemove));
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();

    if (roomName.trim() === "") {
      setMessage("Room name cannot be empty!");
      setMessageType("danger");
      return;
    }

    // Prepare the devices object for Firebase
    const devicesObject = {};
    devicesToAdd.forEach(device => {
      // Sanitize device names for Firebase keys (remove invalid characters)
      devicesObject[device.name.replace(/[.#$[\]/]/g, '_')] = device.initialState;
    });

    const roomRef = ref(db, "rooms"); // Reference to the 'rooms' collection/node in your DB
    try {
      await push(roomRef, {
        name: roomName.trim(),
        createdAt: new Date().toISOString(),
        devices: devicesObject, // Device data for this room
        // Initialize other ROOM-SPECIFIC properties with default values
        status: { temperature: 0, humidity: 0, gas: "Normal", motion: "No Motion" },
        // NEW: Initialize doorStatus for magnetic switch
        doorStatus: "Closed", // Default to closed
        reminders: { medication: "" }, // Room-specific reminders if any
        alerts: [] // Room-specific alerts if any
      });
      setMessage(`Room "${roomName.trim()}" and its devices added successfully!`);
      setMessageType("success");
      setRoomName(""); // Clear room name input
      setDevicesToAdd([]); // Clear devices list after successful submission
      setNewDeviceName(""); // Clear new device input
      setNewDeviceInitialState(false); // Reset new device checkbox
    } catch (error) {
      console.error("Error adding room:", error);
      setMessage(`Failed to add room: ${error.message}`);
      setMessageType("danger");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary fw-bold">➕ Add New Room & Devices</h2>
      <div className="card shadow-lg rounded-xl p-4">
        <form onSubmit={handleAddRoom}>
          {message && (
            <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
              {message}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

          {/* Room Name Input */}
          <div className="mb-4">
            <label htmlFor="roomNameInput" className="form-label text-muted">Room Name</label>
            <input
              type="text"
              className="form-control form-control-lg rounded-lg shadow-sm"
              id="roomNameInput"
              placeholder="e.g., Living Room, Bedroom"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>

          <h5 className="text-secondary mb-3">Add Devices to this Room</h5>
          <div className="card shadow-sm rounded-lg p-3 mb-4 bg-light">
            {/* Input fields for adding a new device */}
            <div className="row g-2 align-items-center mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control rounded-lg"
                  placeholder="Device Name (e.g., lights, fan, TV)"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <div className="form-check form-switch d-flex align-items-center h-100">
                  <input
                    className="form-check-input my-0" // my-0 to center vertically
                    type="checkbox"
                    role="switch"
                    id="newDeviceInitialState"
                    checked={newDeviceInitialState}
                    onChange={(e) => setNewDeviceInitialState(e.target.checked)}
                  />
                  <label className="form-check-label ms-2 text-muted" htmlFor="newDeviceInitialState">
                    Initial ON
                  </label>
                </div>
              </div>
              <div className="col-md-3">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100 rounded-pill btn-sm"
                  onClick={handleAddDevice}
                >
                  Add Device
                </button>
              </div>
            </div>

            {/* List of devices added to the current room (temporary) */}
            {devicesToAdd.length > 0 && (
              <ul className="list-group list-group-flush border rounded-lg overflow-hidden">
                <li className="list-group-item bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
                    <span>Device Name</span>
                    <span>Initial State</span>
                    <span>Action</span>
                </li>
                {devicesToAdd.map((device, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center py-2"
                  >
                    <span className="fw-medium">{device.name}</span>
                    <span className={`badge ${device.initialState ? 'bg-success' : 'bg-secondary'}`}>
                      {device.initialState ? "ON" : "OFF"}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm rounded-pill"
                      onClick={() => handleRemoveDevice(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {devicesToAdd.length === 0 && (
              <p className="text-muted text-center mt-3">No devices added for this room yet.</p>
            )}
          </div>

          {/* Submit Button for the entire room */}
          <button className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover" type="submit">
            Create Room & Devices
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addroom;
