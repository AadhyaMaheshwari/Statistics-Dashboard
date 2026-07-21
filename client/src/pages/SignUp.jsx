import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const text = await response.text();

      console.log("Status:", response.status);
      console.log("Raw response:", text);

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.log("JSON parse error:", err);
        data = { message: 'Invalid response from server' };
      }

      console.log("Status:", response.status);
      console.log("Data:", data);

      if (response.ok) {
        navigate('/signin');
      } else {
        const errorMessage = data.message || data.error || 'Sign up failed. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error(error);
      alert('Network error: ' + error.message);
    }
  };

  return (
    <div className="container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <div className="link">
        Already have an account? <Link to="/signin">Sign In</Link>
      </div>
    </div>
  );
}

export default SignUp;
