import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile details if authenticated
  useEffect(() => {
    const loadData = async () => {
      if (user && user.token) {
        try {
          const profileRes = await profileAPI.getProfile();
          setProfile(profileRes.data);
        } catch (err) {
          console.error('Failed to load user profile details on startup:', err);
          // If token expired, clear session
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      
      const profileRes = await profileAPI.getProfile();
      setProfile(profileRes.data);
      
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (fields) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(fields);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      
      const profileRes = await profileAPI.getProfile();
      setProfile(profileRes.data);
      
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('user');
  };

  const updateProfileState = async (newProfileData) => {
    try {
      const res = await profileAPI.updateProfile(newProfileData);
      setProfile(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed updating profile state:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      error,
      login,
      register,
      logout,
      updateProfileState,
      refreshProfile: async () => {
        try {
          const res = await profileAPI.getProfile();
          setProfile(res.data);
        } catch (e) {
          console.error(e);
        }
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
