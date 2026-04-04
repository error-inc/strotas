import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { auth } from '../../config/firebase';
import { BACKEND_URL } from '../config/api';
import { onAuthStateChanged } from 'firebase/auth';
import { useWallet } from '@txnlab/use-wallet-react';
import { sendToBlockchain } from '../utils/blockchain';
import algosdk from 'algosdk';

const CreateLoanRequest: React.FC = () => {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const { activeAddress, signTransactions } = useWallet();
  const wallet = activeAddress || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termDays, setTermDays] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/login');
      else setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const createLoan = async () => {
    if (!wallet || !amount || !title || !description || !termDays) {
      setFormError('Please fill in all required fields and connect your wallet.');
      return;
    }
    setFormError('');
    setFormLoading(true);

    try {
      const { txn, hash } = await sendToBlockchain(
        wallet,
        wallet,
        0,
        wallet + amount + Date.now()
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const result = await client.sendRawTransaction(signedTxns[0] as Uint8Array).do();

      try {
        await fetch(`${BACKEND_URL}/loan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet,
            title,
            description,
            amount: Number(amount),
            interest_rate: Number(interestRate) || 0,
            term_days: Number(termDays),
            txId: result.txid,
            hash,
          }),
        });
      } catch (e) {
        console.warn('Backend save failed', e);
      }

      setAmount('');
      setTitle('');
      setDescription('');
      setInterestRate('');
      setTermDays('');
      navigate('/dashboard');
      alert('Loan created with blockchain proof.');
    } catch (err) {
      console.error(err);
      setFormError('Transaction failed or was cancelled.');
    } finally {
      setFormLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(56, 189, 248, 0.2)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Verifying access...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: '88px', paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 1.5rem' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              transition: 'var(--transition)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </Link>

          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              borderRadius: '20px',
            }}
          >
            <div style={{ marginBottom: '1.75rem' }}>
              <p
                style={{
                  margin: '0 0 0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                New listing
              </p>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Create a <span className="text-gradient">loan request</span>
              </h1>
              <p style={{ margin: '0.75rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>
                Publish your terms on-chain. Lenders discover your request in the marketplace once it is live.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="e.g. Equipment upgrade"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                />
              </div>
              <div>
                <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="What the funds are for, timeline, and any context for lenders."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                    Amount (ALGO) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                    Interest (APR %)
                  </label>
                  <input
                    className="form-input"
                    placeholder="5.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    type="number"
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  Term (days) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="30"
                  value={termDays}
                  onChange={(e) => setTermDays(e.target.value)}
                  type="number"
                />
              </div>

              {formError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#f87171',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  {formError}
                </div>
              )}

              <button
                className="btn-modern btn-primary form-submit"
                style={{ marginTop: '0.25rem' }}
                type="button"
                onClick={createLoan}
                disabled={!wallet || formLoading}
              >
                {formLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    Submitting...
                  </span>
                ) : !wallet ? (
                  'Connect wallet in the header'
                ) : (
                  'Publish loan request'
                )}
              </button>

              {!wallet && (
                <p style={{ margin: 0, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Connect an Algorand wallet from the navbar to sign your creation transaction.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateLoanRequest;
