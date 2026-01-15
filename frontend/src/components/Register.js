import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertModal } from './Modal';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required fields.',
        variant: 'warning'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Passwords do not match.',
        variant: 'warning'
      });
      return;
    }

    if (formData.password.length < 6) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Password must be at least 6 characters long.',
        variant: 'warning'
      });
      return;
    }

    setIsLoading(true);
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName
    });
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setAlertModal({
        isOpen: true,
        title: 'Registration Failed',
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
      
      <div className="auth-card auth-card-wide animate-slide-up">
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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started with your new dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                autoComplete="given-name"
                aria-label="First name"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                autoComplete="family-name"
                aria-label="Last name"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              autoComplete="username"
              aria-label="Username (required)"
              aria-required="true"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              autoComplete="email"
              aria-label="Email address (required)"
              aria-required="true"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-label="Password (required, minimum 6 characters)"
                aria-required="true"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-label="Confirm password (required)"
                aria-required="true"
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
            aria-label={isLoading ? 'Creating account...' : 'Create account'}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link" aria-label="Sign in to existing account">
              Sign in
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

export default Register;

