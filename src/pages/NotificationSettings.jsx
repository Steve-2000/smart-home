// src/pages/NotificationSettings.jsx
import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
//
// The error "Could not resolve '../firebase.js'" means that the build system
// cannot find your 'firebase.js' file at the specified location,
// RELATIVE TO THIS 'NotificationSettings.jsx' FILE.
//
// Let's assume 'NotificationSettings.jsx' is located in 'src/pages/'.
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
// Scenario 3: 'firebase.js' is in the SAME directory as 'NotificationSettings.jsx'.
//   Example: 'src/pages/firebase.js' (Less common, but possible)
//   You would need to change the import path to: `./firebase.js`
//   (Look in the current directory for 'firebase.js').
//
// PLEASE DOUBLE-CHECK YOUR PROJECT'S ACTUAL FOLDER STRUCTURE FOR 'firebase.js'
// AND ADJUST THE IMPORT STATEMENT BELOW IF NECESSARY.
//
import { db } from "../firebase.jsx";
import { ref, onValue, update } from "firebase/database";
import { getAuth } from "firebase/auth"; // To get current user UID

const NotificationSettings = () => {
  const [userId, setUserId] = useState(null);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("00:00"); // Default midnight
  const [scheduleEndTime, setScheduleEndTime] = useState("05:00");   // Default 5 AM
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        // Once userId is available, fetch settings
        const settingsRef = ref(db, `users/${user.uid}/notificationSettings`);
        const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
          const settings = snapshot.val() || {};
          setEmailAlertsEnabled(settings.emailAlertsEnabled || false);
          setAlertEmail(settings.alertEmail || "");
          setScheduleStartTime(settings.scheduleStartTime || "00:00");
          setScheduleEndTime(settings.scheduleEndTime || "05:00");
          setLoading(false);
        });
        return () => unsubscribeSettings();
      } else {
        setUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage("You must be logged in to save settings.");
      setMessageType("danger");
      return;
    }

    if (emailAlertsEnabled && alertEmail.trim() === "") {
      setMessage("Email is required if email alerts are enabled.");
      setMessageType("danger");
      return;
    }

    try {
      await update(ref(db, `users/${userId}/notificationSettings`), {
        emailAlertsEnabled,
        alertEmail: alertEmail.trim(),
        scheduleStartTime,
        scheduleEndTime,
      });
      setMessage("Notification settings saved successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setMessage(`Failed to save settings: ${error.message}`);
      setMessageType("danger");
    }
  };

  if (loading) {
    return <div className="text-center p-5 text-muted">Loading notification settings...</div>;
  }

  if (!userId) {
    return <div className="text-center p-5 text-danger">Please log in to manage notification settings.</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-5 text-primary fw-bold">🔔 Notification Settings</h2>
      <div className="card shadow-lg rounded-xl p-4">
        <form onSubmit={handleSaveSettings}>
          {message && (
            <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
              {message}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          )}

          <div className="mb-4">
            <h5 className="text-secondary mb-3">Email Alerts for Door Activity (Midnight Only)</h5>
            <div className="form-check form-switch form-check-lg mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="emailAlertsEnabledSwitch"
                checked={emailAlertsEnabled}
                onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
              />
              <label className="form-check-label ms-2 fs-5 fw-medium text-dark" htmlFor="emailAlertsEnabledSwitch">
                Enable Email Alerts
              </label>
            </div>
            <p className="text-muted small">
              When enabled, you will receive email alerts about door open events *only* during the scheduled time window below.
              Door open events will always appear on the website regardless of this setting.
            </p>
          </div>

          {emailAlertsEnabled && (
            <>
              <div className="mb-3">
                <label htmlFor="alertEmailInput" className="form-label text-muted">Alert Email Address</label>
                <input
                  type="email"
                  className="form-control rounded-lg shadow-sm"
                  id="alertEmailInput"
                  placeholder="your-email@example.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  required={emailAlertsEnabled}
                />
                <small className="form-text text-muted">Emails will be sent to this address.</small>
              </div>

              <div className="mb-4">
                <h5 className="text-secondary mb-3">Email Alert Schedule (Midnight Window)</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="scheduleStartTime" className="form-label text-muted">Start Time</label>
                    <input
                      type="time"
                      className="form-control rounded-lg shadow-sm"
                      id="scheduleStartTime"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="scheduleEndTime" className="form-label text-muted">End Time</label>
                    <input
                      type="time"
                      className="form-control rounded-lg shadow-sm"
                      id="scheduleEndTime"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <small className="form-text text-muted">
                  Email alerts will only be sent if a door event occurs within this daily time range.
                </small>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm animate-pulse-on-hover">
            Save Notification Settings
          </button>
        </form>
      </div>

      <div className="alert alert-info mt-5" role="alert">
        <strong>Important:</strong> Actual email sending requires a backend service (e.g., Firebase Cloud Functions, Node.js server)
        that can monitor door status changes and send emails based on the schedule configured here. This web application
        only stores your preferences.
      </div>
    </div>
  );
};

export default NotificationSettings;
