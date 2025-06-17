// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'Dashboard.jsx' FILE.
//
// Let's assume 'Dashboard.jsx' is located in 'src/pages/'.
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
// Scenario 3: 'firebase.js' is in the SAME directory as 'Dashboard.jsx'.
//   Example: 'src/pages/firebase.js' (Less common, but possible)
//   You would need to change the import path to: `./firebase.js`
//   (Look in the current directory for 'firebase.js').
//
// PLEASE DOUBLE-CHECK YOUR PROJECT'S ACTUAL FOLDER STRUCTURE FOR 'firebase.js'
// AND ADJUST THE IMPORT STATEMENT BELOW IF NECESSARY.
//
import { db } from "../firebase.jsx";
import { ref, onValue, update, remove } from "firebase/database"; // Import 'remove' for deleting
import { Link } from 'react-router-dom'; // Import Link for navigation

const Dashboard = () => {
  const [rooms, setRooms] = useState({});
  const [pets, setPets] = useState({}); // New state for pets
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(""); // State for success/error messages
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

  // Fetch rooms data and listen for changes
  useEffect(() => {
    const roomsRef = ref(db, "rooms");
    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      const firebaseData = snapshot.val() || {};
      const processedRooms = {};

      for (const roomId in firebaseData) {
        processedRooms[roomId] = {
          ...firebaseData[roomId],
          status: firebaseData[roomId].status || {},
          devices: firebaseData[roomId].devices || {},
          reminders: firebaseData[roomId].reminders || {},
          alerts: firebaseData[roomId].alerts || [],
          doorStatus: firebaseData[roomId].doorStatus || "Unknown", // Ensure doorStatus is initialized
          flameSensorStatus: firebaseData[roomId].status?.flameSensor || "Normal",
        };
      }
      setRooms(processedRooms);
      if (!selectedRoomId && Object.keys(processedRooms).length > 0) {
        setSelectedRoomId(Object.keys(processedRooms)[0]);
      } else if (selectedRoomId && !processedRooms[selectedRoomId] && Object.keys(processedRooms).length > 0) {
        setSelectedRoomId(Object.keys(processedRooms)[0] || null);
      }
      setLoading(false);
    });

    // --- Fetch pets data for summary or linking ---
    const petsRef = ref(db, "pets");
    const unsubscribePets = onValue(petsRef, (snapshot) => {
        const petsData = snapshot.val() || {};
        const processedPetsData = {};
        // Ensure pet settings are initialized to prevent errors on Dashboard
        for (const petId in petsData) {
            processedPetsData[petId] = {
                id: petId, // Ensure petId is part of the object
                ...petsData[petId],
                feederSettings: {
                    dailyFrequency: 1, // Ensure default if missing
                    ...(petsData[petId].feederSettings || {})
                },
                waterDispenserSettings: {
                    dailyFrequency: 1, // Ensure default if missing
                    ...(petsData[petId].waterDispenserSettings || {})
                },
                petActivity: petsData[petId].petActivity || {},
            };
        }
        setPets(processedPetsData);
    });


    // Cleanup listeners
    return () => {
      unsubscribeRooms();
      unsubscribePets();
    };
  }, [selectedRoomId]);

  // Handler to toggle devices and update Firebase
  const toggleDevice = (device) => {
    const currentState = selectedRoom.devices?.[device];
    update(ref(db, `rooms/${selectedRoomId}/devices`), {
      [device]: !currentState, // Toggle boolean state
    })
    .catch((error) => {
      console.error(`Error toggling ${device}:`, error);
      setMessage(`Oops! Failed to toggle ${device}. Please try again.`);
      setMessageType("danger");
    });
  };

  // Handler to delete a pet
  const handleDeletePet = async (petId, petName) => {
    if (window.confirm(`Are you sure you want to say goodbye to ${petName}? This action cannot be undone.`)) {
      try {
        await remove(ref(db, `pets/${petId}`));
        setMessage(`Yay! ${petName} was safely removed from your pet family.`);
        setMessageType("success");
      } catch (error) {
        console.error(`Error deleting pet ${petName} from Firebase:`, error);
        setMessage(`Oh no! Couldn't delete ${petName}: ${error.message}.`);
        setMessageType("danger");
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5 animate-pulse">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-3 fs-5">Warming up your Smart Home, please wait a moment...</p>
      </div>
    );
  }

  if (!selectedRoomId || Object.keys(rooms).length === 0) {
    return (
      <div className="text-center p-5">
        <h3 className="text-info mb-3">Looks a little empty here! 🏠</h3>
        <p className="text-muted fs-5">No rooms found in your Smart Home yet.</p>
        <p className="text-muted fs-5">Let's get started by adding your first room!</p>
        <Link to="/addroom" className="btn btn-primary btn-lg rounded-pill mt-4 shadow-sm animate-bounce-on-hover">
          ✨ Add Your First Room!
        </Link>
      </div>
    );
  }

  const selectedRoom = rooms[selectedRoomId];

  // Helper function to render status chips
  const renderStatusChip = (label, status, dangerCondition, warningCondition = null) => {
    let chipClass = "bg-success-subtle text-success"; // Default to success
    if (dangerCondition(status)) {
      chipClass = "bg-danger-subtle text-danger";
    } else if (warningCondition && warningCondition(status)) {
      chipClass = "bg-warning-subtle text-warning";
    }

    return (
      <span className={`badge ${chipClass} fs-6 px-3 py-2 me-2 mb-2 rounded-pill`}>
        {label}: {status || 'N/A'}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4"> {/* Added container-fluid for max width and padding */}
      {/* Room Selector and Title */}
      <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-center bg-white p-4 rounded-xl shadow-sm border border-light">
        <div className="flex-grow-1 me-md-4 mb-3 mb-md-0">
          <label htmlFor="roomSelector" className="form-label text-muted mb-1 small fw-bold">
            🏡 Currently Viewing:
          </label>
          <select
            id="roomSelector"
            className="form-select form-select-lg shadow-sm rounded-pill border-0 cute-select"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            {Object.entries(rooms).map(([roomId, room]) => (
              <option key={roomId} value={roomId}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        <h1 className="fw-bold text-primary display-5 cute-heading animate-fade-in">{selectedRoom.name}</h1> {/* Prominent room name */}
      </div>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4 rounded-3 shadow-sm`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {/* Dashboard content for selected room */}
      <div className="row g-4"> {/* g-4 provides consistent gutter spacing */}

        {/* Home Status Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0 bg-white cute-card-bg-gradient"> {/* Added cute-card-bg-gradient */}
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-4 fw-bold d-flex align-items-center">
                <span className="me-2 fs-4">🏠</span> Cozy Home Status
              </h5>
              <div className="d-flex align-items-center mb-3">
                <span className="me-3 display-6 text-warning">🌡️</span>
                <div>
                  <p className="mb-0 text-muted small">Temperature</p>
                  <p className="fs-3 fw-bold mb-0 text-dark">{selectedRoom.status?.temperature || 'N/A'}°C</p>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <span className="me-3 display-6 text-info">💧</span>
                <div>
                  <p className="mb-0 text-muted small">Humidity</p>
                  <p className="fs-3 fw-bold mb-0 text-dark">{selectedRoom.status?.humidity || 'N/A'}%</p>
                </div>
              </div>
              <hr className="my-3 border-secondary border-opacity-25"/> {/* Lighter hr */}
              <div className="d-flex flex-wrap"> {/* Use flex-wrap for chips */}
                {renderStatusChip("Gas", selectedRoom.status?.gas, (status) => status === "Detected")}
                {renderStatusChip("Motion", selectedRoom.status?.motion, (status) => status === "Detected", (status) => status === "Detected")} {/* Motion is warning, not danger */}
                {renderStatusChip("Door", selectedRoom.doorStatus, (status) => status === "Open")}
                {renderStatusChip("Flame", selectedRoom.status?.flameSensor, (status) => status === "Detected")}
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0 bg-white cute-card-bg-gradient">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-4 fw-bold d-flex align-items-center">
                <span className="me-2 fs-4">🎛️</span> Smart Controls
              </h5>
              {selectedRoom.devices &&
                Object.entries(selectedRoom.devices).map(([device, isOn]) => (
                  <div className="form-check form-switch form-check-lg mb-3 pb-2 border-bottom border-opacity-10" key={device}> {/* Added padding bottom and border */}
                    <input
                      className="form-check-input cute-switch"
                      type="checkbox"
                      role="switch"
                      id={`${device}Switch`}
                      checked={isOn}
                      onChange={() => toggleDevice(device)}
                    />
                    <label
                      className="form-check-label ms-3 fs-5 fw-medium text-dark d-flex align-items-center"
                      htmlFor={`${device}Switch`}
                    >
                      {device === "lights" && "💡 Lights"}
                      {device === "fan" && "🌀 Fan"}
                      {device === "heater" && "🔥 Heater"}
                      {!["lights", "fan", "heater"].includes(device) && device.charAt(0).toUpperCase() + device.slice(1)}
                    </label>
                  </div>
                ))}
                {Object.keys(selectedRoom.devices || {}).length === 0 && (
                  <p className="text-muted fs-5 text-center py-4">No gadgets to control here yet! <br/> Add some from the Devices page. 🛠️</p>
                )}
            </div>
          </div>
        </div>

        {/* Pet Overview Card (with delete option) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0 bg-white cute-card-bg-gradient-pets"> {/* Different gradient for pets */}
            <div className="card-body p-4 d-flex flex-column"> {/* Flex column for pushing content */}
              <h5 className="card-title text-primary mb-4 fw-bold d-flex align-items-center">
                <span className="me-2 fs-4">💖</span> Our Furry Friends
              </h5>
              {Object.keys(pets).length > 0 ? (
                <>
                  <p className="fs-5 mb-3 text-dark">
                    You have <span className="fw-bold text-success">{Object.keys(pets).length}</span> amazing pet(s) registered!
                  </p>
                  <ul className="list-unstyled mb-4 flex-grow-1 overflow-auto"> {/* Added flex-grow-1 and overflow-auto */}
                    {Object.values(pets).map((pet) => (
                      <li key={pet.id} className="text-muted mb-3 p-2 d-flex justify-content-between align-items-center bg-light rounded-3 shadow-sm border border-info border-opacity-25 cute-pet-item">
                        <div className="d-flex align-items-center">
                          <span className="me-2 fs-4">{pet.type === 'Dog' ? '🐶' : pet.type === 'Cat' ? '🐱' : pet.type === 'Bird' ? '🐦' : '🐾'}</span>
                          <span className="fw-semibold text-dark">{pet.name}</span> <span className="ms-2">({pet.type})</span>
                        </div>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-pill ms-2 cute-delete-btn"
                          onClick={() => handleDeletePet(pet.id, pet.name)}
                          title={`Delete ${pet.name}`}
                        >
                          <span className="d-none d-md-inline">Say Bye</span> <span className="d-md-none">❌</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Link to="/pets" className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover mt-auto cute-btn">
                    🐾 Manage Pet Care
                  </Link>
                </>
              ) : (
                <div className="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <p className="text-muted fs-5 mb-4">No furry friends to show here yet. Add them to get started!</p>
                  <Link to="/addpet" className="btn btn-success btn-lg w-100 rounded-pill shadow-sm animate-bounce-on-hover cute-btn">
                    💖 Add Your First Pet!
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Room Reminders Card (room-specific) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0 bg-white cute-card-bg-gradient">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-4 fw-bold d-flex align-items-center">
                <span className="me-2 fs-4">⏰</span> Gentle Reminders
              </h5>
              <p className="fs-5 mb-0 text-dark">
                <span className="me-2 text-muted">A little note for this room:</span>{" "}
                <span className="fw-semibold text-info">{selectedRoom.reminders?.medication || 'No special reminders here!'}</span>
              </p>
              {Object.keys(selectedRoom.reminders || {}).length === 0 && (
                <p className="text-muted small mt-3">
                  (You can set reminders for rooms on the "Manage Rooms" page.)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Room Alerts Card */}
        <div className="col-md-6 col-lg-8"> {/* Wider column for alerts */}
          <div className="card h-100 shadow-lg rounded-xl border-0 bg-white cute-card-bg-gradient-alerts"> {/* Different gradient for alerts */}
            <div className="card-body p-4">
              <h5 className="card-title text-danger mb-4 fw-bold d-flex align-items-center">
                <span className="me-2 fs-4">🚨</span> Important Alerts!
              </h5>
              {selectedRoom.alerts && selectedRoom.alerts.length > 0 ? (
                <ul className="list-group list-group-flush border-0">
                  {selectedRoom.alerts.map((alert, index) => (
                    <li key={index} className="list-group-item bg-transparent text-danger fw-medium border-0 py-2 d-flex align-items-center cute-alert-item">
                      <span className="me-3 fs-5">❗</span> <span className="flex-grow-1">{alert}</span>
                      <small className="text-muted ms-auto">(Just now!)</small> {/* Placeholder for timestamp */}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-5">
                  <p className="text-success fs-5">All clear! ✨ No new alerts for this room.</p>
                  <p className="text-muted small">Your home is safe and sound.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
