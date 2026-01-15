import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from './Modal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.username || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-container">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileSidebarOpen ? 'sidebar-mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="var(--color-accent-muted)"/>
              <path d="M14 18L24 12L34 18V30L24 36L14 30V18Z" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 24L34 18" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 24V36" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 24L14 18" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {!sidebarCollapsed && <span className="sidebar-title">Dashboard</span>}
          </div>
          <button 
            className="sidebar-toggle desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d={sidebarCollapsed ? "M8 4L14 10L8 16" : "M12 4L6 10L12 16"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li>
              <a href="#dashboard" className="nav-item nav-item-active" aria-current="page">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                {!sidebarCollapsed && <span className="nav-label">Dashboard</span>}
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <ul className="nav-list">
            <li>
              <a href="#settings" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {!sidebarCollapsed && <span className="nav-label">Settings</span>}
              </a>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-wrapper">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-btn mobile-only"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileSidebarOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h1 className="page-title">Dashboard</h1>
          </div>

          <div className="topbar-right">
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button 
                className="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
                aria-label="User menu"
              >
                <div className="user-avatar" aria-hidden="true">
                  {getUserInitials()}
                </div>
                <span className="user-name">{getUserDisplayName()}</span>
                <svg 
                  className={`user-menu-chevron ${showUserMenu ? 'rotated' : ''}`} 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showUserMenu && (
                <div className="user-dropdown animate-slide-down" role="menu">
                  <div className="dropdown-header">
                    <span className="dropdown-user-name">{getUserDisplayName()}</span>
                    <span className="dropdown-user-email">{user?.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item dropdown-item-danger" 
                    onClick={handleLogout}
                    role="menuitem"
                    aria-label="Sign out"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M6.75 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12.75L15.75 9L12 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.75 9H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="main-content">
          <div className="coming-soon-container animate-fade-in">
            <div className="coming-soon-icon" aria-hidden="true">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="8 4"/>
                <path d="M28 40L36 48L52 32" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="coming-soon-title">Coming Soon</h2>
            <p className="coming-soon-text">
              We're working on something amazing. This dashboard will be your central hub for all features.
            </p>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Dashboard;

