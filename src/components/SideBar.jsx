    import React from 'react';
    import { Link } from 'react-router-dom';
    import './sidebar.css'; // Optional if you want to style more

    const SideBar = () => {
      return (
        <div className="container-fluid">
          <div className="row vh-100">
            {/* Sidebar */}
            <div className="col-md-3 col-lg-2 bg-light p-3 border-end">
              <h4 className="text-center mb-4">Smart Home</h4>
              <ul className="nav flex-column">
                <li className="nav-item mb-2">
                  <Link to="/dashboard" className="nav-link text-dark">Dashboard</Link>
                </li>
                <li className="nav-item mb-2">
                  <Link to="/devices" className="nav-link text-dark">Devices</Link>
                </li>
                <li className="nav-item mb-2">
                  <Link to="/pets" className="nav-link text-dark">Pet Care</Link>
                </li>
                <li className="nav-item mb-2">
                  <Link to="/addpet" className="nav-link text-dark">Add Pets</Link>
                </li>
                <li className="nav-item mb-2">
                  <Link to="/Addroom" className="nav-link text-dark">add room</Link>
                </li>
                <li className="nav-item mb-2">
                  <Link to="/updateRoomData" className="nav-link text-dark">updatedroomdata</Link>
                </li>
                <li className="nav-item mb-2">
                  <Link to="/notification-settings" className="nav-link text-dark">notification</Link>
                </li>



                {/* <li className="nav-item mb-2">
                  <Link to="/settings" className="nav-link text-dark">Settings</Link>
                </li> */}
                <li className="nav-item mt-4">
                  <Link to="/logout" className="btn btn-outline-danger w-100">Logout</Link>
                </li>
                
              </ul>
            </div>

            {/* Main content */}
            <div className="col-md-9 col-lg-10 p-4">
              <h2 className="mb-4">Welcome to Your Dashboard</h2>
              <div className="card shadow-sm p-4 rounded-4">
                <p>This is where your smart home and pet care overview will appear.</p>
                <p>Use the menu on the left to navigate.</p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default SideBar;
