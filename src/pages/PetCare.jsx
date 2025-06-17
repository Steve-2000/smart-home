import React, { useState, useEffect } from 'react';

import { db } from '../firebase.jsx'; // Changed to .js for common Firebase setups
import { ref, onValue, update, push } from 'firebase/database';

// Import a CSS file for custom styles and animations
import './PetCare.css'; // We'll create this file

const PetCare = () => {
const [pets, setPets] = useState([]); // Changed to array for easier mapping
const [selectedPetId, setSelectedPetId] = useState(null);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState(""); // 'success' or 'danger'
const [newAlert, setNewAlert] = useState(""); // State for new pet alert input

const [currentDistances, setCurrentDistances] = useState({});

// Common daily frequency options for automated feeder/water dispenser
const dailyFrequencyOptions = [
  { value: 0, label: "Disabled" },
  { value: 1, label: "1 time / day" },
  { value: 2, label: "2 times / day" },
  { value: 3, label: "3 times / day" },
  { value: 4, label: "4 times / day" },
  { value: 6, label: "6 times / day" },
  { value: 8, label: "8 times / day" },
];

useEffect(() => {
  const petsRef = ref(db, 'pets');
  const unsubscribe = onValue(petsRef, (snapshot) => {
	const data = snapshot.val();
	const loadedPets = [];
	const initialDistances = {}; // 

	if (data) {
	  for (const key in data) {
		loadedPets.push({
		  id: key,
		  ...data[key],
		  // Ensure these properties are initialized from Firebase or default to 0
		  foodContainerLength: data[key].foodContainerLength || 0,
		  waterContainerLength: data[key].waterContainerLength || 0,
		  currentFoodDistance: data[key].currentFoodDistance !== undefined ? data[key].currentFoodDistance : data[key].foodContainerLength || 0, // Default to full (distance 0) if not set
		  currentWaterDistance: data[key].currentWaterDistance !== undefined ? data[key].currentWaterDistance : data[key].waterContainerLength || 0, // Default to full (distance 0) if not set
		  petActivity: data[key].petActivity || {}, // Ensure petActivity exists
		  reminders: data[key].reminders || {}, // Ensure reminders exists
		  alerts: data[key].alerts || [], // Ensure alerts exists
		 
		  feederSettings: {
			  enabled: false,
			  lastManualTrigger: "",
			  portionSize: 50, // Default portion size if not set
			  dailyFrequency: 1, // Default daily frequency if not set
			  ...(data[key].feederSettings || {})
		  },
		  waterDispenserSettings: {
			  enabled: false,
			  lastManualTrigger: "",
			  refillThreshold: 20, // Default refill threshold if not set
			  dailyFrequency: 1, // Default daily frequency if not set
			  ...(data[key].waterDispenserSettings || {})
		  },
		});
	   
		initialDistances[key] = {
		  food: data[key].currentFoodDistance !== undefined ? data[key].currentFoodDistance : data[key].foodContainerLength || 0,
		  water: data[key].currentWaterDistance !== undefined ? data[key].currentWaterDistance : data[key].waterContainerLength || 0,
		};
	  }
	}
	setPets(loadedPets);
	setCurrentDistances(initialDistances);
	setLoading(false);

	// Set the first pet as selected by default if pets exist
	if (!selectedPetId && loadedPets.length > 0) {
	  setSelectedPetId(loadedPets[0].id);
	} else if (selectedPetId && !loadedPets.find(pet => pet.id === selectedPetId) && loadedPets.length > 0) {
  
	  setSelectedPetId(loadedPets[0].id);
	} else if (loadedPets.length === 0) {
	  setSelectedPetId(null);
	}
  }, (error) => {
	console.error("Error fetching pets data:", error);
	setMessage("Oops! Failed to load pet data. 😿");
	setMessageType("danger");
	setLoading(false);
  });

  return () => unsubscribe();
}, [selectedPetId]); // Added selectedPetId to dependencies to react to changes

// Function to calculate level percentage based on total length and current distance from sensor
// 0cm distance means full, totalLength means empty.
const calculateLevelPercentage = (totalLength, currentDistance) => {
  if (totalLength <= 0) return 0; // Avoid division by zero
  // The actual level of food/water is (totalLength - currentDistance)
  const actualLevel = Math.max(0, totalLength - currentDistance);
  return Math.min(100, (actualLevel / totalLength) * 100);
};

// Function to determine level category (Full, 75%, 50%, 25%, Empty)
const getLevelCategory = (percentage) => {
  if (percentage >= 95) return "Full";
  if (percentage >= 70) return "75% Full";
  if (percentage >= 45) return "50% Full";
  if (percentage >= 20) return "25% Full";
  if (percentage > 0) return "Low";
  return "Empty";
};


const getPortionSize = (totalLength) => {
  if (totalLength <= 0) return "N/A";
  return `${(totalLength / 4).toFixed(1)} cm (per 25% portion)`;
};

// Handle change in manual distance input for food/water
const handleDistanceChange = (petId, type, value) => {
  setCurrentDistances(prev => ({
	...prev,
	[petId]: {
	  ...prev[petId],
	  [type]: parseFloat(value) || 0, // Ensure it's a number
	}
  }));
};


const handleUpdatePetData = async (petId, type) => {
  const distanceValue = currentDistances[petId]?.[type];
  const pet = pets.find(p => p.id === petId);
  const totalLength = type === 'food' ? pet.foodContainerLength : pet.waterContainerLength;

  if (distanceValue === undefined || isNaN(distanceValue)) {
	  setMessage(`Woops! Please enter a valid number for ${type} distance. 🐾`);
	  setMessageType("danger");
	  return;
  }

  if (distanceValue < 0) {
	  setMessage(`Hold on! ${type} distance cannot be negative. 🙅‍♀️`);
	  setMessageType("danger");
	  return;
  }

  const updates = {};
  const now = new Date().toISOString();
  if (type === 'food') {
	updates.currentFoodDistance = distanceValue;
	// Also update the foodLevel in feederSettings based on this new distance
	updates['feederSettings/foodLevel'] = calculateLevelPercentage(totalLength, distanceValue);
	// Simulate refilling when distance is 0 (container is full)
	if (distanceValue === 0) updates['petActivity/lastFed'] = now;
  } else { // type === 'water'
	updates.currentWaterDistance = distanceValue;
	// Also update the waterLevel in waterDispenserSettings based on this new distance
	updates['waterDispenserSettings/waterLevel'] = calculateLevelPercentage(totalLength, distanceValue);
	// Simulate refilling when distance is 0 (container is full)
	if (distanceValue === 0) updates['petActivity/lastWatered'] = now;
  }

  try {
	// Use a multi-path update for efficiency if updating multiple fields for the same pet
	await update(ref(db, `pets/${petId}`), {
		  ...updates,
		  // The lastManualTrigger for feeder/waterDispenser will be handled by the specific manual trigger buttons
		  // For general level updates from distance, we don't necessarily update lastManualTrigger here.
		  // This prevents it from updating every time the distance input changes.
	  });
	setMessage(`Yay! ${pet.name}'s ${type} level updated successfully! ✨`);
	setMessageType("success");
  } catch (error) {
	console.error(`Error updating ${pet.name}'s ${type} level:`, error);
	setMessage(`Oh no! Failed to update ${pet.name}'s ${type} level: ${error.message} 🥺`);
	setMessageType("danger");
  }
};

// Handler to toggle feeder/water dispenser automation enabled state
const toggleAutomationEnabled = async (petId, deviceType, currentEnabledState) => {
  try {
	await update(ref(db, `pets/${petId}/${deviceType}Settings`), {
	  enabled: !currentEnabledState,
	});
	setMessage(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} automation ${!currentEnabledState ? 'enabled' : 'disabled'}! ${!currentEnabledState ? '✅' : '❌'}`);
	setMessageType("success");
  } catch (error) {
	console.error(`Error toggling ${deviceType}:`, error);
	setMessage(`Uh oh! Failed to toggle ${deviceType} automation: ${error.message} 😟`);
	setMessageType("danger");
  }
};

// Handler for manual feed/refill trigger (updates current distance to simulate full/emptying)
const handleManualTrigger = async (petId, deviceType) => {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;

  const now = new Date().toISOString();
  const updates = {};
  let msg = "";

  if (deviceType === "feeder") {
	// For manual feed, we simulate a small amount dispensed
	const currentFoodDistance = pet.currentFoodDistance || 0;
	// The portionSize is already treated as a percentage (0-100), so divide by 100
	const portionSizeCm = (feederSettings.portionSize / 100) * pet.foodContainerLength; 
	const newFoodDistance = Math.min(pet.foodContainerLength, currentFoodDistance + portionSizeCm); // Increase distance (decrease food)
	updates.currentFoodDistance = newFoodDistance;
	updates['feederSettings/foodLevel'] = calculateLevelPercentage(pet.foodContainerLength, newFoodDistance); // Update level based on new distance
	updates['petActivity/lastFed'] = now; // Update lastFed timestamp directly
	msg = `Nom nom nom! Manual feed triggered for ${pet.name}! Food level: ${updates['feederSettings/foodLevel'].toFixed(1)}% 🍖`;
  } else if (deviceType === "waterDispenser") {
	// Simulate refilling: set water to full (distance 0)
	updates.currentWaterDistance = 0; // Set distance to 0 (full)
	updates['waterDispenserSettings/waterLevel'] = 100; // Set percentage to 100
	updates['petActivity/lastWatered'] = now;
	msg = `Ahhh, refreshing! Manual water refill triggered for ${pet.name}! Water level: 100% 💧`;
  }

  try {
	  await update(ref(db, `pets/${petId}`), {
		  ...updates,
		  [`${deviceType}Settings/lastManualTrigger`]: now // Update general manual trigger time
	  });
	  setMessage(msg);
	  setMessageType("success");
  } catch (error) {
	  console.error(`Error triggering manual ${deviceType}:`, error);
	  setMessage(`Oopsie! Failed to manually trigger ${deviceType}: ${error.message} 😓`);
	  setMessageType("danger");
  }
};


// Handler for setting portion size (only for feeder)
const handlePortionSizeChange = async (petId, e) => {
  const newPortion = parseInt(e.target.value, 10);
  if (!isNaN(newPortion) && newPortion >= 0 && newPortion <= 100) { // Assuming portion size is a percentage 0-100
	try {
	  await update(ref(db, `pets/${petId}/feederSettings`), {
		portionSize: newPortion,
	  });
	  setMessage("Feeder portion size updated! Yum! 🍽️");
	  setMessageType("success");
	} catch (error) {
	  console.error("Error updating portion size:", error);
	  setMessage(`Couldn't update portion size: ${error.message} 😥`);
	  setMessageType("danger");
	}
  } else {
	setMessage("Invalid portion size. Must be a number between 0 and 100 (percentage). 📏");
	setMessageType("danger");
  }
};

