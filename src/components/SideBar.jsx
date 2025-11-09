// src/components/SideBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './sidebar.css';

const SideBar = () => {
  const location = useLocation();

  const navLinks = [
    { to: "/home/dashboard", icon: "🏠", text: "Dashboard" },
    { to: "/home/homeoverview", icon: "📊", text: "Overview" },
    { to: "/home/devices", icon: "💡", text: "Devices" },
    { to: "/home/addroom", icon: "➕", text: "Add Room" },
    { to: "/home/updateroomdata", icon: "⚙️", text: "Manage Rooms" },
    { to: "/home/pets", icon: "🐾", text: "Pet Care" },
    { to: "/home/addpet", icon: "➕", text: "Add Pet" },
    { to: "/home/laserbeam", icon: "🚨", text: "Laser Boundary" },
    { to: "/home/notification-settings", icon: "🔔", text: "Notifications" },
    { to: "/home/HealthTips", icon: "💡", text: "Health Tips" },
  ];

  return (
    <div className="sidebar-root bg-sidebar d-flex flex-column">
      <h4 className="text-center mb-4 mt-3 text-primary fw-bold">Smart Home</h4>
      <hr className="sidebar-divider mb-3" />
      <ul className="nav flex-column flex-grow-1 sidebar-nav">
        {navLinks.map((link, index) => (
          <li className="nav-item mb-2" key={index}>
            <Link
              to={link.to}
              className={`nav-link d-flex align-items-center rounded py-2 ${location.pathname === link.to ? 'active-sidebar-link' : 'text-dark'}`}
            >
              <span className="me-3 fs-5">{link.icon}</span>
              <span className="fw-medium">{link.text}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3 sidebar-logout">
        <Link to="/logout" className="btn btn-outline-danger w-100 py-2 rounded-pill">🚪 Logout</Link>
      </div>
    </div>
  );
};

export default SideBar;
