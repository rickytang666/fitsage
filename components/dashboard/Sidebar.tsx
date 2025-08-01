'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if a link is active
  const isActiveLink = (href: string) => {
    return pathname === href || (href !== '/profile' && pathname.startsWith(href));
  };

  // Close mobile menu when a link is clicked
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <>
      {/* Mobile Top Navbar */}
      <div className={styles.mobileNavbar}>
        <div className={styles.mobileBrandRow}>
          <img src="/logo.svg" alt="FitSage Logo" className={styles.mobileLogoIcon} height={32} width={32} />
          <span className={styles.mobileBrandText}>FitSage</span>
        </div>
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`material-symbols-outlined ${styles.mobileMenuIcon}`}>
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <nav className={styles.mobileNav}>
              {navigationItems.map((item) => {
                const active = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={
                      active
                        ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}`
                        : styles.mobileNavLink
                    }
                  >
                    <span className={`material-symbols-outlined ${styles.mobileNavIcon}`}>{
                      item.name === 'Home' ? 'home' :
                      item.name === 'Workouts' ? 'fitness_center' :
                      item.name === 'Diary' ? 'book' : ''
                    }</span>
                    <span className={styles.mobileNavTitle}>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className={styles.mobileSignOutSection}>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
                className={styles.mobileSignOutButton}
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Sign Out</span>
              </button>
              {user && (
                <p className={styles.mobileUserEmail}>
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
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
                className={
                  active
                    ? `${styles.navLink} ${styles.navLinkActive}`
                    : styles.navLink
                }
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
    </>
  );
}
