// src/components/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar'; // Ensure SideBar is correctly imported
import './mainLayout.css'; // Import the main layout CSS for structural styles

const MainLayout = () => {
  return (
    // This is the main container for the entire application layout.
    // 'app-container' class applies flexbox and ensures 100vh height.
    <div className="app-container">
      {/* Sidebar container:
          'sidebar-container' class sets its fixed width and prevents shrinking.
          'border-end' adds a subtle right border for visual separation. */}
      <div className="sidebar-container border-end">
        <SideBar />
      </div>

      {/* Main content area:
          'content-container' class allows it to grow and fill remaining space,
          and crucially, enables vertical scrolling if content overflows.
          'bg-light' provides a light background. */}
      <div className="content-container bg-light">
        {/* <Outlet> is where the content of the nested routes will be rendered.
            For example, if the path is /home/dashboard, the Dashboard component
            will be rendered here. */}
        <Outlet /> 
      </div>
    </div>
  );
};

export default MainLayout;
