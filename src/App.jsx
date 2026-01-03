import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import Navigation from './components/common/Navigation';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import RecurringPage from './pages/RecurringPage';
import './App.css';

// ============================================================================
// MAIN APP CONTENT (inside provider)
// ============================================================================

function AppContent() {
  const { user, authLoading, setupLoading, dataLoading, t } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);

  // Loading state
  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <span style={styles.loadingIcon}>💰</span>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginPage />;
  }

  // Setting up account
  if (setupLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <span style={styles.loadingIcon}>⚙️</span>
          <p style={styles.loadingText}>{t('Configuration du compte...', 'Setting up account...')}</p>
        </div>
      </div>
    );
  }

  // Loading data
  if (dataLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <span style={styles.loadingIcon}>📊</span>
          <p style={styles.loadingText}>{t('Chargement des données...', 'Loading data...')}</p>
        </div>
      </div>
    );
  }

  // Render active page
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'recurring':
        return <RecurringPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'insights':
        return <InsightsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div style={styles.app}>
      <Header onSettingsClick={() => setShowSettings(true)} />
      <main style={styles.main}>
        {renderPage()}
      </main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.settingsOverlay}>
          <div style={styles.settingsModal}>
            <button 
              onClick={() => setShowSettings(false)} 
              style={styles.settingsClose}
            >
              ✕ {t('Fermer', 'Close')}
            </button>
            <SettingsPage />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// APP WRAPPER (provides context)
// ============================================================================

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#F5F7FA',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  main: {
    minHeight: 'calc(100vh - 60px - 70px)', // header + nav
  },
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#F5F7FA',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  loadingIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#636E72',
    fontSize: '16px',
    margin: 0,
  },
  settingsOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    overflowY: 'auto',
  },
  settingsModal: {
    minHeight: '100%',
    backgroundColor: '#F5F7FA',
  },
  settingsClose: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '16px',
    backgroundColor: 'white',
    border: 'none',
    borderBottom: '1px solid #E1E8ED',
    fontSize: '15px',
    fontWeight: '500',
    color: '#636E72',
    cursor: 'pointer',
    zIndex: 10,
  },
};

export default App;