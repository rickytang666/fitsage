'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

// Navigation items definition
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', color: '#0070f3' },
  { name: 'Workouts', href: '/workouts', color: '#34c759' },
  { name: 'Diary', href: '/diary', color: '#5e5ce6' },
  { name: 'Measurements', href: '/measurements', color: '#ff9500' },
  { name: 'Profile', href: '/profile', color: '#ff3b30' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

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
      
      {/* Logout Button */}
      <div style={{ marginBottom: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <button
          onClick={() => {
            signOut();
          }}
          style={{
            width: '100%',
            padding: '14px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
          }}
        >
          🚪 Sign Out
        </button>
        
        {user && (
          <p style={{ 
            marginTop: '12px', 
            fontSize: '13px', 
            color: '#666', 
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
