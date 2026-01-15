import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertModal } from './Modal';
import './Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter both username and password.',
        variant: 'warning'
      });
      return;
    }

    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setAlertModal({
        isOpen: true,
        title: 'Login Failed',
        message: result.error,
        variant: 'error'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-bg-gradient"></div>
        <div className="auth-bg-pattern"></div>
      </div>
      
      <div className="auth-card animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo" aria-label="Dashboard Logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="var(--color-accent-muted)"/>
              <path d="M14 18L24 12L34 18V30L24 36L14 30V18Z" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 24L34 18" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 24V36" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 24L14 18" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username or Email</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              aria-label="Username or email address"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-label="Password"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
            aria-label={isLoading ? 'Signing in...' : 'Sign in'}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link" aria-label="Create a new account">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
};

export default Login;

