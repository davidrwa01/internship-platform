import React, { useEffect, useState } from 'react';
import API from '../services/api';

const DebugAuth = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    setDebugInfo({
      tokenInLocalStorage: token ? `Yes (${token.length} chars)` : 'No',
      userInLocalStorage: user ? 'Yes' : 'No',
      apiBaseUrl: import.meta.env.VITE_API_URL,
    });

    // Test public endpoint
    try {
      const publicTest = await API.get('/test');
      setDebugInfo(prev => ({ ...prev, publicEndpoint: '✅ Working' }));
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, publicEndpoint: '❌ Failed' }));
    }

    // Test protected endpoint
    if (token) {
      try {
        const protectedTest = await API.get('/auth/me');
        setDebugInfo(prev => ({ ...prev, protectedEndpoint: '✅ Working' }));
      } catch (error) {
        setDebugInfo(prev => ({ 
          ...prev, 
          protectedEndpoint: `❌ Failed: ${error.response?.data?.message || error.message}` 
        }));
      }
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', margin: '10px', borderRadius: '5px' }}>
      <h3>🔧 Authentication Debug Info</h3>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      <button onClick={checkAuthStatus} style={{ padding: '10px', margin: '5px' }}>
        Refresh Debug Info
      </button>
      <button onClick={() => {
        localStorage.clear();
        window.location.reload();
      }} style={{ padding: '10px', margin: '5px', background: '#ff4444', color: 'white' }}>
        Clear Storage & Reload
      </button>
    </div>
  );
};

export default DebugAuth;