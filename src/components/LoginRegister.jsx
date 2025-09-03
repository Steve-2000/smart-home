// src/pages/LoginRegister.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Ensure this path is correct
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail, // <-- ADDED this import
} from 'firebase/auth';

import './loginregister.css'; // Your custom styles

// This is the new component for handling password resets
const PasswordResetForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Success! Check your email for a password reset link. 🎉');
      setMessageType('success');
      setEmail('');
    } catch (err) {
      setMessage(`Failed to send reset email: ${err.message} 😢`);
      setMessageType('danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-register-container card shadow-lg rounded-xl p-5 animate__animated animate__fadeInDown">
      <h2 className="text-center mb-4 text-primary fw-bold">
        Reset Password
      </h2>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4 rounded-lg shadow-sm`} role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <form onSubmit={handlePasswordReset}>
        <div className="mb-3">
          <label htmlFor="resetEmail" className="form-label text-muted">Email address</label>
          <input
            type="email"
            id="resetEmail"
            name="email"
            className="form-control rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value.trimStart())}
            placeholder="name@example.com"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 btn-lg rounded-pill shadow-sm animate-bounce-on-hover" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="mt-4 text-center text-muted">
          <button type="button" onClick={onBack} className="btn btn-link p-0 fw-bold text-decoration-none text-primary">
            Back to Login
          </button>
        </p>
      </form>
    </div>
  );
};

const LoginRegister = () => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false); // <-- ADDED this state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    document.body.classList.add('login-bg');
    return () => {
      document.body.classList.remove('login-bg');
    };
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setMessage('');
    setMessageType('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trimStart() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    setMessage('');
    setMessageType('');

    if (isRegister) {
      if (!name) {
        setMessage('Please enter your full name.');
        setMessageType('danger');
        return;
      }
      if (password.length < 6) {
        setMessage('Password must be at least 6 characters long.');
        setMessageType('danger');
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Passwords do not match!');
        setMessageType('danger');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        setMessage('Registration successful! You can now log in. 🎉');
        setMessageType('success');
        setIsRegister(false);
      } catch (err) {
        setMessage(`Registration failed: ${err.message} 😔`);
        setMessageType('danger');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Logged in successfully! Welcome back! 👋');
        setMessageType('success');
        navigate('/home');
      } catch (err) {
        setMessage(`Login failed: ${err.message} 😢`);
        setMessageType('danger');
      }
    }
  };

  // Conditionally render the password reset form or the main form
  if (showPasswordReset) {
    return <PasswordResetForm onBack={() => setShowPasswordReset(false)} />;
  }

  return (
    <div className="login-register-wrapper d-flex justify-content-center align-items-center min-vh-100">
      <div className="login-register-container card shadow-lg rounded-xl p-5 animate__animated animate__fadeInDown">
        <h2 className="text-center mb-4 text-primary fw-bold">
          {isRegister ? 'Register Account' : 'Welcome Back!'}
        </h2>

        {message && (
          <div className={`alert alert-${messageType} alert-dismissible fade show mb-4 rounded-lg shadow-sm`} role="alert">
            {message}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setMessage('')}></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-3">
              <label htmlFor="fullName" className="form-label text-muted">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="name"
                className="form-control rounded-lg"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="emailAddress" className="form-label text-muted">Email address</label>
            <input
              type="email"
              id="emailAddress"
              name="email"
              className="form-control rounded-lg"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label text-muted">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control rounded-lg"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label text-muted">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control rounded-lg"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 btn-lg rounded-pill shadow-sm animate-bounce-on-hover">
            {isRegister ? 'Register' : 'Login'}
          </button>

          <p className="mt-4 text-center text-muted">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={toggleForm} className="btn btn-link p-0 fw-bold text-decoration-none text-primary">
              {isRegister ? 'Login Here' : 'Register Now'}
            </button>
          </p>

          {!isRegister && (
            <p className="text-center mt-3">
              <button type="button" onClick={() => setShowPasswordReset(true)} className="btn btn-link p-0 text-muted text-decoration-underline">
                Forgot Password?
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginRegister;
