import React from 'react';

interface NavbarProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onConnectWalletClick: () => void;
  activeAddress?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onLoginClick, 
  onSignupClick, 
  onConnectWalletClick,
  activeAddress 
}) => {
  return (
    <nav className="fixed-nav">
      <div className="nav-container">
        <div className="nav-logo">Credo</div>
        
        <div className="nav-actions">
          {activeAddress ? (
            <button 
              className="btn-modern btn-ghost"
              onClick={onConnectWalletClick}
            >
              Manage Wallet
            </button>
          ) : (
            <button 
              className="btn-modern btn-ghost"
              onClick={onConnectWalletClick}
            >
              Connect Wallet
            </button>
          )}
          
          <button 
            className="btn-modern btn-ghost" 
            onClick={onLoginClick}
            style={{ marginLeft: '1rem' }}
          >
            Log In
          </button>
          <button 
            className="btn-modern btn-primary" 
            onClick={onSignupClick}
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
