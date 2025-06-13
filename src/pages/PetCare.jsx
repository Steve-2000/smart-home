// src/pages/PetCare.jsx
import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
// This path assumes 'firebase.js' is located directly in the 'src/' directory.
// If your 'firebase.js' is in a different location (e.g., 'src/config/firebase.js'),
// you MUST adjust this import path accordingly (e.g., `../config/firebase.js`).
import { db } from "../firebase.jsx";
import { ref, onValue, update ,push} from "firebase/database";

const PetCare = () => {
  const [pets, setPets] = useState({});
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [newAlert, setNewAlert] = useState(""); // State for new pet alert input

  // Common daily frequency options
  const dailyFrequencyOptions = [
    { value: 0, label: "Disabled" },
    { value: 1, label: "1 time / day" },
    { value: 2, label: "2 times / day" },
    { value: 3, label: "3 times / day" },
    { value: 4, label: "4 times / day" },
    { value: 6, label: "6 times / day" },
    { value: 8, label: "8 times / day" },
  ];

  // Fetch pets data and listen for changes
  useEffect(() => {
    const petsRef = ref(db, "pets"); // Listen to the new 'pets' collection
    const unsubscribe = onValue(petsRef, (snapshot) => {
      const firebaseData = snapshot.val() || {};
      const processedPets = {};

      for (const petId in firebaseData) {
        processedPets[petId] = {
          ...firebaseData[petId],
          // Ensure nested objects and new fields exist to prevent errors
          petActivity: firebaseData[petId].petActivity || {},
          feederSettings: {
            enabled: false,
            lastManualTrigger: "",
            foodLevel: 100,
            portionSize: 50,
            dailyFrequency: 1, // Ensure default if missing
            ...(firebaseData[petId].feederSettings || {})
          },
          waterDispenserSettings: {
            enabled: false,
            lastManualTrigger: "",
            waterLevel: 100,
            refillThreshold: 20,
            dailyFrequency: 1, // Ensure default if missing
            ...(firebaseData[petId].waterDispenserSettings || {})
          },
          reminders: firebaseData[petId].reminders || {},
          alerts: firebaseData[petId].alerts || [],
        };
      }

      setPets(processedPets);

      if (!selectedPetId && Object.keys(processedPets).length > 0) {
        setSelectedPetId(Object.keys(processedPets)[0]);
      } else if (selectedPetId && !processedPets[selectedPetId] && Object.keys(processedPets).length > 0) {
        // If the previously selected pet was deleted, select the first available pet
        setSelectedPetId(Object.keys(processedPets)[0]);
      } else if (Object.keys(processedPets).length === 0) {
        setSelectedPetId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedPetId]);

  if (loading) {
    return <div className="text-center p-5 text-muted">Loading pet care data...</div>;
  }

  if (!selectedPetId || Object.keys(pets).length === 0) {
    return (
      <div className="text-center p-5">
        <h3 className="text-muted">No pets found.</h3>
        <p className="text-muted">Please add a pet using the "Add Pet" link in the sidebar to manage pet care settings.</p>
      </div>
    );
  }

  const selectedPet = pets[selectedPetId];
  const feederSettings = selectedPet.feederSettings;
  const waterDispenserSettings = selectedPet.waterDispenserSettings;
  const petActivity = selectedPet.petActivity;
  const alerts = selectedPet.alerts;


  // Handler to toggle feeder/water dispenser enabled state
  const toggleAutomationEnabled = async (deviceType, currentEnabledState) => {
    try {
      await update(ref(db, `pets/${selectedPetId}/${deviceType}Settings`), { // Note the deviceTypeSettings path
        enabled: !currentEnabledState,
      });
      setMessage(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} automation ${!currentEnabledState ? 'enabled' : 'disabled'}!`);
      setMessageType("success");
    } catch (error) {
      console.error(`Error toggling ${deviceType}:`, error);
      setMessage(`Failed to toggle ${deviceType} automation: ${error.message}`);
      setMessageType("danger");
    }
  };

  // Handler for manual feed/refill trigger
  const handleManualTrigger = async (deviceType) => {
    try {
      const now = new Date().toISOString();
      if (deviceType === "feeder") {
        const newFoodLevel = Math.max(0, (feederSettings.foodLevel || 0) - (feederSettings.portionSize || 0));
        await update(ref(db, `pets/${selectedPetId}/feederSettings`), {
          lastManualTrigger: now,
          foodLevel: newFoodLevel,
        });
        // Also update lastFed in petActivity
        await update(ref(db, `pets/${selectedPetId}/petActivity`), {
          lastFed: now,
        });
        setMessage(`Manual feed triggered for ${selectedPet.name}! Food level: ${newFoodLevel}%`);
      } else if (deviceType === "waterDispenser") {
        await update(ref(db, `pets/${selectedPetId}/waterDispenserSettings`), {
          lastManualTrigger: now,
          waterLevel: 100, // Refill to full
        });
        setMessage(`Manual water refill triggered for ${selectedPet.name}! Water level: 100%`);
      }
      setMessageType("success");
    } catch (error) {
      console.error(`Error triggering manual ${deviceType}:`, error);
      setMessage(`Failed to manually trigger ${deviceType}: ${error.message}`);
      setMessageType("danger");
    }
  };

  // Handler for setting portion size (only for feeder)
  const handlePortionSizeChange = async (e) => {
    const newPortion = parseInt(e.target.value, 10);
    if (!isNaN(newPortion) && newPortion >= 0) { // Portion size can be 0 (no dispense)
      try {
        await update(ref(db, `pets/${selectedPetId}/feederSettings`), {
          portionSize: newPortion,
        });
        setMessage("Feeder portion size updated!");
        setMessageType("success");
      } catch (error) {
        console.error("Error updating portion size:", error);
        setMessage(`Failed to update portion size: ${error.message}`);
        setMessageType("danger");
      }
    } else {
      setMessage("Invalid portion size. Must be a non-negative number.");
      setMessageType("danger");
    }
  };

  // NEW: Handler for setting daily frequency
  const handleDailyFrequencyChange = async (deviceType, e) => {
    const newFrequency = parseInt(e.target.value, 10);
    if (!isNaN(newFrequency) && newFrequency >= 0) {
      try {
        await update(ref(db, `pets/${selectedPetId}/${deviceType}Settings`), {
          dailyFrequency: newFrequency,
        });
        setMessage(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} daily frequency updated to ${newFrequency} times.`);
        setMessageType("success");
      } catch (error) {
        console.error(`Error updating ${deviceType} daily frequency:`, error);
        setMessage(`Failed to update ${deviceType} daily frequency: ${error.message}`);
        setMessageType("danger");
      }
    } else {
      setMessage("Invalid frequency. Must be a non-negative number.");
      setMessageType("danger");
    }
  };


  // Handler for adding pet-specific alerts
  const handleAddPetAlert = async () => {
    if (newAlert.trim() === "") {
      setMessage("Please enter an alert message.");
      setMessageType("danger");
      return;
    }
    const alertsRef = ref(db, `pets/${selectedPetId}/alerts`);
    try {
      await push(alertsRef, newAlert.trim());
      setMessage("Pet alert added successfully!");
      setMessageType("success");
      setNewAlert(""); // Clear input
    } catch (error) {
      console.error("Error adding pet alert:", error);
      setMessage(`Failed to add pet alert: ${error.message}`);
      setMessageType("danger");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-5 text-primary fw-bold">🐾 Pet Care System</h2>

      {/* Pet Selector Dropdown */}
      <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <label htmlFor="petSelector" className="form-label text-muted mb-1">
            Select Pet:
          </label>
          <select
            id="petSelector"
            className="form-select form-select-lg shadow-sm rounded-pill"
            value={selectedPetId || ''}
            onChange={(e) => setSelectedPetId(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            {!selectedPetId && <option value="">-- Select a Pet --</option>}
            {Object.entries(pets).map(([petId, pet]) => (
              <option key={petId} value={petId}>
                {pet.name} ({pet.type})
              </option>
            ))}
          </select>
        </div>
        {selectedPetId && <h1 className="fw-bold text-secondary mt-3 mt-md-0">{selectedPet.name}</h1>}
      </div>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {selectedPetId && (
        <div className="row g-4">
          {/* Current Pet Activity Card */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold">Current Pet Activity</h5>
                <p className="fs-5 mb-2">
                  <span className="me-2 text-muted">Pet Type:</span>{" "}
                  <span className="fw-bold text-dark">{selectedPet.type || 'N/A'}</span>
                </p>
                <p className="fs-5 mb-2">
                  <span className="me-2 text-muted">RFID Tag:</span>{" "}
                  <span className="fw-bold text-dark">{selectedPet.rfidTag || 'N/A'}</span>
                </p>
                <p className="fs-5 mb-2">
                  <span className="me-2 text-muted">Associated Room:</span>{" "}
                  <span className="fw-bold text-dark">{petActivity?.lastSeenLocation || 'N/A'}</span>
                </p>
                <p className="fs-5 mb-2">
                  <span className="me-2 text-muted">📶 RFID Detected:</span>{" "}
                  <span className={`fw-bold ${petActivity?.rfidDetected ? "text-success" : "text-danger"}`}>
                    {petActivity?.rfidDetected ? "Yes" : "No"}
                  </span>
                </p>
                <p className="fs-5 mb-0">
                  <span className="me-2 text-muted">🍲 Last Fed:</span>{" "}
                  <span className="fw-bold text-dark">
                    {petActivity?.lastFed ? new Date(petActivity.lastFed).toLocaleString() : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Food Feeder Control Card */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold">🍚 Food Feeder ({selectedPet.name})</h5>
                <div className="form-check form-switch form-check-lg mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="feederEnabledSwitch"
                    checked={feederSettings?.enabled || false}
                    onChange={() => toggleAutomationEnabled('feeder', feederSettings?.enabled)}
                  />
                  <label className="form-check-label ms-2 fs-5 fw-medium text-dark" htmlFor="feederEnabledSwitch">
                    Automation Enabled
                  </label>
                </div>
                <p className="fs-5 mb-2">
                  <span className="me-2 text-muted">Food Level:</span>{" "}
                  <span className={`fw-bold ${feederSettings?.foodLevel < (feederSettings?.refillThreshold || 20) ? "text-danger" : "text-success"}`}>
                    {feederSettings?.foodLevel || 0}%
                  </span>
                </p>
                <div className="mb-3">
                  <label htmlFor="portionSizeInput" className="form-label text-muted">Portion Size (units)</label>
                  <input
                    type="number"
                    className="form-control rounded-lg"
                    id="portionSizeInput"
                    value={feederSettings?.portionSize || 0}
                    onChange={handlePortionSizeChange}
                    min="0" // Allow 0 for no dispense
                    step="1"
                  />
                </div>

                {/* NEW: Daily Frequency Control for Feeder */}
                <div className="mb-3">
                  <label htmlFor="feederDailyFrequency" className="form-label text-muted">Feed Frequency:</label>
                  <select
                    id="feederDailyFrequency"
                    className="form-select rounded-lg"
                    value={feederSettings?.dailyFrequency || 0}
                    onChange={(e) => handleDailyFrequencyChange('feeder', e)}
                  >
                    {dailyFrequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted">
                    This determines how many times per day the feeder will activate if automation is enabled.
                  </small>
                </div>


                <button
                  className="btn btn-warning w-100 rounded-pill shadow-sm animate-pulse-on-hover mt-2"
                  onClick={() => handleManualTrigger('feeder')}
                >
                  <span className="me-2">🥄</span>Manual Feed
                </button>
                <p className="mt-2 text-muted small">Last Manual Feed: {feederSettings?.lastManualTrigger ? new Date(feederSettings.lastManualTrigger).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Water Dispenser Control Card */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold">💧 Water Dispenser ({selectedPet.name})</h5>
                <div className="form-check form-switch form-check-lg mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="waterDispenserEnabledSwitch"
                    checked={waterDispenserSettings?.enabled || false}
                    onChange={() => toggleAutomationEnabled('waterDispenser', waterDispenserSettings?.enabled)}
                  />
                  <label className="form-check-label ms-2 fs-5 fw-medium text-dark" htmlFor="waterDispenserEnabledSwitch">
                    Automation Enabled
                  </label>
                </div>
                <p className="fs-5 mb-2">
                  <span className="me-2 text-muted">Water Level:</span>{" "}
                  <span className={`fw-bold ${waterDispenserSettings?.waterLevel < (waterDispenserSettings?.refillThreshold || 20) ? "text-danger" : "text-success"}`}>
                    {waterDispenserSettings?.waterLevel || 0}%
                  </span>
                </p>

                {/* NEW: Daily Frequency Control for Water Dispenser */}
                <div className="mb-3">
                  <label htmlFor="waterDailyFrequency" className="form-label text-muted">Refill Frequency:</label>
                  <select
                    id="waterDailyFrequency"
                    className="form-select rounded-lg"
                    value={waterDispenserSettings?.dailyFrequency || 0}
                    onChange={(e) => handleDailyFrequencyChange('waterDispenser', e)}
                  >
                    {dailyFrequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted">
                    This determines how many times per day the water will be refilled if automation is enabled.
                  </small>
                </div>

                <button
                  className="btn btn-info w-100 rounded-pill shadow-sm animate-pulse-on-hover mt-2"
                  onClick={() => handleManualTrigger('waterDispenser')}
                >
                  <span className="me-2">💧</span>Manual Refill
                </button>
                <p className="mt-2 text-muted small">Last Manual Refill: {waterDispenserSettings?.lastManualTrigger ? new Date(waterDispenserSettings.lastManualTrigger).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Pet Reminders Card */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold">⏰ Pet Reminders ({selectedPet.name})</h5>
                <p className="fs-5 mb-0">
                  <span className="me-2 text-muted">💊 Medication:</span>{" "}
                  <span className="fw-bold text-dark">{selectedPet.reminders?.medication || 'No reminders set'}</span>
                </p>
                {/* Future: Add input to update pet reminders */}
              </div>
            </div>
          </div>

          {/* Pet Alerts Card */}
          <div className="col-md-6 col-lg-8">
            <div className="card h-100 shadow-lg rounded-xl border-0">
              <div className="card-body p-4">
                <h5 className="card-title text-danger mb-3 fw-bold">🚨 Pet Alerts ({selectedPet.name})</h5>
                {alerts && alerts.length > 0 ? (
                  <ul className="list-group list-group-flush border-0">
                    {alerts.map((alert, index) => (
                      <li key={index} className="list-group-item bg-transparent text-danger fw-medium border-0 py-1">
                        <span className="me-2">•</span> {alert}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted fs-5">🔔 No new alerts for {selectedPet.name}.</p>
                )}
                 <div className="input-group mt-3 shadow-sm rounded-lg overflow-hidden">
                  <input
                    type="text"
                    className="form-control border-0 px-3 py-2"
                    placeholder="Add new pet alert"
                    value={newAlert}
                    onChange={(e) => setNewAlert(e.target.value)}
                  />
                  <button
                    className="btn btn-danger fw-bold px-4"
                    type="button"
                    onClick={handleAddPetAlert}
                  >
                    Add Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetCare;
