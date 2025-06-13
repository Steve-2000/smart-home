// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
// This path assumes 'firebase.js' is located directly in the 'src/' directory.
// If your 'firebase.js' is in a different location (e.g., 'src/config/firebase.js'),
// you MUST adjust this import path accordingly (e.g., `../config/firebase.js`).
import { db } from "../firebase.jsx";
import { ref, onValue, update } from "firebase/database";
import { Link } from 'react-router-dom'; // Import Link for navigation

const Dashboard = () => {
  const [rooms, setRooms] = useState({});
  const [pets, setPets] = useState({}); // New state for pets
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(true);

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
          // NEW: Ensure doorStatus is initialized
          doorStatus: firebaseData[roomId].doorStatus || "Unknown",
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

    // Fetch pets data for summary or linking
    const petsRef = ref(db, "pets");
    const unsubscribePets = onValue(petsRef, (snapshot) => {
        const petsData = snapshot.val() || {};
        const processedPetsData = {};
        // Ensure pet settings are initialized to prevent errors on Dashboard
        for (const petId in petsData) {
            processedPetsData[petId] = {
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

  if (loading) {
    return <div className="text-center p-5 text-muted">Loading your Smart Home data...</div>;
  }

  if (!selectedRoomId || Object.keys(rooms).length === 0) {
    return (
      <div className="text-center p-5">
        <h3 className="text-muted">No rooms found.</h3>
        <p className="text-muted">Please add a room using the "Add Room" link in the sidebar.</p>
      </div>
    );
  }

  const selectedRoom = rooms[selectedRoomId];

  // Handler to toggle devices and update Firebase
  const toggleDevice = (device) => {
    const currentState = selectedRoom.devices?.[device];
    update(ref(db, `rooms/${selectedRoomId}/devices`), {
      [device]: !currentState, // Toggle boolean state
    })
    .catch((error) => {
      console.error(`Error toggling ${device}:`, error);
      // Implement a more user-friendly error message if needed
    });
  };

  return (
    <>
      {/* Room Selector Dropdown */}
      <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <label htmlFor="roomSelector" className="form-label text-muted mb-1">
            Select Room:
          </label>
          <select
            id="roomSelector"
            className="form-select form-select-lg shadow-sm rounded-pill"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ width: 'auto' }}
          >
            {Object.entries(rooms).map(([roomId, room]) => (
              <option key={roomId} value={roomId}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        <h1 className="fw-bold text-primary mt-3 mt-md-0">{selectedRoom.name}</h1> {/* Prominent room name */}
      </div>

      {/* Dashboard content for selected room */}
      <div className="row g-4"> {/* g-4 provides consistent gutter spacing */}

        {/* Home Status Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0"> {/* h-100 for equal height cards */}
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🏠 Home Status</h5>
              <div className="d-flex align-items-center mb-3">
                <span className="me-3 display-6 text-warning">🌡️</span>
                <div>
                  <p className="mb-0 text-muted small">Temperature</p>
                  <p className="fs-4 fw-bold mb-0">{selectedRoom.status?.temperature || 'N/A'}°C</p>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <span className="me-3 display-6 text-info">💧</span>
                <div>
                  <p className="mb-0 text-muted small">Humidity</p>
                  <p className="fs-4 fw-bold mb-0">{selectedRoom.status?.humidity || 'N/A'}%</p>
                </div>
              </div>
              <hr className="my-3"/>
              <div className="d-flex align-items-center mb-2">
                <span className="me-2 fs-5 text-muted">🔥 Gas:</span>
                <span className={`fw-bold ${selectedRoom.status?.gas === "Detected" ? "text-danger" : "text-success"}`}>
                  {selectedRoom.status?.gas || 'N/A'}
                </span>
              </div>
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5 text-muted">🚶 Motion:</span>
                <span className={`fw-bold ${selectedRoom.status?.motion === "Detected" ? "text-warning" : "text-success"}`}>
                  {selectedRoom.status?.motion || 'N/A'}
                </span>
              </div>
              {/* NEW: Door Status */}
              <div className="d-flex align-items-center mt-3">
                <span className="me-2 fs-5 text-muted">🚪 Door:</span>
                <span className={`fw-bold ${selectedRoom.doorStatus === "Open" ? "text-danger" : "text-success"}`}>
                  {selectedRoom.doorStatus || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🎛️ Control Panel</h5>
              {selectedRoom.devices &&
                Object.entries(selectedRoom.devices).map(([device, isOn]) => (
                  <div className="form-check form-switch form-check-lg mb-3" key={device}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id={`${device}Switch`}
                      checked={isOn}
                      onChange={() => toggleDevice(device)}
                    />
                    <label
                      className="form-check-label ms-2 fs-5 fw-medium"
                      htmlFor={`${device}Switch`}
                    >
                      {device === "lights" && "💡 Lights"}
                      {device === "fan" && "🌀 Fan"}
                      {device === "heater" && "🔥 Heater"}
                      {!["lights", "fan", "heater"].includes(device) && device.charAt(0).toUpperCase() + device.slice(1)} {/* Capitalize other devices */}
                    </label>
                  </div>
                ))}
                {Object.keys(selectedRoom.devices || {}).length === 0 && (
                  <p className="text-muted">No devices configured for this room.</p>
                )}
            </div>
          </div>
        </div>

        {/* Pet Overview Card (simplified) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🐾 Pet Overview</h5>
              {Object.keys(pets).length > 0 ? (
                <>
                  <p className="fs-5 mb-2">You have <span className="fw-bold text-dark">{Object.keys(pets).length}</span> pet(s) registered.</p>
                  <ul className="list-unstyled mb-3">
                    {Object.values(pets).map((pet, index) => (
                      <li key={index} className="text-muted mb-1">
                        - <span className="fw-medium text-dark">{pet.name}</span> ({pet.type})
                      </li>
                    ))}
                  </ul>
                  <Link to="/home/pets" className="btn btn-sm btn-outline-primary rounded-pill">
                    Go to Pet Care <span className="ms-1">→</span>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-muted">No pets registered yet.</p>
                  <Link to="/home/add-pet" className="btn btn-sm btn-outline-success rounded-pill">
                    Add Your First Pet <span className="ms-1">🐶</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Room Reminders Card (room-specific, pet reminders are now on pet page) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">⏰ Room Reminders</h5>
              <p className="fs-5 mb-0">
                <span className="me-2 text-muted">General:</span>{" "}
                <span className="fw-bold text-dark">{selectedRoom.reminders?.medication || 'No reminders set'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Room Alerts Card */}
        <div className="col-md-6 col-lg-8"> {/* Wider column for alerts */}
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-danger mb-3 fw-bold">🚨 Room Alerts</h5>
              {selectedRoom.alerts && selectedRoom.alerts.length > 0 ? (
                <ul className="list-group list-group-flush border-0">
                  {selectedRoom.alerts.map((alert, index) => (
                    <li key={index} className="list-group-item bg-transparent text-danger fw-medium border-0 py-1">
                      <span className="me-2">•</span> {alert}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted fs-5">🔔 No new alerts for this room.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
