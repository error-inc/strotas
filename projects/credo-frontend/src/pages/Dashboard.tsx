import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Protected Route logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="landing-layout min-h-screen flex flex-col justify-center items-center">Loading secure access...</div>;
  }

  // Placeholder actions (we don't have wallet connection directly bound here unless we hoist it)
  // For the sake of the page, we will keep it simple as requested: "empty dashboard page"
  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="glass-panel" style={{ padding: '4rem', borderRadius: '24px', textAlign: 'center' }}>
          <h1 className="hero-title">Dashboard</h1>
          <p className="hero-subtitle mb-0">
            Welcome to your empty dashboard.
          </p>
          <p>You are successfully logged in with Firebase!</p>
          
          <button 
            className="btn-modern btn-primary mt-8"
            onClick={() => auth.signOut()}
          >
            Sign Out
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
