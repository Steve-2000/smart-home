  // import React from 'react';
  import SideBar from './components/SideBar';
  // import Dashboard from './components/Dashboard';
  import './App.css'; // custom styling

  function App() {
    return (
      <div className="d-flex">
        <SideBar />
        {/* <div className="flex-grow-1 p-4 bg-light" style={{ minHeight: '100vh' }}>
      
        </div> */}
      </div>
    );
  }

  export default App;
