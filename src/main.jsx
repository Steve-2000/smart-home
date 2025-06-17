import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Logout from "./pages/Logout.jsx"
import LoginRegister from './components/LoginRegister.jsx'
import RouteLogin from './router/RouteLogin.jsx'

// src/routes/router.js
import { createBrowserRouter,RouterProvider } from 'react-router-dom';


import ProtectedRoute from './router/ProtectedRoute'; // 👈 create this
import SideBar from './components/SideBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Addroom from './pages/Addroom.jsx'
import UpdateRoomData from './components/UpdateRoomData.jsx'
import Devices from './pages/Devices.jsx'
import Environment from './pages/Environment.jsx'
import AddPet from './pages/AddPet.jsx'
import PetCare from './pages/PetCare.jsx'
import NotificationSettings from './pages/NotificationSettings.jsx'
import LaserBoundaryControl from './pages/LaserBoundaryControl.jsx'
// import Logout from './pages/Logout.jsx'

const router = createBrowserRouter([
  {
    path:'/' ,
    element: <LoginRegister />,
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path:'/dashboard',
    element:<Dashboard />
  },
  {
    path:'/logout',
    element:<Logout/>
   
  },
  {
    path:'/Addroom',
    element:<Addroom/>
  },
  {
    path:'/updateRoomData',
    element:<UpdateRoomData/>
  },
  {
    path:'/devices',
    element:<Devices/>
  },
  {
    path:'/addpet',
    element:<AddPet/>
  },
    {
    path:'/home/pets',
    element:<PetCare/>
  },
   {
    path:'/pets',
    element:<PetCare/>
  },
  {
        path: 'notification-settings', // NEW ROUTE: Matches '/home/notification-settings'
        element: <NotificationSettings />,
      },
{
        path:'/laser',
        element:<LaserBoundaryControl/>
},
{
  path:"/laserbeam",
  element:<LaserBoundaryControl/>
}
 
  
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
  <RouterProvider router={router}>    </RouterProvider>
  </StrictMode>,
)
