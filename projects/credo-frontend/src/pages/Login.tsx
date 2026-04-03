import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Login: React.FC = () => {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Sync user with backend
      try {
        await fetch('http://localhost:5000/user', {
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

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center relative">
        {/* Glow effect */}
        <div className="hero-glow"></div>

        <div className="modal-content glass-panel z-10" style={{ position: 'relative', margin: '4rem 0' }}>
          <h2 className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Enter your credentials to access your account.</p>

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
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="modal-footer">
            Don't have an account?
            <Link to="/signup" className="text-accent-primary ml-1 font-semibold hover:underline" style={{ color: 'var(--accent-primary)', marginLeft: '0.25rem' }}>
              Sign up
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
