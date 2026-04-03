import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { BACKEND_URL } from '../config/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Sync user with backend
      try {
        await fetch(`${BACKEND_URL}/user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: userCredential.user.uid,
            email: userCredential.user.email,
          })
        });
      } catch (backendErr) {
        console.error('Failed to sync user with backend:', backendErr);
      }

      // Firebase automatically logs the user in on successful signup.
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center relative">
        <div className="hero-glow"></div>

        <div className="modal-content glass-panel z-10" style={{ position: 'relative', margin: '4rem 0' }}>
          <h2 className="modal-title">Create an Account</h2>
          <p className="modal-subtitle">Join the new decentralized frontier.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <div className="text-red-400 mb-4 text-sm font-semibold">{error}</div>}

            <button type="submit" className="btn-modern btn-primary form-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="modal-footer">
            Already have an account?
            <Link to="/login" className="text-accent-primary ml-1 font-semibold hover:underline" style={{ color: 'var(--accent-primary)', marginLeft: '0.25rem' }}>
              Log in
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;
