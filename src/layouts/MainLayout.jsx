// src/layouts/MainLayout.js
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="d-flex">
      {/* Sidebar could be here */}
      <div className="flex-grow-1 p-3">
        {/* Header if needed */}
        <Outlet /> {/* Renders child routes like /dashboard */}
      </div>
    </div>
  );
};

export default MainLayout;
