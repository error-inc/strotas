import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <footer className={className ? `footer-section ${className}` : 'footer-section'}>
      <div className="footer-container">
        <div className="footer-col">
          <h3>Product</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/signup">Sign up</Link></li>
            <li><a href="https://developer.algorand.org" target="_blank" rel="noopener noreferrer">Algorand docs</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Protocol</h3>
          <ul className="footer-links">
            <li><a href="/#how-it-works">How it works</a></li>
            <li><span className="footer-muted">Testnet only</span></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Legal</h3>
          <ul className="footer-links">
            <li><span className="footer-muted">Privacy &amp; terms (placeholder)</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Credo. Decentralized credit on Algorand.
      </div>
    </footer>
  );
};

export default Footer;
