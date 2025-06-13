// src/components/Logout.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    auth.signOut().then(() => {
      navigate('/', { replace: true }); // replaces history to prevent going back
    });
  }, [navigate]);

  return null; // optionally show a loading spinner
};

export default Logout;
