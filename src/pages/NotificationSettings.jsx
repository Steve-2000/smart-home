import React, { useState, useEffect } from "react";
// >>> IMPORTANT: PLEASE CAREFULLY VERIFY THIS FIREBASE.JS FILE PATH <<<
import { db } from "../firebase.jsx";
import { ref, onValue, update } from "firebase/database";
import { getAuth } from "firebase/auth"; // To get current user UID

import './notification.css'; // Link to our dedicated CSS file

const NotificationSettings = () => {
  const [userId, setUserId] = useState(null);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("00:00"); // Default midnight
  const [scheduleEndTime, setScheduleEndTime] = useState("05:00");   // Default 5 AM
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'danger'

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
      setMessage("Oops! You need to be logged in to save your notification preferences. 🙁");
      setMessageType("danger");
      return;
    }

    if (emailAlertsEnabled && alertEmail.trim() === "") {
      setMessage("Aha! If email alerts are enabled, a valid email address is needed. 📧");
      setMessageType("danger");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailAlertsEnabled && !emailRegex.test(alertEmail.trim())) {
      setMessage("Please enter a valid email address. 📩");
      setMessageType("danger");
      return;
    }

    try {
      await update(ref(db, `users/${userId}/notificationSettings`), {
        emailAlertsEnabled,
        alertEmail: emailAlertsEnabled ? alertEmail.trim() : "", // Clear email if alerts disabled
        scheduleStartTime,
        scheduleEndTime,
      });
      setMessage("Great! Your notification settings have been saved successfully! ✅");
      setMessageType("success");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setMessage(`Oh dear! Failed to save settings: ${error.message} 🚫`);
      setMessageType("danger");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5 text-gray-500 text-xl font-medium">
        Loading your notification settings... ✨
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center p-5 text-red-600 text-xl font-bold">
        Please log in to manage your notification settings. 🔒
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 mt-8 lg:mt-12 mb-10 notification-page-container animate__animated animate__fadeIn">
      <h2 className="text-4xl lg:text-5xl font-bold text-blue-600 mb-8 text-center tracking-wide notification-main-heading">
        🔔 Your Alert Preferences 🔔
      </h2>

      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 notification-card">
        <form onSubmit={handleSaveSettings}>
          {message && (
            <div
              className={`p-4 mb-6 rounded-xl text-center font-medium shadow-md transition-opacity duration-300
                ${messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}
                notification-alert
              `}
              role="alert"
            >
              {message}
              <button
                type="button"
                className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setMessage('')} // Manually clear message
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          )}

          <div className="mb-8">
            <h5 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-200 text-center notification-sub-heading">
              Email Alerts for Door Activity 🚪
            </h5>
            <div className="flex items-center mb-3 justify-center md:justify-start"> {/* Centered switch */}
              <label htmlFor="emailAlertsEnabledSwitch" className="notification-switch-label">
                <input
                  type="checkbox"
                  id="emailAlertsEnabledSwitch"
                  className="notification-switch-input"
                  checked={emailAlertsEnabled}
                  onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                />
                <span className="notification-switch-slider"></span>
                <span className="ml-3 text-lg font-medium text-gray-800 notification-switch-text">
                  Enable Email Alerts {emailAlertsEnabled ? '✅' : '❌'}
                </span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center md:text-left">
              Get email alerts for door open events! You'll only receive these during the specified schedule below.
              All door events are always visible on your dashboard. 🔔
            </p>
          </div>

          {emailAlertsEnabled && (
            <>
              <div className="mb-6">
                <label htmlFor="alertEmailInput" className="block text-gray-700 text-base font-semibold mb-2 notification-label">
                  Recipient Email Address 📧
                </label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-xl shadow-sm notification-input"
                  id="alertEmailInput"
                  placeholder="your-email@example.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  required={emailAlertsEnabled}
                />
                <small className="text-sm text-gray-500 mt-1 block notification-small-text">
                  Alerts will be sent to this email. Make sure it's correct! ✔️
                </small>
              </div>

              <div className="mb-8">
                <h5 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-200 text-center notification-sub-heading">
                  Alert Schedule (Your Quiet Hours) 🌙
                </h5>
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="flex-1">
                    <label htmlFor="scheduleStartTime" className="block text-gray-700 text-base font-semibold mb-2 notification-label">
                      Start Time ⏰
                    </label>
                    <input
                      type="time"
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm notification-input"
                      id="scheduleStartTime"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="scheduleEndTime" className="block text-gray-700 text-base font-semibold mb-2 notification-label">
                      End Time 🕰️
                    </label>
                    <input
                      type="time"
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm notification-input"
                      id="scheduleEndTime"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <small className="text-sm text-gray-500 mt-2 block notification-small-text">
                  Email alerts are only sent if a door event happens within this time window. Perfect for security at night! 🤫
                </small>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 mt-8 notification-save-btn animate-pulse-on-hover"
          >
            Save My Notification Preferences! 🎉
          </button>
        </form>
      </div>

      <div className="bg-blue-100 border border-blue-200 text-blue-800 p-4 rounded-xl shadow-md mt-10 text-sm italic font-light notification-info-box">
        <strong>Heads Up! 💡</strong> While this app helps you configure your notification preferences,
        the actual magic of sending emails (like "Door Opened!" alerts) happens via a separate backend service.
        This usually involves a server (e.g., using Firebase Cloud Functions or a Node.js server) that
        monitors your smart home's data and dispatches emails based on these settings. This web app
        is your friendly control panel for those backend rules!
      </div>
    </div>
  );
};

export default NotificationSettings;
