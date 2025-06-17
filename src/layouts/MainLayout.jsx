// src/components/MainLayout.jsx
import React from 'react';
import SideBar from './SideBar'; // Assuming SideBar is in the same 'components' folder

const MainLayout = ({ children }) => {
  return (
    <div className="container-fluid g-0"> {/* g-0 removes gutter padding */}
      <div className="row flex-nowrap vh-100"> {/* flex-nowrap prevents wrapping, vh-100 ensures full height */}
        {/* Sidebar Column */}
        {/* bg-sidebar is our custom class from sidebar.css */}
        {/* rounded-end-4 gives a subtle rounded corner on the right edge */}
        {/* shadow-sm adds a light shadow for depth */}
        <div className="col-auto col-md-3 col-xl-2 px-3 bg-sidebar border-end rounded-end-4 shadow-sm">
          <SideBar />
        </div>

        {/* Main Content Column */}
        {/* flex-grow-1 makes content take remaining width */}
        {/* p-4 adds consistent padding around content */}
        <div className="col py-3 px-4 overflow-auto flex-grow-1">
          {children} {/* This is where your HomeOverview or other pages will render */}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
