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
      <div className={styles.brandRow}>
        <img src="/logo.svg" alt="FitSage Logo" className={styles.logoIcon} height={36} width={36} />
        <span className={styles.brandText}>FitSage</span>
      </div>
      {/* Navigation Links */}
      <nav className={styles.nav}>
        {navigationItems.map((item) => {
          const active = isActiveLink(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={styles.navLink}
            >
              <span className={`material-symbols-outlined ${styles.navMaterialIcon}`}>{
                item.name === 'Home' ? 'home' :
                item.name === 'Workouts' ? 'fitness_center' :
                item.name === 'Diary' ? 'book' : ''
              }</span>
              <span className={styles.navTitle}>{item.name}</span>
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
          <span className="material-symbols-outlined">logout</span>
          <span>Sign Out</span>
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
