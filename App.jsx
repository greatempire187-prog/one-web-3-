import { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import './App.css';

const API_URL = 'http://localhost:5000/api/auth';

function App() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords must match');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/register`, { email, password });
      setMessage(response.data.message || 'Registered successfully. You can now log in.');
      setView('login');
      resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        { email, password },
        { withCredentials: true }
      );

      setUser(response.data.user);
      setMessage('Logged in successfully');
      resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    if (!window.ethereum) {
      setMessage('MetaMask is not installed');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      const messageToSign = 'Login to the app';
      const signature = await signer.signMessage(messageToSign);

      const response = await axios.post(
        `${API_URL}/wallet-auth`,
        { walletAddress, signature, message: messageToSign },
        { withCredentials: true }
      );

      setUser(response.data.user);
      setMessage('Wallet login successful');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Wallet login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      setUser(null);
      setMessage('Logged out');
    } catch {
      setMessage('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Web3 Auth App</h1>
        <div className="tabs">
          <button
            type="button"
            className={view === 'login' ? 'active' : ''}
            onClick={() => { setView('login'); resetForm(); }}
          >
            Login
          </button>
          <button
            type="button"
            className={view === 'register' ? 'active' : ''}
            onClick={() => { setView('register'); resetForm(); }}
          >
            Register
          </button>
          <button
            type="button"
            className={view === 'wallet' ? 'active' : ''}
            onClick={() => { setView('wallet'); resetForm(); }}
          >
            Wallet
          </button>
        </div>
      </header>

      {user && (
        <div className="profile-card">
          <p>Logged in as</p>
          <strong>{user.email || user.walletAddress}</strong>
          <button type="button" onClick={handleLogout} disabled={loading}>
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}

      {message && <div className="message">{message}</div>}

      {view === 'login' && !user && (
        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}

      {view === 'register' && !user && (
        <form onSubmit={handleRegister} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      )}

      {view === 'wallet' && !user && (
        <div className="wallet-panel">
          <button type="button" onClick={handleWalletLogin} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <p>Sign in with MetaMask to log in with your wallet.</p>
        </div>
      )}
    </div>
  );
}

export default App;