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
      setMessage("Oops! Device name can't be empty. Give it a cute name! 💡");
      setMessageType("danger");
      return;
    }
    // Check for duplicate device names (case-insensitive) within the current list
    if (devicesToAdd.some(device => device.name.toLowerCase() === newDeviceName.trim().toLowerCase())) {
      setMessage("A device with this name is already in your list for this room! Try another fun name. ✨");
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
      setMessage("Oh dear! A room needs a name! How about 'Cozy Corner'? 🏡");
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
        status: {
          temperature: 0,
          humidity: 0,
          gas: "Normal",
          motion: "No Motion",
          flameSensor: "Normal" // Ensure flame sensor is initialized
        },
        doorStatus: "Closed", // Default to closed
        reminders: { medication: "" }, // Room-specific reminders if any
        alerts: [] // Room-specific alerts if any
      });
      setMessage(`Yay! Your new room "${roomName.trim()}" and its awesome gadgets are ready! ✨`);
      setMessageType("success");
      setRoomName(""); // Clear room name input
      setDevicesToAdd([]); // Clear devices list after successful submission
      setNewDeviceName(""); // Clear new device input
      setNewDeviceInitialState(false); // Reset new device checkbox
    } catch (error) {
      console.error("Error adding room:", error);
      setMessage(`Oh no! Couldn't add your room: ${error.message} 😥`);
      setMessageType("danger");
    }
  };

  return (
    <div className="container mt-4 animate__animated animate__fadeIn"> {/* Added fade-in animation */}
      <h2 className="mb-4 text-primary fw-bold cute-heading text-center">💖 Welcome to Your New Room! 💖</h2>
      <div className="card shadow-lg rounded-xl p-4 cute-card"> {/* Applied cute-card style */}
        <form onSubmit={handleAddRoom}>
          {message && (
            <div className={`alert alert-${messageType} alert-dismissible fade show mb-4 rounded-3 shadow-sm cute-alert`} role="alert">
              {message}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

          {/* Room Name Input */}
          <div className="mb-4">
            <label htmlFor="roomNameInput" className="form-label text-muted cute-label">Room's Happy Name:</label>
            <input
              type="text"
              className="form-control form-control-lg rounded-lg shadow-sm cute-input"
              id="roomNameInput"
              placeholder="e.g., Cozy Living Room, Dream Bedroom"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>

          <h5 className="text-secondary mb-3 cute-label text-center">Add Your Room's Smart Helpers! 🤖</h5>
          <div className="card shadow-sm rounded-lg p-3 mb-4 bg-light cute-card-inner"> {/* Inner card for device list */}
            {/* Input fields for adding a new device */}
            <div className="row g-2 align-items-center mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control rounded-lg cute-input"
                  placeholder="Gadget Name (e.g., lights, fan, TV)"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <div className="form-check form-switch d-flex align-items-center h-100 cute-switch"> {/* Applied cute-switch */}
                  <input
                    className="form-check-input my-0"
                    type="checkbox"
                    role="switch"
                    id="newDeviceInitialState"
                    checked={newDeviceInitialState}
                    onChange={(e) => setNewDeviceInitialState(e.target.checked)}
                  />
                  <label className="form-check-label ms-2 text-muted" htmlFor="newDeviceInitialState">
                    Start ON? ✨
                  </label>
                </div>
              </div>
              <div className="col-md-3">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100 rounded-pill btn-sm cute-btn-sm animate-bounce-on-hover"
                  onClick={handleAddDevice}
                >
                  Add Gadget! ➕
                </button>
              </div>
            </div>

            {/* List of devices added to the current room (temporary) */}
            {devicesToAdd.length > 0 && (
              <ul className="list-group list-group-flush border rounded-lg overflow-hidden mt-3 cute-list">
                <li className="list-group-item bg-info-subtle fw-bold text-dark d-flex justify-content-between align-items-center cute-list-header">
                    <span>Gadget Name</span>
                    <span>Starting State</span>
                    <span>Action</span>
                </li>
                {devicesToAdd.map((device, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center py-2 cute-list-item animate__animated animate__fadeIn"
                  >
                    <span className="fw-medium text-dark">{device.name}</span>
                    <span className={`badge cute-badge ${device.initialState ? 'bg-success' : 'bg-secondary'}`}>
                      {device.initialState ? "ON 🟢" : "OFF 🔴"}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm rounded-pill cute-btn-sm-danger animate-bounce-on-hover"
                      onClick={() => handleRemoveDevice(index)}
                    >
                      Bye Bye! ❌
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {devicesToAdd.length === 0 && (
              <p className="text-muted text-center mt-3 py-3 fs-5">No little helpers added for this room yet! 🐾</p>
            )}
          </div>

          {/* Submit Button for the entire room */}
          <button className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover mt-4 cute-btn" type="submit">
            🎉 Create Your Cozy New Room! 🎉
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addroom;
