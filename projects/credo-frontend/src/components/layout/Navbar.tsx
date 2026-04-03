import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
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
  const isDashboard = location.pathname === '/dashboard';
  
  const { activeAddress: hookActiveAddress } = useWallet();
  const activeAddress = propActiveAddress || hookActiveAddress;

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleConnectClick = onConnectWalletClick || (() => setIsWalletModalOpen(true));


  return (
    <nav className="fixed-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>Credo</Link>
        
        <div className="nav-actions">
          {/* Always show wallet connect button */}
          <button 
            className="btn-modern btn-ghost"
            onClick={handleConnectClick}
          >
            {activeAddress ? 'Manage Wallet' : 'Connect Wallet'}
          </button>

          
          {/* Show Log In / Sign Up only when not logged in */}
          {!user && (
            <>
              <Link to="/login" className="btn-modern btn-ghost block" style={{ marginLeft: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Log In
              </Link>
              <Link to="/signup" className="btn-modern btn-primary block" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Sign Up
              </Link>
            </>
          )}
          {/* Show Dashboard link when logged in and not already on dashboard */}
          {user && !isDashboard && (
            <Link to="/dashboard" className="btn-modern btn-primary block" style={{ marginLeft: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Go to Dashboard
            </Link>
          )}
          {/* Debug: show user email when logged in */}
          {user && (
            <span style={{ marginLeft: '1rem', color: 'var(--accent-primary)' }}>{user.email || 'Logged In'}</span>
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
