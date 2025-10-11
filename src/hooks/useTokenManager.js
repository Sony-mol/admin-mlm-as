import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

export function useTokenManager() {
  const { refreshToken, isExpired, accessToken } = useAuth();
  const refreshTimeoutRef = useRef(null);

  // Auto-refresh token before it expires
  useEffect(() => {
    if (accessToken && !isExpired) {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Set timeout to refresh token 5 minutes before expiration
      const refreshTime = 55 * 60 * 1000; // 55 minutes (5 minutes before 1 hour expiry)
      
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('🔄 Auto-refreshing token...');
          await refreshToken();
        } catch (error) {
          console.error('❌ Auto token refresh failed:', error);
        }
      }, refreshTime);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [accessToken, isExpired, refreshToken]);

  return {
    isExpired,
    accessToken,
    refreshToken,
  };
}
