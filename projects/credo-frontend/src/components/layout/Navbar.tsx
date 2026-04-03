import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  onConnectWalletClick?: () => void;
  activeAddress?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onConnectWalletClick,
  activeAddress 
}) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className="fixed-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>Credo</Link>
        
        <div className="nav-actions">
          {/* Optional: Only show wallet commands if appropriate props are passed in */}
          {onConnectWalletClick && (
            <button 
              className="btn-modern btn-ghost"
              onClick={onConnectWalletClick}
            >
              {activeAddress ? 'Manage Wallet' : 'Connect Wallet'}
            </button>
          )}
          
          {!isDashboard && (
            <>
              <Link to="/login" className="btn-modern btn-ghost block" style={{ marginLeft: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Log In
              </Link>
              <Link to="/signup" className="btn-modern btn-primary block" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
