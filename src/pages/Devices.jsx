// src/pages/Devices.jsx
import React, { useState, useEffect } from 'react';
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
// This path assumes 'firebase.js' is located directly in the 'src/' directory.
// If your 'firebase.js' is in a different location (e.g., 'src/config/firebase.js'),
// you MUST adjust this import path accordingly (e.g., `../config/firebase.js`).
import { db } from "../firebase.jsx"; // Adjust path if needed
import { ref, onValue, push, remove } from "firebase/database";

const Devices = () => {
  const [displayDevices, setDisplayDevices] = useState([]); // Combined list for display
  const [rooms, setRooms] = useState({}); // To populate room dropdown for device assignment and to get room names
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState(""); // e.g., Light, Fan, Sensor, TV
  const [newDeviceId, setNewDeviceId] = useState(""); // This is the unique physical ID (user-provided)
  const [newDeviceRoomId, setNewDeviceRoomId] = useState(""); // Room to associate with
  const [newDeviceInitialState, setNewDeviceInitialState] = useState(false); // For toggle devices

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let fetchedRoomsData = {};
    let fetchedUserDevicesData = {};
    let roomsLoaded = false;
    let userDevicesLoaded = false;

    // Function to combine and set the display devices once both data sources are loaded
    const combineAndSetDevices = () => {
      if (roomsLoaded && userDevicesLoaded) {
        const combinedDevices = [];
        // Map for quick lookup of user-registered devices by their userProvidedDeviceId
        const userDeviceMap = new Map();

        // 1. Process devices from 'userDevices' (these are explicitly registered with a unique ID)
        for (const firebaseKey in fetchedUserDevicesData) {
          const device = { id: firebaseKey, ...fetchedUserDevicesData[firebaseKey], source: 'user-registered' };
          userDeviceMap.set(device.userProvidedDeviceId, device); // Store by the unique ID
          combinedDevices.push(device);
        }

        // 2. Process devices from 'rooms' (these are the basic 'lights', 'fan' added with rooms)
        for (const roomId in fetchedRoomsData) {
          const room = fetchedRoomsData[roomId];
          const roomName = room.name || "Unknown Room";

          if (room.devices) {
            for (const deviceKeyInRoom in room.devices) {
              const deviceStatusInRoom = room.devices[deviceKeyInRoom];

              // Check if this deviceKeyInRoom (which might be a user-registered device's firebaseKey, or a generic name like 'lights')
              // corresponds to an existing user-registered device by its Firebase ID (the 'id' field in combinedDevices)
              const existingUserDevice = combinedDevices.find(
                d => d.source === 'user-registered' && d.id === deviceKeyInRoom
              );

              if (existingUserDevice) {
                // If this room's device entry links to an existing user-registered device,
                // ensure its room details and status are updated based on the room's context
                existingUserDevice.isAssignedToRoom = true;
                existingUserDevice.roomName = roomName;
                existingUserDevice.status = deviceStatusInRoom; // Use the status from the room's data
              } else {
                // This device exists only in the room's direct device list (e.g., "lights", "fan" created via Add Room).
                // It does not have a corresponding entry in 'userDevices'.
                const roomOnlyDeviceId = `${roomId}_${deviceKeyInRoom}`; // Create a stable unique key for React
                combinedDevices.push({
                  id: roomOnlyDeviceId, // Use a generated unique ID for React's key prop
                  name: deviceKeyInRoom, // Use the device key from the room (e.g., "lights", "fan") as its name
                  type: getDeviceTypeFromName(deviceKeyInRoom), // Infer type from this name
                  userProvidedDeviceId: null, // No unique ID from userDevices for these
                  status: deviceStatusInRoom, // Use the status from the room's data
                  roomId: roomId, // Store the Firebase ID of the room
                  roomName: roomName, // Store the name of the room
                  source: 'room-only', // Mark as room-only source
                  isAssignedToRoom: true, // By definition, it's assigned to this room
                });
              }
            }
          }
        }

        // Sort devices by name for consistent display
        combinedDevices.sort((a, b) => a.name.localeCompare(b.name));
        setDisplayDevices(combinedDevices);
        setLoading(false);
      }
    };

    // Fetch all rooms
    const roomsRef = ref(db, "rooms");
    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      fetchedRoomsData = snapshot.val() || {};
      roomsLoaded = true;
      setRooms(fetchedRoomsData); // Update the 'rooms' state immediately for the dropdown
      // If there are rooms, pre-select the first one if no room is selected
      if (!newDeviceRoomId && Object.keys(fetchedRoomsData).length > 0) {
        setNewDeviceRoomId(Object.keys(fetchedRoomsData)[0]);
      }
      combineAndSetDevices(); // Attempt to combine once rooms are loaded
    });

    // Fetch all registered devices from /userDevices
    const userDevicesRef = ref(db, "userDevices");
    const unsubscribeUserDevices = onValue(userDevicesRef, (snapshot) => {
      fetchedUserDevicesData = snapshot.val() || {};
      userDevicesLoaded = true;
      combineAndSetDevices(); // Attempt to combine once user devices are loaded
    });

    return () => {
      unsubscribeRooms();
      unsubscribeUserDevices();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Helper to infer device type from common names
  const getDeviceTypeFromName = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('light')) return 'Light';
    if (lowerName.includes('fan')) return 'Fan';
    if (lowerName.includes('heater')) return 'Heater';
    if (lowerName.includes('sensor')) return 'Sensor';
    if (lowerName.includes('tv')) return 'TV';
    if (lowerName.includes('door')) return 'Door';
    return 'Generic Device';
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();

    if (newDeviceName.trim() === "" || newDeviceType.trim() === "" || newDeviceId.trim() === "" || newDeviceRoomId.trim() === "") {
      setMessage("All fields (Name, Type, Device ID, Room) are required.");
      setMessageType("danger");
      return;
    }

    // Check if userProvidedDeviceId already exists (to prevent duplicates)
    if (displayDevices.some(device => device.userProvidedDeviceId && device.userProvidedDeviceId.toLowerCase() === newDeviceId.trim().toLowerCase())) {
      setMessage("A device with this Unique Device ID already exists. Please use a unique ID.");
      setMessageType("danger");
      return;
    }
    // Also check if the 'name' is already used by a room-only device in the selected room. This avoids confusion.
    // If the device is room-only, its 'id' is roomId_deviceName, so we need to check against its name.
    const roomDevices = Object.entries(rooms[newDeviceRoomId]?.devices || {});
    if (roomDevices.some(([key, value]) => key.toLowerCase() === newDeviceName.trim().toLowerCase())) {
        setMessage(`A basic device named "${newDeviceName.trim()}" already exists in the selected room. Please use a different name or manage it through the room's direct device list.`);
        setMessageType("danger");
        return;
    }


    const userDevicesRef = ref(db, "userDevices"); // Target specific user devices path
    try {
      const newDevicePushRef = await push(userDevicesRef, {
        name: newDeviceName.trim(),
        type: newDeviceType.trim(),
        userProvidedDeviceId: newDeviceId.trim(), // The unique ID from the physical device
        roomId: newDeviceRoomId, // Store the Firebase key of the associated room
        roomName: rooms[newDeviceRoomId]?.name || "Unassigned", // Save room name for easy display
        status: newDeviceInitialState, // Initial state (e.g., on/off for a light)
        createdAt: new Date().toISOString(),
      });

      // After successfully adding to userDevices, also update the room's device list
      // to link to this newly registered device's unique ID.
      // This is crucial for consistency. The room's 'devices' object should contain the
      // Firebase key of the device in 'userDevices' as its value, or the userProvidedDeviceId.
      // Let's use the Firebase push key from `userDevices` for cleaner linking.
      await update(ref(db, `rooms/${newDeviceRoomId}/devices`), {
          [newDevicePushRef.key]: newDeviceInitialState // Link by Firebase push key and store its status
      });

      setMessage(`Device "${newDeviceName.trim()}" added and assigned to room successfully!`);
      setMessageType("success");
      setNewDeviceName("");
      setNewDeviceType("");
      setNewDeviceId("");
      setNewDeviceRoomId(Object.keys(rooms)[0] || ""); // Reset to first room or empty
      setNewDeviceInitialState(false);
    } catch (error) {
      console.error("Error adding device:", error);
      setMessage(`Failed to add device: ${error.message}`);
      setMessageType("danger");
    }
  };

  const handleDeleteDevice = async (deviceToDeleteId, deviceName, source, roomIdToDelete) => {
    if (window.confirm(`Are you sure you want to delete "${deviceName}"? This cannot be undone.`)) {
      try {
        if (source === 'user-registered') {
          // Delete from /userDevices
          await remove(ref(db, `userDevices/${deviceToDeleteId}`));

          // Additionally, remove references to this device from all rooms
          // This requires iterating through all rooms and checking their devices
          for (const rId in rooms) {
            if (rooms[rId].devices && rooms[rId].devices[deviceToDeleteId] !== undefined) {
              await remove(ref(db, `rooms/${rId}/devices/${deviceToDeleteId}`));
            }
          }
        } else if (source === 'room-only') {
          // Delete from rooms/{roomId}/devices/{deviceName}
          // The deviceToDeleteId for 'room-only' devices is roomId_deviceName.
          // We need to parse it back to roomId and deviceName
          const [roomKey, deviceKeyInRoom] = deviceToDeleteId.split('_');
          if (roomKey && deviceKeyInRoom && roomIdToDelete) { // Ensure roomIdToDelete is passed and valid
            await remove(ref(db, `rooms/${roomIdToDelete}/devices/${deviceKeyInRoom}`));
          } else {
              throw new Error("Invalid parameters for deleting room-only device.");
          }
        }
        setMessage(`Device "${deviceName}" deleted successfully!`);
        setMessageType("success");
      } catch (error) {
        console.error("Error deleting device:", error);
        setMessage(`Failed to delete device: ${error.message}`);
        setMessageType("danger");
      }
    }
  };

  // Helper to get device icon (moved outside for better reusability)
  const getDeviceIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'light': return '💡';
      case 'fan': return '🌀';
      case 'heater': return '🔥';
      case 'sensor': return '📡';
      case 'tv': return '📺';
      case 'door': return '🚪';
      case 'generic device': return '🔌'; // For inferred types
      default: return '⚙️'; // Default for unknown types
    }
  };


  if (loading) {
    return <div className="text-center p-5 text-muted">Loading devices...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-5 text-primary fw-bold">💡 Smart Device Management</h2>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {/* Add New Device Form */}
      <div className="card shadow-lg rounded-xl p-4 mb-5">
        <h5 className="card-title text-secondary mb-4 fw-bold">Register New Device</h5>
        <form onSubmit={handleAddDevice}>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="deviceName" className="form-label text-muted">Device Name</label>
              <input
                type="text"
                className="form-control rounded-lg shadow-sm"
                id="deviceName"
                placeholder="e.g., Living Room Light"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="deviceType" className="form-label text-muted">Device Type</label>
              <input
                type="text"
                className="form-control rounded-lg shadow-sm"
                id="deviceType"
                placeholder="e.g., Light, Fan, Sensor"
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="deviceId" className="form-label text-muted">Unique Device ID (from physical device)</label>
              <input
                type="text"
                className="form-control rounded-lg shadow-sm"
                id="deviceId"
                placeholder="e.g., ABC123XYZ789"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                required
              />
              <small className="form-text text-muted">This should be a unique identifier from your actual physical device.</small>
            </div>
            <div className="col-md-6">
              <label htmlFor="deviceRoom" className="form-label text-muted">Assign to Room</label>
              <select
                className="form-select rounded-lg shadow-sm"
                id="deviceRoom"
                value={newDeviceRoomId}
                onChange={(e) => setNewDeviceRoomId(e.target.value)}
                required
              >
                {/* Always include a default option, and conditionally show "No rooms available" */}
                {Object.keys(rooms).length === 0 ? (
                  <option value="">No rooms available</option>
                ) : (
                  <>
                    <option value="">-- Select a Room --</option>
                    {Object.entries(rooms).map(([roomId, room]) => (
                      <option key={roomId} value={roomId}>{room.name}</option>
                    ))}
                  </>
                )}
              </select>
              {Object.keys(rooms).length === 0 && <small className="form-text text-danger">Please add a room first from "Add Room" page.</small>}
            </div>
            <div className="col-12">
              <div className="form-check form-switch form-check-lg">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="deviceInitialState"
                  checked={newDeviceInitialState}
                  onChange={(e) => setNewDeviceInitialState(e.target.checked)}
                />
                <label className="form-check-label ms-2 fs-5 text-muted" htmlFor="deviceInitialState">
                  Initial State: ON
                </label>
              </div>
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover mt-3">
                Register Device & Assign to Room
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List of Registered Devices */}
      <div className="card shadow-lg rounded-xl p-4">
        <h5 className="card-title text-secondary mb-4 fw-bold">All Registered Devices ({displayDevices.length})</h5>
        {displayDevices.length === 0 ? (
          <p className="text-muted text-center">No devices registered yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {displayDevices.map((device) => (
              <li key={device.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                  <span className="me-2 fs-4">{getDeviceIcon(device.type)}</span>
                  <span className="fw-bold text-dark">{device.name}</span>
                  {device.userProvidedDeviceId && (
                    <span className="text-muted ms-2 small">(ID: {device.userProvidedDeviceId})</span>
                  )}
                  <p className="mb-0 text-muted small mt-1">
                    Room: {device.roomName || 'Not Assigned'}
                    {device.source === 'room-only' && <span className="badge bg-info ms-2">Room Managed</span>}
                  </p>
                  <p className="mb-0 text-muted small">Status: <span className={`fw-bold ${device.status ? 'text-success' : 'text-danger'}`}>{device.status ? 'ON' : 'OFF'}</span></p>
                </div>
                <button
                  className="btn btn-outline-danger btn-sm rounded-pill"
                  // Pass source and original roomId for room-only devices to handleDeleteDevice
                  onClick={() => handleDeleteDevice(device.id, device.name, device.source, device.roomId)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Devices;
