import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);
        navigate('/dashboard');
      } else {
        alert(data.message || 'Sign in failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="container">
      <h1>Sign In</h1>
      <form onSubmit={handleSignIn}>
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
        <button type="submit">Sign In</button>
      </form>
      <div className="link">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}

export default SignIn;
