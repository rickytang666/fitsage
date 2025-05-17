'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Navigation items definition
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', color: '#0070f3' },
  { name: 'Workouts', href: '/dashboard/workouts', color: '#34c759' },
  { name: 'Diary', href: '/dashboard/diary', color: '#5e5ce6' },
  { name: 'Measurements', href: '/dashboard/measurements', color: '#ff9500' },
  { name: 'Profile', href: '/dashboard/profile', color: '#ff3b30' },
  { name: 'Test Page', href: '/dashboard/test', color: '#64748b' },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [mountTime] = useState(new Date().toISOString());
  const [lastRender, setLastRender] = useState(new Date().toISOString());
  const [debugMessage, setDebugMessage] = useState<string[]>([]);
  
  // Add debug message
  const addDebug = (message: string) => {
    console.log(`SIDEBAR: ${message}`);
    setDebugMessage(prev => [message, ...prev].slice(0, 5));
    setLastRender(new Date().toISOString());
  };
  
  // Track renders
  useEffect(() => {
    addDebug('Component mounted/updated');
  }, []);

  // Check if a link is active
  const isActiveLink = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };
  
  return (
    <div style={{ 
      width: '250px', 
      padding: '20px', 
      backgroundColor: '#f8f9fa',
      height: '100%',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ 
        marginBottom: '30px', 
        fontSize: '24px', 
        color: '#333',
        borderBottom: '1px solid #eee',
        paddingBottom: '15px'
      }}>
        FitSage
      </h1>
      
      {/* Navigation Links */}
      <nav style={{ marginBottom: '20px', flex: 1 }}>
        {navigationItems.map((item) => {
          const active = isActiveLink(item.href);
          
          return (
            <Link 
              key={item.name}
              href={item.href} 
              onClick={() => addDebug(`Navigation to: ${item.href}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                marginBottom: '8px',
                backgroundColor: active ? item.color : 'transparent',
                color: active ? 'white' : '#333',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: active ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                border: active ? 'none' : '1px solid #eee'
              }}
            >
              <span style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: item.color,
                marginRight: '10px',
                opacity: active ? 0.5 : 1
              }}></span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Collapsible Debug section */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
            padding: '5px 0'
          }}
        >
          Debug Panel
          <span>{showDebug ? '▲' : '▼'}</span>
        </button>
        
        {showDebug && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px',
            border: '1px solid #ddd',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#f8f8f8'
          }}>
            <p><strong>Current pathname:</strong> {pathname}</p>
            <p><strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.pathname : ''}</p>
            <p><strong>Component mounted:</strong> {mountTime}</p>
            <p><strong>Last render:</strong> {lastRender}</p>
            
            <div style={{ marginTop: '10px' }}>
              <strong>Debug log:</strong>
              <ul style={{ margin: '5px 0', padding: '0 0 0 20px' }}>
                {debugMessage.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
