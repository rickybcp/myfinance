import { useApp } from '../../context/AppContext';

// ============================================================================
// HEADER - Top bar with logo, language toggle, sign out
// ============================================================================

export default function Header() {
  const { user, language, toggleLanguage, signOut, t } = useApp();

  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>💰</span>
        <span style={styles.logoText}>MyFinance</span>
      </div>
      
      <div style={styles.actions}>
        <button onClick={toggleLanguage} style={styles.langBtn}>
          {language === 'fr' ? 'EN 🇬🇧' : 'FR 🇫🇷'}
        </button>
        
        <button onClick={signOut} style={styles.signOutBtn} title={t('Se déconnecter', 'Sign out')}>
          🚪
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderBottom: '1px solid #E1E8ED',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2D3436',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  langBtn: {
    padding: '6px 12px',
    border: '1px solid #E1E8ED',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
  },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    border: '1px solid #E1E8ED',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    color: '#636E72',
  },
};