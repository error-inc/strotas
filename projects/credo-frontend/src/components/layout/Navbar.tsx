import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { useWallet } from '@txnlab/use-wallet-react';
import ConnectWallet from '../ConnectWallet';

interface NavbarProps {
  onConnectWalletClick?: () => void;
  activeAddress?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onConnectWalletClick,
  activeAddress: propActiveAddress 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';
  
  const { activeAddress: hookActiveAddress } = useWallet();
  const activeAddress = propActiveAddress || hookActiveAddress;

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-wrapper')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnectClick = onConnectWalletClick || (() => setIsWalletModalOpen(true));

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getUserInitial = () => {
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <nav className="fixed-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>Credo</Link>
        
        <div className="nav-actions">
          {/* Not logged in: show Login / Sign Up */}
          {!user && (
            <>
              <Link to="/login" className="btn-modern btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Log In
              </Link>
              <Link to="/signup" className="btn-modern btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Sign Up
              </Link>
            </>
          )}

          {/* Logged in: wallet button */}
          {user && (
            <button 
              className="btn-modern btn-ghost"
              onClick={handleConnectClick}
            >
              {activeAddress
                ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
                : 'Connect Wallet'}
            </button>
          )}

          {/* Logged in: Dashboard link if not already there */}
          {user && !isDashboard && (
            <Link to="/dashboard" className="btn-modern btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Dashboard
            </Link>
          )}

          {/* Logged in: User avatar + dropdown */}
          {user && (
            <div className="user-menu-wrapper" style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  border: '2px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition)',
                  flexShrink: 0,
                }}
              >
                {getUserInitial()}
              </button>

              {isUserMenuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  minWidth: '200px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 200,
                  animation: 'slideUp 0.15s ease-out',
                }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    marginBottom: '0.5rem',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {!onConnectWalletClick && (
        <ConnectWallet openModal={isWalletModalOpen} closeModal={() => setIsWalletModalOpen(false)} />
      )}
    </nav>
  );
};

export default Navbar;
