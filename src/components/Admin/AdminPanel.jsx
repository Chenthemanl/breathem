import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReferenceManager from './ReferenceManager';

const AdminPanel = () => {
  // State to manage active section - this will be useful when you add more sections later
  const [activeSection, setActiveSection] = useState('references');

  // Navigation items - you can add more sections here in the future
  const navItems = [
    { id: 'references', label: 'Reference Faces' },
    // Future sections can be added here, like:
    // { id: 'settings', label: 'App Settings' },
    // { id: 'analytics', label: 'User Analytics' },
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Kode Mono', monospace, system-ui, sans-serif"
    },
    header: {
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '16px 0'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#333333',
      margin: 0
    },
    backLink: {
      color: '#8F8F8F',
      textDecoration: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      border: '1px solid #e5e7eb'
    },
    main: {
      maxWidth: '1200px',
      margin: '32px auto',
      padding: '0 24px'
    },
    navigation: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    navList: {
      display: 'flex',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    navItem: {
      flex: 1
    },
    navButton: (isActive) => ({
      width: '100%',
      padding: '12px 24px',
      backgroundColor: isActive ? '#f3f4f6' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid #8F8F8F' : 'none',
      color: isActive ? '#333333' : '#6b7280',
      fontWeight: isActive ? '600' : '400',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '14px'
    }),
    footer: {
      marginTop: '48px',
      textAlign: 'center',
      color: '#9ca3af',
      fontSize: '14px',
      paddingBottom: '24px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Happy Admin Panel</h1>
          <Link to="/" style={styles.backLink}>
            Return to Happy
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        {/* Navigation */}
        <nav style={styles.navigation}>
          <ul style={styles.navList}>
            {navItems.map(item => (
              <li key={item.id} style={styles.navItem}>
                <button
                  style={styles.navButton(activeSection === item.id)}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content section */}
        <div style={styles.contentSection}>
          {activeSection === 'references' && <ReferenceManager />}
          {/* Future sections will be added here, like:
            {activeSection === 'settings' && <SettingsManager />}
            {activeSection === 'analytics' && <AnalyticsManager />}
          */}
        </div>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>Happy Admin Panel • Version 2.0</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminPanel;