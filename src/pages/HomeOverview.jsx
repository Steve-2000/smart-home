// src/pages/HomeOverview.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase.jsx'; // Ensure this path is correct for your Firebase setup
import { ref, onValue, update } from 'firebase/database';

const HomeOverview = () => {
  const [roomsData, setRoomsData] = useState({});
  const [petsData, setPetsData] = useState({});
  const [laserBoundaryData, setLaserBoundaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hallTemp, setHallTemp] = useState(null);
  const [hallHumidity, setHallHumidity] = useState(null);
  const [hallMotionStatus, setHallMotionStatus] = useState(null);
  const [flameStatuses, setFlameStatuses] = useState([]);
  const [isMotionDetectionOn, setIsMotionDetectionOn] = useState(true);

  useEffect(() => {
    let roomsLoaded = false;
    let petsLoaded = false;
    let laserLoaded = false;

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

      // Normalize flame sensor readings to "Detected" / "Normal"
      const newFlameStatuses = [];
      Object.entries(data).forEach(([roomId, room]) => {
        const raw = room?.status?.flameSensor;
        if (raw !== undefined && raw !== null) {
          let statusLabel = 'Unknown';

          if (typeof raw === 'boolean') {
            statusLabel = raw ? 'Detected' : 'Normal';
          } else if (typeof raw === 'number') {
            // treat any positive / non-zero as detected
            statusLabel = raw > 0 ? 'Detected' : 'Normal';
          } else if (typeof raw === 'string') {
            const r = raw.trim().toLowerCase();
            if (r === 'true' || r === '1' || r.includes('detec')) statusLabel = 'Detected';
            else if (r === 'false' || r === '0' || r.includes('norm')) statusLabel = 'Normal';
            else statusLabel = raw; // preserve original if unrecognized
          } else {
            statusLabel = String(raw);
          }

          const roomName = room?.name || `Room ${roomId.substring(0, 5)}...`;
          newFlameStatuses.push({ roomName, status: statusLabel });
        }
      });
      setFlameStatuses(newFlameStatuses);

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

    // Fetch House Protection Data (including hall conditions, laser boundary)
    const laserRef = ref(db, 'houseProtection');
    const unsubscribeLaser = onValue(laserRef, (snapshot) => {
      const data = snapshot.val();
      setLaserBoundaryData(data);
      // Update states from the houseProtection data
      setHallTemp(data?.temperature ?? null);
      setHallHumidity(data?.humidity ?? null);
      setHallMotionStatus(data?.motion ?? null);
      setIsMotionDetectionOn(data?.isMotionDetectionOn ?? true); // Default to true if not set
      laserLoaded = true;
      checkLoading();
    });

    return () => {
      unsubscribeRooms();
      unsubscribePets();
      unsubscribeLaser();
    };
  }, []);

  const toggleMotionDetection = () => {
    const laserRef = ref(db, 'houseProtection');
    const newStatus = !isMotionDetectionOn;
    update(laserRef, { isMotionDetectionOn: newStatus })
      .catch((error) => {
        console.error("Failed to toggle motion detection status:", error);
      });
  };

  if (loading) {
    return <div className="text-center p-5 text-muted">Loading smart home overview...</div>;
  }

  // --- Data Processing for Display ---
  const doorStatuses = [];
  const gasStatuses = [];
  const petRfidStatuses = [];
  const motionStatuses = [];

  // Add Hall motion status from houseProtection
  if (isMotionDetectionOn) {
    if (hallMotionStatus !== null) {
      motionStatuses.push({ roomName: 'Hall', status: hallMotionStatus, type: 'motion' });
    }
  }

  // Get other door, gas, and motion statuses from rooms
  Object.entries(roomsData).forEach(([roomId, room]) => {
    const roomName = room.name || `Room ${roomId.substring(0, 5)}...`;

    if (room.doorStatus && (room.doorStatus === "Open" || room.doorStatus === "Closed")) {
      doorStatuses.push({ roomName, status: room.doorStatus, type: 'door' });
    }
    if (room.status?.gas && (room.status.gas === "Detected" || room.status.gas === "Normal")) {
      gasStatuses.push({ roomName, status: room.status.gas, type: 'gas' });
    }
    // Only add motion from other rooms, not the hall which is now in houseProtection
    if (room.name !== "hall" && room.status?.motion && (room.status.motion === "Detected" || room.status.motion === "No Motion")) {
      motionStatuses.push({ roomName, status: room.status.motion, type: 'motion' });
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
      statusColor = rfidDetected ? "text-success" : "text-secondary"; // Keep existing pet RFID colors
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

  const laserStatus = laserBoundaryData?.laserBoundaryStatus || "Unknown";
  const laserLastBreachTime = laserBoundaryData?.lastBreachTime || null;
  const isLaserBreached = laserStatus === "Breached";
  const displayLaserBreachTime = laserLastBreachTime ? new Date(laserLastBreachTime).toLocaleString() : "Never";
  const laserStatusIcon = isLaserBreached ? '🚨' : '✅';
  const laserStatusColorClass = isLaserBreached ? 'text-danger' : 'text-success';
  // Determine if laser card needs glow
  const laserGlowClass = isLaserBreached ? 'emergency-glow-red' : '';
  const laserCardColorClass = isLaserBreached ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success';


  // Determine if motion card needs glow
  const isMotionDetectedInAnyRoom = motionStatuses.some(item => item.status === 'Detected');
  const motionGlowClass = (isMotionDetectionOn && isMotionDetectedInAnyRoom) ? 'emergency-glow-orange' : '';

  const motionCardStatus = isMotionDetectionOn ? (motionStatuses.length > 0 ? (
    <ul className="list-unstyled mb-0">
      {motionStatuses.map((item, index) => (
        <li key={index} className="d-flex justify-content-between align-items-center py-1">
          <span className="text-muted">{item.roomName}:</span>
          {/* Motion status: Detected is warning, No Motion is success */}
          <span className={`fw-bold ${item.status === 'Detected' ? 'text-warning' : 'text-success'}`}>
            {item.status}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-muted">No motion status available.</p>
  )) : (
    <p className="text-info fw-bold">Motion detection is temporarily disabled.</p>
  );

  return (
    <div className="flex-grow-1 p-4 bg-light" style={{ minHeight: '100vh' }}>
      <h2 className="mb-5 text-primary fw-bold">🏡 Smart Home Overview</h2>

      <div className="row g-4">
        {/* Hall Temperature and Humidity Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-lg rounded-xl border-0">
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🌡️ Hall Conditions</h5>
              {hallTemp !== null && hallHumidity !== null ? (
                <ul className="list-unstyled mb-0">
                  <li className="d-flex justify-content-between align-items-center py-1">
                    <span className="text-muted">Temperature:</span>
                    <span className="fw-bold text-success">{hallTemp}°C</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-center py-1">
                    <span className="text-muted">Humidity:</span>
                    <span className="fw-bold text-success">{hallHumidity}%</span>
                  </li>
                </ul>
              ) : (
                <p className="text-muted">No hall temperature or humidity data available.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Door Status Card */}
        <div className="col-md-6 col-lg-4">
          {/* Apply glow if any door is open */}
          <div className={`card h-100 shadow-lg rounded-xl border-0 ${doorStatuses.some(item => item.status === 'Open') ? 'emergency-glow-red' : ''}`}>
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🚪 Door Status</h5>
              {doorStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {doorStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      {/* Door status: Open is danger, Closed is success */}
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
          {/* Apply glow if gas is detected in any room */}
          <div className={`card h-100 shadow-lg rounded-xl border-0 ${gasStatuses.some(item => item.status === 'Detected') ? 'emergency-glow-red' : ''}`}>
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🔥 Gas Status</h5>
              {gasStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {gasStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      {/* Gas status: Detected is danger, Normal is success */}
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
          {/* Apply glow based on motion detection status and if motion is detected */}
          <div className={`card h-100 shadow-lg rounded-xl border-0 ${motionGlowClass}`}>
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🚶 Motion Status</h5>
              {motionCardStatus}
              <button 
                onClick={toggleMotionDetection} 
                className={`btn btn-sm mt-3 ${isMotionDetectionOn ? 'btn-warning' : 'btn-success'}`}
              >
                {isMotionDetectionOn ? 'Disable Motion Detection' : 'Enable Motion Detection'}
              </button>
            </div>
          </div>
        </div>

        {/* Flame Sensor Status Card */}
        <div className="col-md-6 col-lg-4">
          {/* Apply glow if flame is detected in any room */}
          <div className={`card h-100 shadow-lg rounded-xl border-0 ${flameStatuses.some(item => item.status === 'Detected') ? 'emergency-glow-red' : ''}`}>
            <div className="card-body p-4">
              <h5 className="card-title text-primary mb-3 fw-bold">🔥 Flame Sensor Status</h5>
              {flameStatuses.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {flameStatuses.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-muted">{item.roomName}:</span>
                      {/* Flame status: Detected is danger, Normal is success */}
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

        {/* Laser Boundary Status Card */}
        <div className="col-md-6 col-lg-4">
          {/* Card color and border dynamically change based on laser breach status */}
          {/* Apply glow based on laser breach status */}
          <div className={`card h-100 shadow-lg rounded-xl border-0 ${laserCardColorClass} ${laserGlowClass}`}>
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
          {/* No glow for pet RFID as it's not typically an "emergency" */}
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
