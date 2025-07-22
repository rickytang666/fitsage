'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import styles from './Sidebar.module.css';

// Navigation items definition
const navigationItems = [
  { name: 'Home', href: '/profile', color: '#0070f3' },
  { name: 'Workouts', href: '/workouts', color: '#34c759' },
  { name: 'Diary', href: '/diary', color: '#5e5ce6' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Check if a link is active
  const isActiveLink = (href: string) => {
    return pathname === href || (href !== '/profile' && pathname.startsWith(href));
  };
  
  return (
    <div className={styles.sidebar}>
      <h1 className={styles.brand}>
        FitSage
      </h1>
      
      {/* Navigation Links */}
      <nav className={styles.nav}>
        {navigationItems.map((item) => {
          const active = isActiveLink(item.href);
          
          return (
            <Link 
              key={item.name}
              href={item.href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
              style={active ? { '--link-color': item.color } as React.CSSProperties : { '--link-color': item.color } as React.CSSProperties}
            >
              <span className={`${styles.navIcon} ${active ? styles.navIconActive : ''}`}></span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className={styles.signOutSection}>
        <button
          onClick={() => {
            signOut();
          }}
          className={styles.signOutButton}
        >
          🚪 Sign Out
        </button>
        
        {user && (
          <p className={styles.userEmail}>
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
