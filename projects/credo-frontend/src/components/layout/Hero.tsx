import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-glow"></div>
      
      <div className="hero-content glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
        <h1 className="hero-title">
          Welcome to <span className="text-gradient">AlgoKit 🙂</span>
        </h1>
        
        <p className="hero-subtitle">
          This starter has been generated using the official AlgoKit React template. 
          Experience a sleek, industry-standard interface with seamless blockchain integration.
        </p>

        <div className="hero-actions">
          <a
            className="btn-modern btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/algorandfoundation/algokit-cli"
          >
            Read Documentation
          </a>
          
          <Link to="/login" className="btn-modern btn-primary">
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