// Handler for setting daily frequency
const handleDailyFrequencyChange = async (petId, deviceType, e) => {
  const newFrequency = parseInt(e.target.value, 10);
  if (!isNaN(newFrequency) && newFrequency >= 0) {
	try {
	  await update(ref(db, `pets/${petId}/${deviceType}Settings`), {
		dailyFrequency: newFrequency,
	  });
	  setMessage(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} daily frequency updated to ${newFrequency} times. 🗓️`);
	  setMessageType("success");
	} catch (error) {
	  console.error(`Error updating ${deviceType} daily frequency:`, error);
	  setMessage(`Failed to update ${deviceType} daily frequency: ${error.message} 😞`);
	  setMessageType("danger");
  }
  } else {
	setMessage("Invalid frequency. Must be a non-negative number. 🔢");
	setMessageType("danger");
  }
};

// Handler for setting water refill threshold (only for water dispenser)
const handleRefillThresholdChange = async (petId, e) => {
  const newThreshold = parseInt(e.target.value, 10);
  if (!isNaN(newThreshold) && newThreshold >= 0 && newThreshold <= 100) {
	  try {
		  await update(ref(db, `pets/${petId}/waterDispenserSettings`), {
			  refillThreshold: newThreshold,
		  });
		  setMessage("Water refill threshold updated! Keep hydated! 💧");
		  setMessageType("success");
	  } catch (error) {
		  console.error("Error updating refill threshold:", error);
		  setMessage(`Oops! Failed to update refill threshold: ${error.message} 😥`);
		  setMessageType("danger");
	  }
  } else {
	  setMessage("Invalid threshold. Must be a number between 0 and 100. 💧");
	  setMessageType("danger");
  }
};

// Handler for adding pet-specific alerts
const handleAddPetAlert = async () => {
  if (newAlert.trim() === "") {
	setMessage("Woof! Please enter an alert message. 🐶");
	setMessageType("danger");
	return;
  }
  const alertsRef = ref(db, `pets/${selectedPetId}/alerts`);
  try {
	// Firebase push adds a new unique child node
	await push(alertsRef, newAlert.trim());
	setMessage("New pet alert added! Stay vigilant! 📢");
	setMessageType("success");
	setNewAlert(""); // Clear input
  } catch (error) {
	console.error("Error adding pet alert:", error);
	setMessage(`Bark! Failed to add pet alert: ${error.message} 😔`);
	setMessageType("danger");
  }
};


if (loading) {
  return <div className="text-center p-5 text-muted cute-loading">Paws-itively loading pet data... 🐾</div>;
}

if (pets.length === 0) {
  return (
	<div className="text-center p-5 cute-no-pets">
	  <h3 className="text-muted">No furry friends added yet! 😿</h3>
	  <p className="text-muted">Hop over to the "Add Pet" link in the sidebar to get started! 💖</p>
	</div>
  );
}

const selectedPet = pets.find(pet => pet.id === selectedPetId); // Find the selected pet from the array

if (!selectedPet) {
	// This state should ideally not be reached if initial selection logic is robust,
	// but acts as a safeguard if selectedPetId is set to a non-existent ID.
	return <div className="text-center p-5 text-muted cute-no-pet-selected">Oops! No pet selected or pet not found. Choose a buddy! 🐶🐱</div>;
}

// Get feeder and water dispenser settings from the selected pet
const feederSettings = selectedPet.feederSettings || {};
const waterDispenserSettings = selectedPet.waterDispenserSettings || {};

// Calculate percentages for the selected pet based on current distance (manual input)
const foodPercentage = calculateLevelPercentage(selectedPet.foodContainerLength, selectedPet.currentFoodDistance);
const waterPercentage = calculateLevelPercentage(selectedPet.waterContainerLength, selectedPet.currentWaterDistance);


return (
  <div className="container mt-4 pet-care-container">
	<h2 className="mb-5 text-primary fw-bold text-center cute-heading">🐾 Pet Care Paradise! 🏡</h2>

	{/* Pet Selector Dropdown */}
	<div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-center animate__animated animate__fadeInDown">
	  <div>
		<label htmlFor="petSelector" className="form-label text-muted mb-1 cute-label">
		  Pick your Pawsome Pal:
		</label>
		<select
		  id="petSelector"
		  className="form-select form-select-lg shadow-sm rounded-pill cute-select"
		  value={selectedPetId || ''}
		  onChange={(e) => setSelectedPetId(e.target.value)}
		  style={{ maxWidth: '300px' }}
          >
            {!selectedPetId && <option value="">-- Choose a Pet! 💖 --</option>}
            {pets.map((pet) => ( // Map over the pets array
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.type === 'Dog' ? '🐶 Dog' : pet.type === 'Cat' ? '🐱 Cat' : '🐾 Other'})
              </option>
            ))}
          </select>
        </div>
        {selectedPetId && <h1 className="fw-bold text-secondary mt-3 mt-md-0 cute-pet-name animate__animated animate__heartBeat">{selectedPet.name} ✨</h1>}
      </div>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4 animate__animated animate__fadeIn cute-alert`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {selectedPetId && (
        <div className="row g-4 animate__animated animate__fadeInUp">
          {/* Current Pet Activity Card */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0 cute-card">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold cute-card-title">Current Pet Activity 🐾</h5>
                <p className="fs-5 mb-2 cute-text">
                  <span className="me-2 text-muted">Pet Type:</span>{" "}
                  <span className="fw-bold text-dark">{selectedPet.type || 'N/A'}</span>
                </p>
                <p className="fs-5 mb-2 cute-text">
                  <span className="me-2 text-muted">RFID Detected:</span>{" "}
                  <span className={`fw-bold ${selectedPet.petActivity?.rfidDetected ? "text-success" : "text-danger"}`}>
                    {selectedPet.petActivity?.rfidDetected ? "Yep! Present! 🥳" : "Nope! Where are they? 🧐"}
                  </span>
                </p>
                <p className="fs-5 mb-0 cute-text">
                  <span className="me-2 text-muted">🍲 Last Fed:</span>{" "}
                  <span className="fw-bold text-dark">
                    {selectedPet.petActivity?.lastFed ? new Date(selectedPet.petActivity.lastFed).toLocaleString() : 'Not yet! 😔'}
                  </span>
                </p>
                <p className="fs-5 mt-2 cute-text">
                  <span className="me-2 text-muted">💧 Last Watered:</span>{" "}
                  <span className="fw-bold text-dark">
                    {selectedPet.petActivity?.lastWatered ? new Date(selectedPet.petActivity.lastWatered).toLocaleString() : 'Still thirsty? 💧'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Food Level, Manual Input, and Feeder Control */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0 cute-card">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold cute-card-title">🍚 Food Feeder ({selectedPet.name})</h5>
                {/* Manual Distance Input */}
                <div className="mb-3">
                  <label htmlFor={`foodDistance-${selectedPet.id}`} className="form-label text-muted small mb-1 cute-label">
                    Food Sensor Reading (cm):
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control rounded-start-lg shadow-sm cute-input"
                      id={`foodDistance-${selectedPet.id}`}
                      value={currentDistances[selectedPet.id]?.food}
                      onChange={(e) => handleDistanceChange(selectedPet.id, 'food', e.target.value)}
                      placeholder="e.g., 5"
                    />
                    <button
                      className="btn btn-outline-primary rounded-end-lg shadow-sm cute-btn animate__animated animate__pulse"
                      type="button"
                      onClick={() => handleUpdatePetData(selectedPet.id, 'food')}
                      title="Update Food Distance"
                    >
                      Update 🔄
                    </button>
                  </div>
                  <small className="form-text text-muted cute-small-text">
                      Closer to 0cm means a full tummy! 🍖
                  </small>
                </div>
                {/* Level Display */}
                <p className="mb-1 cute-text">
                  <span className="fw-bold">Current Food Level: </span>
                  <span className={`fw-bold ${foodPercentage <= 25 ? 'text-danger' : foodPercentage <= 50 ? 'text-warning' : 'text-success'}`}>
                    {getLevelCategory(foodPercentage)} ({foodPercentage.toFixed(1)}%) {foodPercentage <= 25 ? '🚨' : '🟢'}
                  </span>
                </p>
                <p className="mb-1 text-muted small cute-small-text">Total Container Length: {selectedPet.foodContainerLength} cm</p>
                <p className="mb-3 text-muted small cute-small-text">Estimated Portion Size: {getPortionSize(selectedPet.foodContainerLength)}</p>

                <hr className="my-3 cute-divider"/> {/* Separator for automation controls */}

                {/* Feeder Automation Controls */}
                <div className="form-check form-switch form-check-lg mb-3 cute-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="feederEnabledSwitch"
                    checked={feederSettings?.enabled || false}
                    onChange={() => toggleAutomationEnabled(selectedPet.id, 'feeder', feederSettings?.enabled)}
                  />
                  <label className="form-check-label ms-2 fs-5 fw-medium text-dark" htmlFor="feederEnabledSwitch">
                    Automation Enabled {feederSettings?.enabled ? '✅' : '❌'}
                  </label>
                </div>
                {/* Portion Size with Number Input */}
                <div className="mb-3">
                  <label htmlFor="portionSizeInput" className="form-label text-muted cute-label">Meal Size (%) 🍽️</label>
                  <input
                    type="number"
                    className="form-control rounded-lg cute-input"
                    id="portionSizeInput"
                    value={feederSettings?.portionSize || 0}
                    onChange={(e) => handlePortionSizeChange(selectedPet.id, e)}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <small className="form-text text-muted cute-small-text">
                      How much yummy food per serving! 😋
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="feederDailyFrequency" className="form-label text-muted cute-label">Feed Times Daily: ⏰</label>
                  <select
                    id="feederDailyFrequency"
                    className="form-select rounded-lg cute-select"
                    value={feederSettings?.dailyFrequency || 0}
                    onChange={(e) => handleDailyFrequencyChange(selectedPet.id, 'feeder', e)}
                  >
                    {dailyFrequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted cute-small-text">
                      How often your pet gets fed automatically! 🗓️
                  </small>
                </div>
                <button
                  className="btn btn-warning w-100 rounded-pill shadow-sm cute-btn-manual animate-pulse-on-hover mt-2"
                  onClick={() => handleManualTrigger(selectedPet.id, 'feeder')}
                >
                  <span className="me-2">🥄</span>Give a Treat!
                </button>
                <p className="mt-2 text-muted small cute-small-text">Last Treat Time: {feederSettings?.lastManualTrigger ? new Date(feederSettings.lastManualTrigger).toLocaleString() : 'Never! 😿'}</p>
              </div>
              </div>
          </div>

          {/* Water Level, Manual Input, and Water Dispenser Control */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0 cute-card">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold cute-card-title">💧 Water Dispenser ({selectedPet.name})</h5>
                {/* Manual Distance Input */}
                <div className="mb-3">
                  <label htmlFor={`waterDistance-${selectedPet.id}`} className="form-label text-muted small mb-1 cute-label">
                    Water Sensor Reading (cm):
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control rounded-start-lg shadow-sm cute-input"
                      id={`waterDistance-${selectedPet.id}`}
                      value={currentDistances[selectedPet.id]?.water}
                      onChange={(e) => handleDistanceChange(selectedPet.id, 'water', e.target.value)}
                      placeholder="e.g., 2"
                    />
                    <button
                      className="btn btn-outline-primary rounded-end-lg shadow-sm cute-btn animate__animated animate__pulse"
                      type="button"
                      onClick={() => handleUpdatePetData(selectedPet.id, 'water')}
                      title="Update Water Distance"
                    >
                      Update 🔄
                    </button>
                  </div>
                  <small className="form-text text-muted cute-small-text">
                      Closer to 0cm means a full water bowl! 💧
                  </small>
                </div>
                {/* Level Display */}
                <p className="mb-1 cute-text">
                  <span className="fw-bold">Current Water Level: </span>
                  <span className={`fw-bold ${waterPercentage <= 25 ? 'text-danger' : waterPercentage <= 50 ? 'text-warning' : 'text-success'}`}>
                    {getLevelCategory(waterPercentage)} ({waterPercentage.toFixed(1)}%) {waterPercentage <= 25 ? '🚨' : '🟢'}
                  </span>
                </p>
                <p className="mb-1 text-muted small cute-small-text">Total Container Length: {selectedPet.waterContainerLength} cm</p>
                <p className="mb-3 text-muted small cute-small-text">Estimated Portion Size: {getPortionSize(selectedPet.waterContainerLength)}</p>

                <hr className="my-3 cute-divider"/> {/* Separator for automation controls */}

                {/* Water Dispenser Automation Controls */}
                <div className="form-check form-switch form-check-lg mb-3 cute-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="waterDispenserEnabledSwitch"
                    checked={waterDispenserSettings?.enabled || false}
                    onChange={() => toggleAutomationEnabled(selectedPet.id, 'waterDispenser', waterDispenserSettings?.enabled)}
                  />
                  <label className="form-check-label ms-2 fs-5 fw-medium text-dark" htmlFor="waterDispenserEnabledSwitch">
                    Automation Enabled {waterDispenserSettings?.enabled ? '✅' : '❌'}
                  </label>
                </div>
                <div className="mb-3">
                  <label htmlFor="refillThresholdInput" className="form-label text-muted cute-label">Refill When Below (%) 💧</label>
                  <input
                    type="number"
                    className="form-control rounded-lg cute-input"
                    id="refillThresholdInput"
                    value={waterDispenserSettings?.refillThreshold || 0}
                    onChange={(e) => handleRefillThresholdChange(selectedPet.id, e)}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <small className="form-text text-muted cute-small-text">
                      Auto-refill if water level drops this low! 📉
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="waterDailyFrequency" className="form-label text-muted cute-label">Refill Times Daily: 🗓️</label>
                  <select
                    id="waterDailyFrequency"
                    className="form-select rounded-lg cute-select"
                    value={waterDispenserSettings?.dailyFrequency || 0}
                    onChange={(e) => handleDailyFrequencyChange(selectedPet.id, 'waterDispenser', e)}
                  >
                    {dailyFrequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted cute-small-text">
                      How often your pet's water bowl gets topped up! 💧
                  </small>
                </div>
                <button
                  className="btn btn-info w-100 rounded-pill shadow-sm cute-btn-manual animate-pulse-on-hover mt-2"
                  onClick={() => handleManualTrigger(selectedPet.id, 'waterDispenser')}
                >
                  <span className="me-2">💧</span>Fill Water Bowl!
                </button>
                <p className="mt-2 text-muted small cute-small-text">Last Water Top-up: {waterDispenserSettings?.lastManualTrigger ? new Date(waterDispenserSettings.lastManualTrigger).toLocaleString() : 'Never! 😔'}</p>
              </div>
            </div>
          </div>

          {/* Pet Reminders Card (kept as is) */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-lg rounded-xl border-0 cute-card">
              <div className="card-body p-4">
                <h5 className="card-title text-primary mb-3 fw-bold cute-card-title">⏰ Pet Reminders ({selectedPet.name})</h5>
                <p className="fs-5 mb-0 cute-text">
                  <span className="me-2 text-muted">💊 Medication:</span>{" "}
                  <span className="fw-bold text-dark">{selectedPet.reminders?.medication || 'No reminders set. All good! 👍'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Pet Alerts Card (kept as is) */}
          <div className="col-md-6 col-lg-8">
            <div className="card h-100 shadow-lg rounded-xl border-0 cute-card">
              <div className="card-body p-4">
                <h5 className="card-title text-danger mb-3 fw-bold cute-card-title">🚨 Pet Alerts ({selectedPet.name})</h5>
                {selectedPet.alerts && selectedPet.alerts.length > 0 ? (
                  <ul className="list-group list-group-flush border-0">
                    {selectedPet.alerts.map((alert, index) => (
                      <li key={index} className="list-group-item bg-transparent text-danger fw-medium border-0 py-1 cute-alert-item animate__animated animate__headShake">
                        <span className="me-2">⚠️</span> {alert}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted fs-5 cute-text">🔔 No new alerts for {selectedPet.name}. All clear! ✨</p>
                )}
                <div className="input-group mt-3 shadow-sm rounded-lg overflow-hidden cute-input-group">
                  <input
                    type="text"
                    className="form-control border-0 px-3 py-2 cute-input"
                    placeholder="Add a new warning or reminder!"
                    value={newAlert}
                    onChange={(e) => setNewAlert(e.target.value)}
                  />
                  <button
                    className="btn btn-danger fw-bold px-4 cute-btn-add-alert"
                    type="button"
                    onClick={handleAddPetAlert}
                  >
                    Add Alert! ➕
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