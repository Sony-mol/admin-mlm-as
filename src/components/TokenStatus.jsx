import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TokenStatus() {
  const { accessToken, refreshToken, isExpired, refreshToken: refreshTokenFunction } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (accessToken) {
      try {
        // Decode JWT to get expiration info
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setTokenInfo({
          exp: payload.exp * 1000, // Convert to milliseconds
          iat: payload.iat * 1000,
          email: payload.email,
          role: payload.role
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      setTokenInfo(null);
    }
  }, [accessToken]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTokenFunction();
      console.log('✅ Token refreshed manually');
    } catch (error) {
      console.error('❌ Manual token refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTimeUntilExpiry = () => {
    if (!tokenInfo) return null;
    const now = Date.now();
    const timeLeft = tokenInfo.exp - now;
    if (timeLeft <= 0) return 'Expired';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusIcon = () => {
    if (!accessToken) return <XCircle className="w-4 h-4 text-red-500" />;
    if (isExpired) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!accessToken) return 'text-red-600';
    if (isExpired) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!accessToken) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-red-600">No token</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={getStatusColor()}>
          {isExpired ? 'Token Expired' : 'Token Valid'}
        </span>
      </div>
      
      {tokenInfo && (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{getTimeUntilExpiry()}</span>
        </div>
      )}
      
      {refreshToken && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs">Refresh</span>
        </button>
      )}
      
      <div className="text-xs text-gray-500">
        {tokenInfo?.email} ({tokenInfo?.role})
      </div>
    </div>
  );
}
