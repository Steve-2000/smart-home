// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideBar from './components/SideBar';
import HomeOverview from './pages/HomeOverview'; // Import the new HomeOverview component
import Dashboard from './pages/Dashboard';
import AddRoom from './pages/Addroom'; // Renamed from Addroom for consistency
import UpdateRoomData from './components/UpdateRoomData';
import PetCare from './pages/PetCare';
import AddPet from './pages/AddPet';
import Devices from './pages/Devices';
import LaserBoundaryDisplay from './pages/LaserBoundaryDisplay'; // Keep this import if you still want to route to it as a separate page

import './App.css'; // custom styling

function App() {
  return (
 
      <div className="d-flex">
        <SideBar />
        {/* The main content area where different pages will be displayed */}
        <div className="flex-grow-1 p-4 bg-light" style={{ minHeight: '100vh' }}>
          <HomeOverview/>
         
        </div>
      </div>
  
  );
}

export default App;