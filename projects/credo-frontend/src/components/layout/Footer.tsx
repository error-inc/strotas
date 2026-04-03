import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-col">
          <h3>Credo Platform</h3>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">News</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h3>Resources</h3>
          <ul className="footer-links">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Community</a></li>
            <li><a href="#">Tutorials</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Legal</h3>
          <ul className="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Security</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Credo by AlgoKit Starter. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
