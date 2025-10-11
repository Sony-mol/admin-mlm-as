// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS, getApiUrl } from '../config/api';

const AuthContext = createContext();

function decodeJwtExp(token) {
  try {
    const payload = JSON.parse(atob((token || '').split('.')[1] || ''));
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (auth) localStorage.setItem('auth', JSON.stringify(auth));
    else localStorage.removeItem('auth');
  }, [auth]);

  const isExpired = useMemo(() => {
    if (!auth?.accessToken) return true;
    return auth.expiresAt ? Date.now() >= auth.expiresAt - 5000 : false;
  }, [auth]);

  // Use API configuration for correct backend URL
  const LOGIN_PATH = API_ENDPOINTS.LOGIN;

  async function login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch(LOGIN_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && (data.token || data.accessToken)) {
        console.log('✅ Login successful');
        
        // Construct user object from individual fields returned by backend
        const user = {
          userId: data.userId,
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          status: data.status,
          referenceCode: data.refer,
          role: data.role || 'USER'
        };
        
        console.log('👤 User object:', user);
        
        // Use accessToken if available, fallback to token for backward compatibility
        const accessToken = data.accessToken || data.token;
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour (backend sets this)
        
        setAuth({ 
          user: user, 
          accessToken: accessToken, 
          refreshToken: data.refreshToken || null, 
          expiresAt 
        });
        
        return user;
      } else {
        console.error('❌ Login failed:', data.error || 'Unknown error');
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      throw error;
    }
  }

  function logout() {
    setAuth(null);
    try { localStorage.removeItem('auth'); } catch {}
  }

  async function refreshToken() {
    if (!auth?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch(getApiUrl('/api/users/refresh-token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        console.log('✅ Token refreshed successfully');
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
        setAuth(prev => ({
          ...prev,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || prev.refreshToken,
          expiresAt
        }));
        return data.accessToken;
      } else {
        console.error('❌ Token refresh failed:', data.error);
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('💥 Token refresh error:', error);
      logout();
      throw error;
    }
  }

  async function authFetch(path, init = {}) {
    const headers = new Headers(init.headers || {});
    
    try {
      // Add authorization header if we have a valid token
      if (auth?.accessToken && !isExpired) {
        headers.set('Authorization', `Bearer ${auth.accessToken}`);
      }
      
      // Use getApiUrl to ensure correct backend URL
      const fullPath = path.startsWith('http') ? path : getApiUrl(path);
      const res = await fetch(fullPath, { ...init, headers });
      
      // Handle 401 - try to refresh token first
      if (res.status === 401 && auth?.refreshToken && !isExpired) {
        console.log('🔄 Access token expired, attempting refresh...');
        
        try {
          const newAccessToken = await refreshToken();
          
          // Retry the original request with new token
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          const retryRes = await fetch(fullPath, { ...init, headers });
          
          if (retryRes.status === 401) {
            logout();
            throw new Error('Session expired. Please sign in again.');
          }
          
          return retryRes;
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          logout();
          throw new Error('Session expired. Please sign in again.');
        }
      }
      
      // If still 401 after refresh attempt or no refresh token
      if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please sign in again.');
      }
      
      return res;
    } catch (error) {
      console.error('💥 Auth fetch error:', error);
      throw error;
    }
  }

  const value = useMemo(() => ({
    user: auth?.user || null,
    accessToken: auth?.accessToken || null,
    refreshToken: auth?.refreshToken || null,
    expiresAt: auth?.expiresAt || null,
    isExpired,
    login, logout, authFetch, refreshToken,
  }), [auth, isExpired]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
