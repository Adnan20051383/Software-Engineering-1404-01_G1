import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SettingsContext } from '../../context/SettingsContext';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';
import SERVER_URL from "../../config";

const Navbar = () => {
  const { strings, toggleTheme, toggleLang, theme, lang } = useContext(SettingsContext);
  const { user, logout, loading } = useContext(AuthContext);

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // While checking auth status, don't show login buttons yet
  if (loading) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-auth-section"><span className="loader-text">...</span></div>
          <div className="nav-controls">
            <button onClick={toggleTheme} className="control-btn">{theme === 'light' ? '🌙' : '☀️'}</button>
            <button onClick={toggleLang} className="control-btn lang-btn">{lang === 'fa' ? 'EN' : 'FA'}</button>
          </div>
        </div>
      </nav>
    );
  }

  const handleMenuToggle = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-auth-section">
          {user ? (
            <div className="user-profile-box">
              <div className="avatar-circle">
                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.first_name} {user.last_name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = "/";
                }}
                className="logout-mini-btn"
                title={strings.logout}
              >
                🚪
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <a href={`${SERVER_URL}/auth/`} className="auth-btn login-btn">
                {strings.login}
              </a>
              <a href={`${SERVER_URL}/auth/signup/`} className="auth-btn signup-btn">
                {strings.signup}
              </a>
            </div>
          )}
        </div>

        {/* Hamburger Menu for Mobile */}
        <div className="hamburger-menu" onClick={handleMenuToggle}>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <NavLink to="/userwords" className={({isActive}) => isActive ? 'nav-item active-leitner' : 'nav-item'}>
            {strings.leitner}
          </NavLink>
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-item active-dashboard' : 'nav-item'}>
            {strings.dashboard}
          </NavLink>
          <NavLink to="/game" className={({isActive}) => isActive ? 'nav-item active-game' : 'nav-item'}>
            {strings.game}
          </NavLink>
          <NavLink to="/quiz" className={({isActive}) => isActive ? 'nav-item active-quiz' : 'nav-item'}>
            {strings.quiz}
          </NavLink>

          {/* Controls for theme and language */}
          <div className="nav-controls">
            <button onClick={toggleTheme} className="control-btn">{theme === 'light' ? '🌙' : '☀️'}</button>
            <button onClick={toggleLang} className="control-btn lang-btn">{lang === 'fa' ? 'EN' : 'FA'}</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
