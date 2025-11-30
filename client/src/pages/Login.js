import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './Login.css';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      redirectUser(user.role);
    }
  }, []);

  const redirectUser = (role) => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'kitchen') {
      navigate('/kitchen');
    } else {
      navigate('/pos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);

    try {
      const data = await api.login(mobile, pin);

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        redirectUser(data.user.role);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Server connection error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (mobile, pin) => {
    setMobile(mobile);
    setPin(pin);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-header">
            <div className="logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect width="60" height="60" rx="12" fill="url(#gradient1)" />
                <path
                  d="M30 15L42 25V42C42 43.1046 41.1046 44 40 44H20C18.8954 44 18 43.1046 18 42V25L30 15Z"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M25 35H35" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient1" x1="0" y1="0" x2="60" y2="60">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1>Restaurant POS</h1>
            <p>Lightweight Point of Sale System</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                className="form-control"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength="10"
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pin">PIN</label>
              <input
                type="password"
                id="pin"
                className="form-control"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                required
                autoComplete="off"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10H16M16 10L11 5M16 10L11 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="demo-credentials">
            <p className="demo-title">
              <strong>🎯 Demo Credentials</strong>
            </p>
            <div className="cred-list">
              <div className="cred-item" onClick={() => quickLogin('1234567890', '1234')}>
                <span className="role cashier">👤 Cashier</span>
                <span className="cred-text">1234567890 / 1234</span>
              </div>
              <div className="cred-item" onClick={() => quickLogin('9876543210', '5678')}>
                <span className="role kitchen">👨‍🍳 Kitchen</span>
                <span className="cred-text">9876543210 / 5678</span>
              </div>
              <div className="cred-item" onClick={() => quickLogin('5555555555', '9999')}>
                <span className="role admin">⚙️ Admin</span>
                <span className="cred-text">5555555555 / 9999</span>
              </div>
            </div>
            <p className="click-hint">💡 Click any credential to auto-fill</p>
          </div>
        </div>

        <div className="features-banner">
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <h3>Lightning Fast</h3>
              <p>Order to KOT &lt; 300ms</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">🔄</div>
            <div className="feature-text">
              <h3>Real-time Updates</h3>
              <p>WebSocket powered sync</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <div className="feature-text">
              <h3>Smart Reports</h3>
              <p>Daily analytics & insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

