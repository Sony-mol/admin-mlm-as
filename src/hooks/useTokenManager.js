import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

export function useTokenManager() {
  const { refreshToken, isExpired, accessToken } = useAuth();
  const refreshTimeoutRef = useRef(null);

  // Auto-refresh token before it expires
  useEffect(() => {
    console.log('🔍 Token Manager: accessToken exists:', !!accessToken, 'isExpired:', isExpired);
    
    if (accessToken && !isExpired) {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Set timeout to refresh token 5 minutes before expiration
      const refreshTime = 55 * 60 * 1000; // 55 minutes (5 minutes before 1 hour expiry)
      
      console.log('⏰ Token Manager: Setting auto-refresh timer for', refreshTime / 1000 / 60, 'minutes');
      
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('🔄 Auto-refreshing token...');
          await refreshToken();
          console.log('✅ Auto token refresh completed successfully');
        } catch (error) {
          console.error('❌ Auto token refresh failed:', error);
        }
      }, refreshTime);
    } else {
      console.log('⚠️ Token Manager: Not setting auto-refresh - accessToken:', !!accessToken, 'isExpired:', isExpired);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        console.log('🧹 Token Manager: Clearing timeout');
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
