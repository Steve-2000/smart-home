// src/pages/Environment.jsx
import React from 'react';

const Environment = () => {
  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary fw-bold">🍃 Environment Settings</h2>
      <div className="card shadow-lg rounded-xl p-4">
        <p className="text-muted">This section allows you to view and adjust environmental parameters such as temperature, humidity, and air quality.</p>
        <p className="text-muted">Current sensor data is available on the Dashboard.</p>
      </div>
    </div>
  );
};

export default Environment;
