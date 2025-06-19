// src/components/SideBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation for active link styling
import './sidebar.css'; // Make sure this CSS file exists for custom styles

const SideBar = () => {
  const location = useLocation(); // Hook to get current URL path

  const navLinks = [
    { to: "/dashboard", icon: "🏠", text: "Dashboard" },
    { to: "/homeoverview", icon: "📊", text: "Overview" },
    { to: "/devices", icon: "💡", text: "Devices" },
    { to: "/addroom", icon: "➕", text: "Add Room" },
    { to: "/updateroomdata", icon: "⚙️", text: "Manage Rooms" },
    { to: "/pets", icon: "🐾", text: "Pet Care" },
    { to: "/addpet", icon: "➕", text: "Add Pet" },
    { to: "/laserbeam", icon: "🚨", text: "Laser Boundary" },
    { to: "/notification-settings", icon: "🔔", text: "Notifications" },
  ];

  return (
    <div className="d-flex flex-column h-100"> {/* Flex column to push logout to bottom */}
      <h4 className="text-center mb-4 mt-3 text-primary fw-bold">Smart Home Application</h4>
      <hr className="sidebar-divider mb-4" /> {/* A subtle divider */}
      
      <ul className="nav flex-column flex-grow-1"> {/* flex-grow-1 makes this list take available space */}
        {navLinks.map((link, index) => (
          <li className="nav-item mb-2" key={index}>
            <Link 
              to={link.to} 
              className={`nav-link d-flex align-items-center rounded py-2 ${location.pathname === link.to ? 'active-sidebar-link' : 'text-dark'}`}
            >
              <span className="me-3 fs-5">{link.icon}</span> {/* Icon with margin */}
              <span className="fw-medium">{link.text}</span> {/* Text with medium font weight */}
            </Link>
          </li>
        ))}
      </ul>

      {/* Logout button pushed to the bottom */}
      <div className="mt-auto pt-4"> 
        <Link to="/logout" className="btn btn-outline-danger w-100 py-2 rounded-pill">🚪 Logout</Link>
      </div>
    </div>
  );
};

export default SideBar;
