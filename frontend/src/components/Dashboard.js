import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal, AISummaryModal } from './Modal';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('notes');
  const userMenuRef = useRef(null);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteError, setNoteError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  // AI Summary state
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [aiSummaryNoteTitle, setAiSummaryNoteTitle] = useState('');

  // Fetch notes on mount
  const fetchNotes = useCallback(async () => {
    try {
      setNotesLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data);
      setNoteError(null);
    } catch (error) {
      setNoteError('Failed to load notes. Please try again.');
      console.error('Error fetching notes:', error);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'notes') {
      fetchNotes();
    }
  }, [activeView, fetchNotes]);

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

  // Notes handlers
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content || '');
    setIsEditing(false);
    setIsCreating(false);
    setMobileSidebarOpen(false);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setIsCreating(true);
    setIsEditing(false);
    setMobileSidebarOpen(false);
  };

  const handleEditNote = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      setIsCreating(false);
      setNoteTitle('');
      setNoteContent('');
    } else {
      setNoteTitle(selectedNote?.title || '');
      setNoteContent(selectedNote?.content || '');
      setIsEditing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      setNoteError('Title is required');
      return;
    }

    try {
      setSavingNote(true);
      setNoteError(null);
      const token = localStorage.getItem('token');
      
      if (isCreating) {
        // Create new note
        const response = await fetch(`${API_URL}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: noteTitle, content: noteContent })
        });

        if (!response.ok) {
          throw new Error('Failed to create note');
        }

        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
        setIsCreating(false);
      } else {
        // Update existing note
        const response = await fetch(`${API_URL}/notes/${selectedNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: noteTitle, content: noteContent })
        });

        if (!response.ok) {
          throw new Error('Failed to update note');
        }

        const updatedNote = await response.json();
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
        setSelectedNote(updatedNote);
        setIsEditing(false);
      }
    } catch (error) {
      setNoteError(error.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteClick = (note, e) => {
    e.stopPropagation();
    setNoteToDelete(note);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notes/${noteToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter(n => n.id !== noteToDelete.id));
      if (selectedNote?.id === noteToDelete.id) {
        setSelectedNote(null);
        setNoteTitle('');
        setNoteContent('');
        setIsEditing(false);
      }
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
    } catch (error) {
      setNoteError(error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // AI Summary handler
  const handleGenerateSummary = async () => {
    if (!selectedNote) return;

    setShowAISummary(true);
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    setAiSummary('');
    setAiSummaryNoteTitle(selectedNote.title);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ai/summarize/${selectedNote.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate summary');
      }

      setAiSummary(data.summary);
    } catch (error) {
      setAiSummaryError(error.message);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const closeAISummaryModal = () => {
    setShowAISummary(false);
    setAiSummary('');
    setAiSummaryError(null);
    setAiSummaryNoteTitle('');
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'notes':
        return 'Notes';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const renderNotesContent = () => {
    if (notesLoading) {
      return (
        <div className="notes-loading" role="status" aria-label="Loading notes">
          <div className="loading-spinner"></div>
          <p>Loading notes...</p>
        </div>
      );
    }

    if (isCreating || (selectedNote && (isEditing || !isEditing))) {
      return (
        <div className="note-editor">
          <div className="note-editor-header">
            <input
              type="text"
              className="note-title-input"
              placeholder="Note title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              disabled={!isEditing && !isCreating}
              aria-label="Note title"
            />
            <div className="note-editor-actions">
              {isEditing || isCreating ? (
                <>
                  <button
                    className="btn-note-action btn-cancel"
                    onClick={handleCancelEdit}
                    aria-label="Cancel editing"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-note-action btn-save"
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    aria-label={isCreating ? 'Create note' : 'Save note'}
                  >
                    {savingNote ? 'Saving...' : isCreating ? 'Create' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-note-action btn-ai-summary"
                    onClick={handleGenerateSummary}
                    aria-label="Generate AI summary"
                    title="Generate AI Summary"
                    disabled={!selectedNote?.content || selectedNote.content.trim() === ''}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor"/>
                    </svg>
                    AI Summary
                  </button>
                  <button
                    className="btn-note-action btn-edit"
                    onClick={handleEditNote}
                    aria-label="Edit note"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M12.75 2.25L15.75 5.25M2.25 15.75L3 12.75L12 3.75L15 6.75L5.25 15.75L2.25 15.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="btn-note-action btn-delete"
                    onClick={(e) => handleDeleteClick(selectedNote, e)}
                    aria-label="Delete note"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M2.25 4.5H15.75M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          {noteError && (
            <div className="note-error" role="alert">
              {noteError}
            </div>
          )}
          <textarea
            className="note-content-input"
            placeholder="Start writing your note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            disabled={!isEditing && !isCreating}
            aria-label="Note content"
          />
          {selectedNote && !isEditing && !isCreating && (
            <div className="note-meta">
              <span>Created: {formatDate(selectedNote.created_at)}</span>
              <span>Updated: {formatDate(selectedNote.updated_at)}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="notes-empty-state">
        <div className="empty-icon" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="16" y="10" width="48" height="60" rx="4" stroke="var(--color-accent)" strokeWidth="2"/>
            <line x1="24" y1="24" x2="56" y2="24" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="34" x2="56" y2="34" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="44" x2="44" y2="44" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2>Select or create a note</h2>
        <p>Choose a note from the list or create a new one to get started.</p>
        <button className="btn-create-note-primary" onClick={handleNewNote} aria-label="Create new note">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Note
        </button>
      </div>
    );
  };

  const renderSettingsContent = () => {
    return (
      <div className="coming-soon-container animate-fade-in">
        <div className="coming-soon-icon" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="8 4"/>
            <path d="M28 40L36 48L52 32" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="coming-soon-title">Coming Soon</h2>
        <p className="coming-soon-text">
          Settings page is under development. Stay tuned for customization options.
        </p>
      </div>
    );
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
            {!sidebarCollapsed && <span className="sidebar-title">Notes App</span>}
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
              <button 
                className={`nav-item ${activeView === 'notes' ? 'nav-item-active' : ''}`}
                onClick={() => setActiveView('notes')}
                aria-current={activeView === 'notes' ? 'page' : undefined}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="6" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {!sidebarCollapsed && <span className="nav-label">Notes</span>}
              </button>
            </li>
          </ul>

          {/* Notes list in sidebar when notes view is active */}
          {activeView === 'notes' && !sidebarCollapsed && (
            <div className="sidebar-notes-section">
              <div className="sidebar-notes-header">
                <span className="sidebar-notes-title">My Notes</span>
                <button
                  className="btn-new-note"
                  onClick={handleNewNote}
                  aria-label="Create new note"
                  title="New note"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="sidebar-notes-list">
                {notes.length === 0 && !notesLoading ? (
                  <div className="sidebar-notes-empty">
                    <p>No notes yet</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`sidebar-note-item ${selectedNote?.id === note.id ? 'sidebar-note-item-active' : ''}`}
                      onClick={() => handleSelectNote(note)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectNote(note)}
                      aria-label={`Note: ${note.title}`}
                    >
                      <div className="sidebar-note-title">{note.title}</div>
                      <div className="sidebar-note-meta">
                        <span className="sidebar-note-date">{formatDate(note.updated_at)}</span>
                        <button
                          className="sidebar-note-delete"
                          onClick={(e) => handleDeleteClick(note, e)}
                          aria-label={`Delete note: ${note.title}`}
                          title="Delete note"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M2 3.5H12M5 3.5V2.5C5 2.10218 5.15804 1.72064 5.43934 1.43934C5.72064 1.15804 6.10218 1 6.5 1H7.5C7.89782 1 8.27936 1.15804 8.56066 1.43934C8.84196 1.72064 9 2.10218 9 2.5V3.5M11 3.5V12C11 12.3978 10.842 12.7794 10.5607 13.0607C10.2794 13.342 9.89782 13.5 9.5 13.5H4.5C4.10218 13.5 3.72064 13.342 3.43934 13.0607C3.15804 12.7794 3 12.3978 3 12V3.5H11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <ul className="nav-list">
            <li>
              <button 
                className={`nav-item ${activeView === 'settings' ? 'nav-item-active' : ''}`}
                onClick={() => setActiveView('settings')}
                aria-current={activeView === 'settings' ? 'page' : undefined}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {!sidebarCollapsed && <span className="nav-label">Settings</span>}
              </button>
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
            <h1 className="page-title">{getPageTitle()}</h1>
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
          {activeView === 'notes' && renderNotesContent()}
          {activeView === 'settings' && renderSettingsContent()}
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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setNoteToDelete(null);
        }}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <AISummaryModal
        isOpen={showAISummary}
        onClose={closeAISummaryModal}
        noteTitle={aiSummaryNoteTitle}
        summary={aiSummary}
        isLoading={aiSummaryLoading}
        error={aiSummaryError}
      />
    </div>
  );
};

export default Dashboard;
