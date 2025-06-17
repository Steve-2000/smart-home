// src/pages/HomeOverview.jsx
import React, { useState, useEffect } from 'react';
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// This path assumes 'firebase.js' is located directly in the 'src/' directory.
// If your 'firebase.js' is in a different location (e.g., 'src/config/firebase.js'),
// you MUST adjust this import path accordingly (e.g., `../config/firebase.js`).
//
import { db } from '../firebase.jsx';
import { ref, onValue } from 'firebase/database';

const HomeOverview = () => {
  const [roomsData, setRoomsData] = useState({});
  const [petsData, setPetsData] = useState({});
  const [laserBoundaryData, setLaserBoundaryData] = useState(null); // State for laser boundary data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let roomsLoaded = false;
    let petsLoaded = false;
    let laserLoaded = false; // New flag for laser data

    // Function to set loading to false once all data sources are fetched
    const checkLoading = () => {
      if (roomsLoaded && petsLoaded && laserLoaded) {
        setLoading(false);
      }
    };

    // Fetch Rooms Data
    const roomsRef = ref(db, 'rooms');
    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRoomsData(data);
      roomsLoaded = true;
      checkLoading();
    });

    // Fetch Pets Data
    const petsRef = ref(db, 'pets');
    const unsubscribePets = onValue(petsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPetsData(data);
      petsLoaded = true;
      checkLoading();
    });

    // Fetch Laser Boundary Data
    const laserRef = ref(db, 'houseProtection'); // Path for laser boundary
    const unsubscribeLaser = onValue(laserRef, (snapshot) => {
      const data = snapshot.val();
      setLaserBoundaryData(data);
      laserLoaded = true;
      checkLoading();
    });

    return () => {
      // Clean up listeners on component unmount
      unsubscribeRooms();
      unsubscribePets();
      unsubscribeLaser(); // Clean up laser listener
    };
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <div className="text-center p-5 text-muted">Loading smart home overview...</div>;
  }

  // --- Data Processing for Display ---
  const doorStatuses = [];
  const gasStatuses = [];
  const motionStatuses = [];
  const flameStatuses = [];
  const petRfidStatuses = []; // Renamed for clarity on content

  Object.entries(roomsData).forEach(([roomId, room]) => {
    const roomName = room.name || `Room ${roomId.substring(0, 5)}...`; // Use room name or a clipped ID

    // Door Status: Only include if explicitly "Open" or "Closed"
    if (room.doorStatus && (room.doorStatus === "Open" || room.doorStatus === "Closed")) {
      doorStatuses.push({ roomName, status: room.doorStatus, type: 'door' });
    }
    // Gas Status: Only include if explicitly "Detected" or "Normal"
    if (room.status?.gas && (room.status.gas === "Detected" || room.status.gas === "Normal")) {
      gasStatuses.push({ roomName, status: room.status.gas, type: 'gas' });
    }
    // Motion Status: Only include if explicitly "Detected" or "No Motion"
    if (room.status?.motion && (room.status.motion === "Detected" || room.status.motion === "No Motion")) {
      motionStatuses.push({ roomName, status: room.status.motion, type: 'motion' });
    }
    // Flame Sensor Status: Only include if explicitly "Detected" or "Normal"
    if (room.status?.flameSensor && (room.status.flameSensor === "Detected" || room.status.flameSensor === "Normal")) {
      flameStatuses.push({ roomName, status: room.status.flameSensor, type: 'flame' });
    }
  });

  Object.entries(petsData).forEach(([petId, pet]) => {
    const rfidDetected = pet.petActivity?.rfidDetected;
    const lastActivityTime = pet.petActivity?.lastFed || pet.petActivity?.lastWatered;
    
    let displayStatus = "N/A";
    let statusColor = "text-muted";
    let activityInfo = "";

    if (typeof rfidDetected === 'boolean') {
      displayStatus = rfidDetected ? "Detected" : "Not Detected";
      statusColor = rfidDetected ? "text-success" : "text-secondary";
      if (rfidDetected && lastActivityTime) {
        activityInfo = ` (${new Date(lastActivityTime).toLocaleString()})`;
      }
    }

    petRfidStatuses.push({
      petName: pet.name,
      status: displayStatus,
      statusColor: statusColor,
      activityInfo: activityInfo,
      type: 'pet-rfid'
    });
  });

  // Laser Boundary Data for display
  const laserStatus = laserBoundaryData?.laserBoundaryStatus || "Unknown";
  const laserLastBreachTime = laserBoundaryData?.lastBreachTime || null;
  const isLaserBreached = laserStatus === "Breached";
  const displayLaserBreachTime = laserLastBreachTime ? new Date(laserLastBreachTime).toLocaleString() : "Never";
  const laserStatusIcon = isLaserBreached ? '🚨' : '✅';
  const laserStatusColorClass = isLaserBreached ? 'text-danger' : 'text-success';
  const laserCardColorClass = isLaserBreached ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success';


  return (
    <div className="flex-grow-1 p-4 bg-light" style={{ minHeight: '100vh' }}>
      <h2 className="mb-5 text-primary fw-bold">🏡 Smart Home Overview</h2>

      <div className="row g-4">
        {/* Door Status Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🚪 Door Status</h5>
              {doorStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {doorStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      <span className={`fw-bold ${item.status === 'Open' ? 'text-danger' : 'text-success'}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No active door statuses.</p>
              )}
            </div>
          </div>
        </div>

        {/* Gas Status Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🔥 Gas Status</h5>
              {gasStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {gasStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      <span className={`fw-bold ${item.status === 'Detected' ? 'text-danger' : 'text-success'}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No gas status available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Motion Status Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🚶 Motion Status</h5>
              {motionStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {motionStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      <span className={`fw-bold ${item.status === 'Detected' ? 'text-warning' : 'text-success'}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No motion status available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Flame Sensor Status Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🔥 Flame Sensor Status</h5>
              {flameStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {flameStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      <span className={`fw-bold ${item.status === 'Detected' ? 'text-danger' : 'text-success'}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No flame sensor status available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Laser Boundary Status Card (NEW) */}
        <div className="col-md-6 col-lg-4">
          <div className={`card h-100 shadow-lg rounded-xl border-0 ${laserCardColorClass}`}>
            <div className="card-body p-4">
              <h5 className={`card-title fw-bold d-flex align-items-center ${laserStatusColorClass} mb-3`}>
                <span className="me-2 fs-4">{laserStatusIcon}</span>
                Laser Boundary: {laserStatus}
              </h5>
              <p className="card-text text-muted">
                Last Breach: {displayLaserBreachTime}
              </p>
              {isLaserBreached && (
                <p className="text-danger fw-bold mt-2">Perimeter breach detected!</p>
              )}
              {!isLaserBreached && laserStatus !== "Unknown" && (
                <p className="text-success fw-bold mt-2">Boundary is clear.</p>
              )}
              {laserStatus === "Unknown" && (
                <p className="text-muted fw-bold mt-2">Laser boundary status unknown or not configured.</p>
              )}
              <small className="form-text text-info d-block mt-2">
                 For detailed control, navigate to 'Laser Boundary' page.
              </small>
            </div>
          </div>
        </div>

        {/* Pet RFID Detected Status Card (Updated Logic) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🐾 Pet RFID Status</h5>
              {petRfidStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {petRfidStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.petName}:</span>
                      <span className={`fw-bold ${item.statusColor}`}>
                        {item.status}{item.activityInfo}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No pet RFID statuses available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeOverview;
