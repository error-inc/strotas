import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero';
import Footer from './components/layout/Footer';
import LandingChainField from './components/layout/LandingChainField';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';

const Home: React.FC = () => {
  const howItWorks = useRevealOnScroll<HTMLElement>();
  const clarity = useRevealOnScroll<HTMLElement>();

  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <LandingChainField />
      <Navbar />

      <main className="flex-grow landing-main-stack">
        <Hero />

        <section id="how-it-works" className="landing-section" ref={howItWorks.ref}>
          <div className="landing-inner">
            <h2
              className={`landing-section-title landing-section-title--spotlight landing-reveal-head ${howItWorks.visible ? 'is-visible' : ''}`}
            >
              How Credo works
            </h2>
            <p className={`landing-section-lead landing-reveal-head ${howItWorks.visible ? 'is-visible' : ''}`}>
              Three steps from account to a live loan request—wallet-connected, auditable, and built for the community.
            </p>
            <div className={`landing-steps reveal-stagger ${howItWorks.visible ? 'is-visible' : ''}`}>
              <article className="landing-step glass-panel feature-pop">
                <span className="landing-step-num">1</span>
                <h3>Create your account</h3>
                <p>Sign up, connect Pera, Defly, or Exodus on Algorand testnet, and open your dashboard.</p>
              </article>
              <article className="landing-step glass-panel feature-pop">
                <span className="landing-step-num">2</span>
                <h3>Publish or fund</h3>
                <p>Post a loan request with clear terms, or browse the marketplace and fund listings you believe in.</p>
              </article>
              <article className="landing-step glass-panel feature-pop">
                <span className="landing-step-num">3</span>
                <h3>Repay with proof</h3>
                <p>When funded, repay lenders on-chain and keep digital receipts aligned with real transactions.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--accent" ref={clarity.ref}>
          <div className="landing-inner landing-split">
            <div>
              <h2
                className={`landing-section-title landing-section-title--left landing-section-title--spotlight landing-section-title--spotlight-left landing-reveal-head ${clarity.visible ? 'is-visible' : ''}`}
              >
                Built for clarity
              </h2>
              <ul className={`landing-value-list reveal-value-list ${clarity.visible ? 'is-visible' : ''}`}>
                <li className="value-feature-card">
                  <strong>Credit signals</strong>
                  <span>See borrower context with on-platform scoring to support better decisions.</span>
                </li>
                <li className="value-feature-card">
                  <strong>Single marketplace</strong>
                  <span>Switch between community listings and your own loans without leaving the dashboard.</span>
                </li>
                <li className="value-feature-card">
                  <strong>Verifiable history</strong>
                  <span>Contributions and repayments stay tied to transaction IDs you can inspect.</span>
                </li>
              </ul>
              <Link
                to="/signup"
                className={`btn-modern btn-primary landing-cta landing-reveal-cta ${clarity.visible ? 'is-visible' : ''}`}
              >
                Open the dashboard
              </Link>
            </div>
            <div className={`landing-quote glass-panel reveal-quote feature-quote-pop ${clarity.visible ? 'is-visible' : ''}`}>
              <p className="landing-quote-text">
                “We designed Credo so the first screen feels credible—then every action backs that up on-chain.”
              </p>
              <p className="landing-quote-attrib">Credo product ethos</p>
            </div>
          </div>
        </section>
      </main>

      <Footer className="landing-footer-stack" />
    </div>
  );
};

export default Home;
