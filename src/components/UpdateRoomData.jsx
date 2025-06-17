// src/components/UpdateRoomData.jsx
import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'UpdateRoomData.jsx' FILE.
//
// Let's assume 'UpdateRoomData.jsx' is located in 'src/components/'.
//
// Scenario 1: 'firebase.js' is directly in the 'src/' directory.
//   Your current import path: `../firebase.js`
//   This means: Go UP one directory (from 'components/' to 'src/'), then look for 'firebase.js'.
//   -> THIS IS THE MOST COMMON AND USUALLY CORRECT SETUP for 'src/components/' -> 'src/' imports.
//   If your 'firebase.js' is at 'src/firebase.js', this line is correct.
//
// Scenario 2: 'firebase.js' is in a 'config' folder inside 'src/'.
//   Example: 'src/config/firebase.js'
//   You would need to change the import path to: `../config/firebase.js`
//   (Go up one to 'src/', then into 'config/', then find 'firebase.js').
//
// Scenario 3: 'firebase.js' is in the SAME directory as 'UpdateRoomData.jsx'.
//   Example: 'src/components/firebase.js' (Less common, but possible)
//   You would need to change the import path to: `./firebase.js`
//   (Look in the current directory for 'firebase.js').
//
// PLEASE DOUBLE-CHECK YOUR PROJECT'S ACTUAL FOLDER STRUCTURE FOR 'firebase.js'
// AND ADJUST THE IMPORT STATEMENT BELOW IF NECESSARY.
//
import { db } from "../firebase.jsx";
import { ref, onValue, update, push } from "firebase/database"; // Import push for alerts

