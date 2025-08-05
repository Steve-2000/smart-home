// src/index.js
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; 
import Logout from "./pages/Logout.jsx";
import LoginRegister from './components/LoginRegister.jsx';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute'; 
import MainLayout from './layouts/MainLayout.jsx'; 
import Dashboard from './pages/Dashboard.jsx';
import HomeOverview from './pages/HomeOverview.jsx'; 
import Addroom from './pages/Addroom.jsx';
import UpdateRoomData from './components/UpdateRoomData.jsx';
import Devices from './pages/Devices.jsx';
import AddPet from './pages/AddPet.jsx';
import PetCare from './pages/PetCare.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import LaserBoundaryControl from './pages/LaserBoundaryControl.jsx';

const router = createBrowserRouter([
  {
    // This is the root path for your login/registration.
    // It does NOT use the MainLayout, as it's a separate flow.
    path: '/',
    element: (
      // Apply flexbox centering directly to this wrapper div for LoginRegister
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', // Ensure it takes full viewport height for vertical centering
          backgroundColor: '#f0f2f5' // Optional: A light background for the login page
        }}
      >
        <LoginRegister />
      </div>
    ),
  },
  {
    // This is the protected route that wraps your main application layout.
    // Any route nested under this will use the MainLayout.
    path: '/home', // Base path for all authenticated pages with the sidebar
    element: (
      <ProtectedRoute>
        <MainLayout /> {/* Renders the MainLayout component */}
      </ProtectedRoute>
    ),
    children: [
      {
        index: true, 
        element: <HomeOverview
         />,
      },
      {
        path: 'dashboard', 
        element: <Dashboard />,
      },
      {
        path: 'homeoverview', 
        element: <HomeOverview />,
      },
      {
        path: 'addroom', 
        element: <Addroom />,
      },
      {
        path: 'updateroomdata', 
        element: <UpdateRoomData />,
      },
      {
        path: 'devices', 
        element: <Devices />,
      },
      {
        path: 'addpet', 
        element: <AddPet />,
      },
      {
        path: 'pets', 
        element: <PetCare />,
      },
      {
        path: 'notification-settings', 
        element: <NotificationSettings />,
      },
      {
        path: 'laserbeam', 
        element: <LaserBoundaryControl />,
      },
    ],
  },
  {
    path: '/logout',
    element: <Logout />,
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
