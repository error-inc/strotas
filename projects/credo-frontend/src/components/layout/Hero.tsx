import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-grid" aria-hidden />
      <div className="hero-glow hero-glow--secondary" aria-hidden />
      <div className="hero-glow" aria-hidden />
      <div className="hero-shimmer" aria-hidden />

      <div className="hero-content glass-panel hero-content-panel landing-hero-shell">
        <div className="hero-brand landing-hero-in">
          <span className="hero-brand-mark">Credo</span>
          <span className="hero-brand-glow" aria-hidden />
        </div>
        <p className="hero-eyebrow landing-hero-in landing-hero-in--1">Algorand · On-chain credit</p>
        <h1 className="hero-title landing-hero-in landing-hero-in--2">
          Lend and borrow with{' '}
          <span className="text-gradient text-gradient--live">trust you can verify</span>
        </h1>
        <p className="hero-subtitle landing-hero-in landing-hero-in--3">
          Transparent loan marketplace: publish requests, fund peers, and settle repayments with blockchain-backed
          receipts—not opaque spreadsheets.
        </p>
        <div className="hero-chips landing-hero-in landing-hero-in--chips" aria-label="Key features">
          <span className="hero-chip hero-chip--cyan">ALGO settlements</span>
          <span className="hero-chip hero-chip--violet">Wallet-native</span>
          <span className="hero-chip hero-chip--cyan">On-chain receipts</span>
          <span className="hero-chip hero-chip--violet">P2P marketplace</span>
        </div>
        <div className="hero-actions landing-hero-in landing-hero-in--4">
          <Link to="/signup" className="btn-modern btn-primary hero-cta-primary">
            Start with Credo
          </Link>
          <Link to="/login" className="btn-modern btn-ghost">
            Sign in
          </Link>
          <a className="btn-modern btn-ghost" href="#how-it-works">
            How it works
          </a>
        </div>
        <div className="hero-metrics landing-hero-in landing-hero-in--5" aria-label="Highlights">
          <div className="hero-metric hero-metric--pop">
            <span className="hero-metric-value">On-chain</span>
            <span className="hero-metric-label">Creation &amp; funding txs</span>
          </div>
          <div className="hero-metric hero-metric--pop">
            <span className="hero-metric-value">Open</span>
            <span className="hero-metric-label">Marketplace listings</span>
          </div>
          <div className="hero-metric hero-metric--pop">
            <span className="hero-metric-value">Receipts</span>
            <span className="hero-metric-label">Printable loan records</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
