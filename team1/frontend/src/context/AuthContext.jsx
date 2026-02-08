// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import SERVER_URL from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/me/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // --- ADDED LOGOUT FUNCTION ---
  const logout = async () => {
    try {
      // 1. Tell Django to clear the cookies/session
      await fetch(`${SERVER_URL}/api/auth/logout/`, {
        method: 'POST', // Usually POST for logout
        credentials: 'include',
      });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      // 2. Always clear local state even if the network request fails
      setUser(null);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  return (
    // Update the provider to include the new logout function
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};