const UpdateRoomData = () => {
  const [rooms, setRooms] = useState({});
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loading, setLoading] = useState(true);

  // Form states for various room-specific data fields
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [gas, setGas] = useState("Normal"); // Default to Normal
  const [motion, setMotion] = useState("No Motion"); // Default to No Motion
  const [doorStatus, setDoorStatus] = useState("Closed"); // State for door status
  const [flameSensorStatus, setFlameSensorStatus] = useState("Normal"); // NEW: State for flame sensor status

  // Room-specific reminder state (renamed for clarity as pet reminders are separate)
  const [roomSpecificReminder, setRoomSpecificReminder] = useState("");
  const [newRoomAlert, setNewRoomAlert] = useState(""); // For room-level alerts

  // State to manage device states directly in the form
  const [currentDevices, setCurrentDevices] = useState({});

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

  // Fetch rooms data and listen for changes
  useEffect(() => {
    const roomsRef = ref(db, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRooms(data);

      // Set first room as selected by default if rooms exist
      if (!selectedRoomId && Object.keys(data).length > 0) {
        const firstRoomId = Object.keys(data)[0];
        setSelectedRoomId(firstRoomId);
        loadRoomData(firstRoomId, data[firstRoomId]);
      } else if (selectedRoomId && data[selectedRoomId]) {
        // If a room was already selected, update its fields with fresh data
        loadRoomData(selectedRoomId, data[selectedRoomId]);
      } else if (selectedRoomId && !data[selectedRoomId] && Object.keys(data).length > 0) {
        // If the selected room was deleted, default to the first available room
        setSelectedRoomId(Object.keys(data)[0]);
        loadRoomData(Object.keys(data)[0], data[Object.keys(data)[0]]);
      } else if (Object.keys(data).length === 0) {
        // No rooms left
        setSelectedRoomId(null);
        loadRoomData(null, null); // Clear fields if no rooms
      }
      setLoading(false);
    });

    // Cleanup listener
    return () => unsubscribe();
  }, [selectedRoomId]); // Re-run if selectedRoomId changes to load data

  // Function to load data into form fields when a room is selected
  const loadRoomData = (roomId, roomData) => {
    if (roomData) {
      setTemperature(roomData.status?.temperature || "");
      setHumidity(roomData.status?.humidity || "");
      setGas(roomData.status?.gas || "Normal");
      setMotion(roomData.status?.motion || "No Motion");
      setDoorStatus(roomData.doorStatus || "Closed"); // Load door status
      setFlameSensorStatus(roomData.status?.flameSensor || "Normal"); // NEW: Load flame sensor status

      setRoomSpecificReminder(roomData.reminders?.medication || ""); // Assuming 'medication' is a general reminder field for rooms
      setCurrentDevices(roomData.devices || {}); // Load devices into state
    } else {
      // Clear fields if no roomData (e.g., room deleted or no rooms)
      setTemperature("");
      setHumidity("");
      setGas("Normal");
      setMotion("No Motion");
      setDoorStatus("Closed"); // Reset door status
      setFlameSensorStatus("Normal"); // NEW: Reset flame sensor status
      setRoomSpecificReminder("");
      setCurrentDevices({});
    }
    setMessage(""); // Clear messages on room change
    setMessageType("");
  };

  // Handle room selection change
  const handleRoomSelect = (e) => {
    const newRoomId = e.target.value;
    setSelectedRoomId(newRoomId);
    // Data will be loaded by the useEffect hook due to selectedRoomId dependency
  };

  // Handler to toggle device state locally and then update Firebase
  const toggleDeviceState = (device) => {
    const currentState = currentDevices[device];
    const updatedDevices = {
      ...currentDevices,
      [device]: !currentState, // Toggle the boolean state
    };
    setCurrentDevices(updatedDevices); // Update local state immediately

    // Also update Firebase immediately for real-time reflection
    update(ref(db, `rooms/${selectedRoomId}/devices`), {
      [device]: updatedDevices[device],
    })
    .catch((error) => {
      console.error(`Error toggling ${device}:`, error);
      setMessage(`Failed to toggle ${device}: ${error.message}`);
      setMessageType("danger");
      // Optionally revert local state if Firebase update fails
      setCurrentDevices(prev => ({ ...prev, [device]: !prev[device] }));
    });
  };


  const handleUpdateData = async (e) => {
    e.preventDefault();

    if (!selectedRoomId) {
      setMessage("Please select a room first.");
      setMessageType("danger");
      return;
    }

    const roomRef = ref(db, `rooms/${selectedRoomId}`);
    const updates = {
      status: {
        temperature: parseFloat(temperature) || 0, // Convert to number
        humidity: parseFloat(humidity) || 0,
        gas: gas,
        motion: motion,
        flameSensor: flameSensorStatus, // NEW: Include flameSensorStatus in updates
      },
      doorStatus: doorStatus,
      reminders: {
        medication: roomSpecificReminder, // Save room-specific reminder
      },
      devices: currentDevices, // Include the updated devices object here
    };

    try {
      await update(roomRef, updates);
      setMessage("Room data updated successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating room data:", error);
      setMessage(`Failed to update data: ${error.message}`);
      setMessageType("danger");
    }
  };

  const handleAddRoomAlert = async () => { // Renamed for clarity
    if (!selectedRoomId || newRoomAlert.trim() === "") {
      setMessage("Please select a room and enter an alert message.");
      setMessageType("danger");
      return;
    }

    const alertsRef = ref(db, `rooms/${selectedRoomId}/alerts`); // Room-specific alerts
    try {
      await push(alertsRef, newRoomAlert.trim()); // Trim whitespace
      setMessage("Room alert added successfully!");
      setMessageType("success");
      setNewRoomAlert(""); // Clear the input field
    } catch (error) {
      console.error("Error adding room alert:", error);
      setMessage(`Failed to add room alert: ${error.message}`);
      setMessageType("danger");
    }
  };


  if (loading) {
    return <div className="text-center p-5 text-muted">Loading rooms...</div>;
  }

  if (Object.keys(rooms).length === 0) {
    return (
      <div className="text-center p-5">
        <h3 className="text-muted">No rooms found.</h3>
        <p className="text-muted">Please add a room first to update its data.</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-5 text-primary fw-bold">⚙️ Update Room Data</h2>

      {/* Room Selector Dropdown */}
      <div className="mb-5">
        <label htmlFor="roomSelector" className="form-label text-muted mb-1">
          Select Room:
        </label>
        <select
          id="roomSelector"
          className="form-select form-select-lg shadow-sm rounded-pill"
          value={selectedRoomId || ''} // Ensure value is not null for select
          onChange={handleRoomSelect}
          style={{ maxWidth: '300px' }}
        >
          {!selectedRoomId && <option value="">-- Select a Room --</option>}
          {Object.entries(rooms).map(([roomId, room]) => (
            <option key={roomId} value={roomId}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {selectedRoomId && (
        <form onSubmit={handleUpdateData} className="row g-4"> {/* g-4 for consistent spacing */}
          {/* Home Status Inputs */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg rounded-xl border-0 h-100">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-4 fw-bold">🏠 Update Home Status</h5>
                <div className="mb-3">
                  <label htmlFor="temperature" className="form-label text-muted">Temperature (°C)</label>
                  <input
                    type="number"
                    className="form-control rounded-lg shadow-sm"
                    id="temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g., 25"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="humidity" className="form-label text-muted">Humidity (%)</label>
                  <input
                    type="number"
                    className="form-control rounded-lg shadow-sm"
                    id="humidity"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    placeholder="e.g., 60"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="gas" className="form-label text-muted">Gas Status</label>
                  <select
                    className="form-select rounded-lg shadow-sm"
                    id="gas"
                    value={gas}
                    onChange={(e) => setGas(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Detected">Detected</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="motion" className="form-label text-muted">Motion Status</label>
                  <select
                    className="form-select rounded-lg shadow-sm"
                    id="motion"
                    value={motion}
                    onChange={(e) => setMotion(e.target.value)}
                  >
                    <option value="No Motion">No Motion</option>
                    <option value="Detected">Detected</option>
                  </select>
                </div>
                {/* NEW: Door Status Input */}
                <div className="mb-3">
                  <label htmlFor="doorStatus" className="form-label text-muted">Door Status</label>
                  <select
                    className="form-select rounded-lg shadow-sm"
                    id="doorStatus"
                    value={doorStatus}
                    onChange={(e) => setDoorStatus(e.target.value)}
                  >
                    <option value="Closed">Closed</option>
                    <option value="Open">Open</option>
                  </select>
                  <small className="form-text text-muted">Manually set the door's magnetic switch status.</small>
                </div>
                {/* NEW: Flame Sensor Status Input */}
                <div className="mb-3">
                  <label htmlFor="flameSensorStatus" className="form-label text-muted">Flame Sensor Status</label>
                  <select
                    className="form-select rounded-lg shadow-sm"
                    id="flameSensorStatus"
                    value={flameSensorStatus}
                    onChange={(e) => setFlameSensorStatus(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Detected">Detected</option>
                  </select>
                  <small className="form-text text-muted">Manually set the flame sensor status.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Device Control Panel in UpdateRoomData */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg rounded-xl border-0 h-100">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-4 fw-bold">🎛️ Control Devices</h5>
                {Object.keys(currentDevices).length > 0 ? (
                  Object.entries(currentDevices).map(([device, isOn]) => (
                    <div className="form-check form-switch form-check-lg mb-3" key={device}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`${device}Toggle`}
                        checked={isOn}
                        onChange={() => toggleDeviceState(device)} // Use new toggle handler
                      />
                      <label
                        className="form-check-label ms-2 fs-5 fw-medium text-dark"
                        htmlFor={`${device}Toggle`}
                      >
                        {device === "lights" && "💡 Lights"}
                        {device === "fan" && "🌀 Fan"}
                        {device === "heater" && "🔥 Heater"}
                        {/* Fallback for other devices, capitalize first letter */}
                        {!["lights", "fan", "heater"].includes(device) && (
                          device.charAt(0).toUpperCase() + device.slice(1)
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No devices configured for this room. Add them via "Add Room" page.</p>
                )}
              </div>
            </div>
          </div>

          {/* Room Reminders Input */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg rounded-xl border-0 h-100">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-4 fw-bold">⏰ Room Reminders</h5>
                <div className="mb-3">
                  <label htmlFor="roomSpecificReminder" className="form-label text-muted">General Room Reminder</label>
                  <input
                    type="text"
                    className="form-control rounded-lg shadow-sm"
                    id="roomSpecificReminder"
                    value={roomSpecificReminder}
                    onChange={(e) => setRoomSpecificReminder(e.target.value)}
                    placeholder="e.g., Clean living room today"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room Alerts Input */}
          <div className="col-md-6 col-lg-8"> {/* Wider column for alerts input */}
            <div className="card shadow-lg rounded-xl border-0 h-100">
              <div className="card-body p-4">
                <h5 className="card-title text-danger mb-4 fw-bold">🚨 Add New Room Alert</h5>
                <div className="input-group mb-3 shadow-sm rounded-lg overflow-hidden">
                  <input
                    type="text"
                    className="form-control border-0 px-3 py-2"
                    placeholder="Enter new room alert message"
                    value={newRoomAlert}
                    onChange={(e) => setNewRoomAlert(e.target.value)}
                  />
                  <button
                    className="btn btn-warning fw-bold px-4"
                    type="button"
                    onClick={handleAddRoomAlert}
                  >
                    Add Alert
                  </button>
                </div>
                {/* Display current alerts for reference */}
                {rooms[selectedRoomId]?.alerts && rooms[selectedRoomId].alerts.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-muted mb-2">Current Room Alerts:</h6>
                    <ul className="list-group list-group-flush rounded-lg border">
                      {rooms[selectedRoomId].alerts.map((alert, index) => (
                        <li key={index} className="list-group-item bg-light text-danger fw-medium py-2">
                          <span className="me-2">•</span> {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button for all updates */}
          <div className="col-12 mt-5 text-center">
            <button type="submit" className="btn btn-primary btn-lg shadow-lg rounded-pill px-5 py-3 fw-bold animate-pulse-on-hover">
              Save All Changes for {selectedRoomId ? rooms[selectedRoomId]?.name : 'Selected Room'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UpdateRoomData;
