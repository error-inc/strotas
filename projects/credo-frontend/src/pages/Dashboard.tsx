import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { auth } from '../../config/firebase';
import { BACKEND_URL } from '../config/api';
import { onAuthStateChanged } from 'firebase/auth';
import { useWallet } from '@txnlab/use-wallet-react';
import { sendToBlockchain } from '../utils/blockchain';
import algosdk from 'algosdk';

interface Loan {
  id: number;
  borrower: string;
  title: string;
  description: string;
  amount: number;
  interest_rate: number;
  term_days: number;
  funded: number;
  status: string;
  txId: string;
  hash: string;
}

interface Contribution {
  lender: string;
  amount: number;
  txId: string;
  hash: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div style={{
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backdropFilter: 'blur(12px)',
    transition: 'var(--transition)',
  }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = color; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${color}22`; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
  >
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: `${color}22`,
      border: `1px solid ${color}44`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    open: { bg: 'rgba(74, 222, 128, 0.12)', text: '#4ade80', dot: '#4ade80' },
    funded: { bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8', dot: '#38bdf8' },
    repaid: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', dot: '#94a3b8' },
    default: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', dot: '#94a3b8' },
  };
  const c = colors[status] || colors.default;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '4px 10px', borderRadius: '100px',
      fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      display: 'flex', alignItems: 'center', gap: '5px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot, flexShrink: 0 }}></span>
      {status}
    </span>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-loans'>('marketplace');

  const { activeAddress, signTransactions } = useWallet();
  const wallet = activeAddress || '';

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termDays, setTermDays] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // UI state for viewing details
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [fundedByMe, setFundedByMe] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setLoading(false);
        // This will now run every time 'wallet' changes
        fetchLoans();
      }
    });
    return () => unsubscribe();
  }, [navigate, wallet]);
  useEffect(() => {
    if (!activeAddress) {
      // Clear personal stats when no wallet is connected
      setFundedByMe(0);
      setLoans([]); // Optional: Clear loans or keep marketplace visible
    } else {
      fetchLoans();
    }
  }, [activeAddress]);

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/loans`);
      const data: Loan[] = await res.json();
      setLoans(data);

      // Compute "Funded by Me" immediately after getting loans
      if (wallet) {
        calculateFundedByMe(data);
      }
    } catch (err) {
      console.error('Backend not available:', err);
    }
  };

  const calculateFundedByMe = async (allLoans: Loan[]) => {
    if (!wallet) return;
    try {
      // We only care about contributions made to OTHER people's loans
      const otherLoans = allLoans.filter((l) => l.borrower !== wallet);
      let totalLent = 0;

      await Promise.all(
        otherLoans.map(async (loan) => {
          try {
            const res = await fetch(`${BACKEND_URL}/loan/${loan.id}/contributions`);
            const contribs: Contribution[] = await res.json();
            // Sum only the contributions where YOU are the lender
            const myContribution = contribs
              .filter((c) => c.lender === wallet)
              .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
            totalLent += myContribution;
          } catch {
            // Silently skip if one loan fails to load contributions
          }
        })
      );
      setFundedByMe(totalLent);
    } catch (err) {
      console.error("Error calculating personal stats:", err);
    }
  };

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
            wallet, title, description,
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

      setAmount(''); setTitle(''); setDescription(''); setInterestRate(''); setTermDays('');
      fetchLoans();
      alert('Loan created with blockchain proof 🚀');
    } catch (err) {
      console.error(err);
      setFormError('Transaction failed or was cancelled.');
    } finally {
      setFormLoading(false);
    }
  };

  const fundLoan = async (id: number) => {
    const fundAmount = prompt('Enter amount to fund (ALGO):');
    if (!fundAmount || !wallet) return;

    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    try {
      const { txn, hash } = await sendToBlockchain(
        wallet, loan.borrower, Number(fundAmount),
        wallet + id.toString() + fundAmount + Date.now()
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const result = await client.sendRawTransaction(signedTxns[0] as Uint8Array).do();

      const txId = result.txid || result.txid;

      // --- NEW: Wait for confirmation (approx 3.5 seconds) ---
      await algosdk.waitForConfirmation(client, txId, 4);

      // Now save to backend
      await fetch(`${BACKEND_URL}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: id, wallet,
          amount: Number(fundAmount),
          txId: txId, hash,
        }),
      });

      // Refresh data to update stats on screen
      await fetchLoans();
      alert('Funding Successful! 🚀');
    } catch (err: any) {
      console.error(err);
      alert(`Transaction failed: ${err.message || 'Unknown error'}`);
    }
  };

  const viewDetails = async (loanId: number) => {
    if (selectedLoan === loanId) {
      setSelectedLoan(null);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/loan/${loanId}/contributions`);
      const data = await res.json();
      setSelectedLoan(loanId);
      setContributions(data);
    } catch (err) {
      setSelectedLoan(loanId);
      setContributions([]);
    }
  };

  const repayLoan = async (id: number) => {
    if (!wallet) return;

    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    try {
      const res = await fetch(`${BACKEND_URL}/loan/${id}/contributions`);
      const contributionsData = await res.json();

      let receiver = wallet;
      if (contributionsData && contributionsData.length > 0) {
        receiver = contributionsData[0].lender;
      }

      const { txn, hash } = await sendToBlockchain(
        wallet, receiver, Number(loan.amount),
        'REPAY_' + id.toString() + '_' + Date.now()
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const result = await client.sendRawTransaction(signedTxns[0] as Uint8Array).do();

      try {
        await fetch(`${BACKEND_URL}/repay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loanId: id, txId: result.txid, hash }),
        });
      } catch (e) {
        console.warn('Backend save failed', e);
      }

      fetchLoans();
      alert('Loan repaid on blockchain 🚀');
    } catch (err) {
      console.error(err);
      alert('Repayment failed');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTop: '3px solid var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Verifying access...</p>
      </div>
    );
  }

  const myLoans = loans.filter((l) => l.borrower === wallet);
  const otherLoans = loans.filter((l) => l.borrower !== wallet);

  // Funded TO Me: Money you REQUESTED and RECEIVED from others
  const fundedToMe = myLoans.reduce((acc, l) => acc + (Number(l.funded) || 0), 0);

  const openLoans = otherLoans.filter(l => l.status === 'open').length;

  const displayedLoans = activeTab === 'marketplace' ? otherLoans : myLoans;

  const renderLoanCard = (loan: Loan, isMyLoan: boolean) => {
    const fundingPercent = Math.min(100, loan.amount > 0 ? (loan.funded / loan.amount) * 100 : 0);
    return (
      <div key={loan.id} style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backdropFilter: 'blur(12px)',
        transition: 'var(--transition)',
        cursor: 'default',
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(56, 189, 248, 0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {loan.title || `Loan #${loan.id}`}
          </h3>
          <StatusBadge status={loan.status} />
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, minHeight: '2.5rem' }}>
          {loan.description || 'No description provided.'}
        </p>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Amount', value: `${loan.amount} ALGO` },
            { label: 'Interest', value: `${loan.interest_rate}%` },
            { label: 'Term', value: `${loan.term_days} days` },
            { label: 'Funded', value: `${loan.funded} ALGO` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              padding: '0.625rem 0.875rem',
            }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: label === 'Funded' ? '#4ade80' : 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Borrower */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
            {loan.borrower?.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {loan.borrower?.slice(0, 8)}...{loan.borrower?.slice(-8)}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Funding Progress</span>
            <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700 }}>{fundingPercent.toFixed(0)}%</span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', height: '6px', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
              height: '6px',
              borderRadius: '100px',
              width: `${fundingPercent}%`,
              transition: 'width 0.6s ease',
            }}></div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {loan.status !== 'funded' && loan.status !== 'repaid' && !isMyLoan && (
            <button className="btn-modern btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => fundLoan(loan.id)}>
              Fund Loan
            </button>
          )}
          {isMyLoan && loan.status === 'funded' && (
            <button className="btn-modern btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => repayLoan(loan.id)}>
              Repay Loan
            </button>
          )}
          <button
            className="btn-modern btn-ghost"
            style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            onClick={() => viewDetails(loan.id)}
          >
            {selectedLoan === loan.id ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Contributions panel */}
        {selectedLoan === loan.id && (
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '1rem',
            animation: 'slideUp 0.2s ease-out',
          }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Contributions ({contributions.length})
            </h4>
            {contributions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No contributions yet.</p>
            ) : contributions.map((c, i) => (
              <div key={i} style={{
                borderBottom: i < contributions.length - 1 ? '1px solid var(--glass-border)' : 'none',
                paddingBottom: i < contributions.length - 1 ? '0.75rem' : 0,
                marginBottom: i < contributions.length - 1 ? '0.75rem' : 0,
                fontSize: '0.8rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.lender?.slice(0, 12)}...</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>{c.amount} ALGO</span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', wordBreak: 'break-all', fontSize: '0.7rem' }}>Tx: {c.txId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: '80px' }}>

        {/* Dashboard Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '2.5rem 2rem',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Lending Dashboard
                </p>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  Credo Marketplace
                </h1>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Request, fund, and manage community loans with blockchain transparency.
                </p>
              </div>
              {!wallet && (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '12px',
                  padding: '0.875rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  maxWidth: '320px',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#fbbf24', fontWeight: 500 }}>
                    Connect your wallet to create or fund loans.
                  </p>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
            }}>
              <StatCard
                label="Open to Fund"
                value={openLoans}
                color="#818cf8"
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
              />
              <StatCard
                label="My Loans"
                value={myLoans.length}
                color="#818cf8"
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              />
              <StatCard
                label="Funded to Me (ALGO)"
                value={fundedToMe}
                color="#4ade80"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                }
              />
              <StatCard
                label="Funded by Me (ALGO)"
                value={fundedByMe}
                color="#f87171"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Left: Create Loan Form */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '1.75rem',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Request a Loan</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="form-input" style={{ width: '100%', margin: 0, boxSizing: 'border-box' }} placeholder="e.g. Farm Seeds Investment" value={title} onChange={(e) => setTitle(e.target.value)} type="text" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-input" style={{ width: '100%', margin: 0, minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Describe your loan purpose..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (ALGO) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input className="form-input" style={{ width: '100%', margin: 0, boxSizing: 'border-box' }} placeholder="10" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interest (%)</label>
                    <input className="form-input" style={{ width: '100%', margin: 0, boxSizing: 'border-box' }} placeholder="5.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} type="number" step="0.1" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Term (Days) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="form-input" style={{ width: '100%', margin: 0, boxSizing: 'border-box' }} placeholder="30" value={termDays} onChange={(e) => setTermDays(e.target.value)} type="number" />
                </div>

                {formError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}>
                    {formError}
                  </div>
                )}

                <button
                  className="btn-modern btn-primary"
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.875rem', fontSize: '0.95rem' }}
                  onClick={createLoan}
                  disabled={!wallet || formLoading}
                >
                  {formLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }}></span>
                      Submitting...
                    </span>
                  ) : !wallet ? 'Connect Wallet First' : 'Submit Loan Request'}
                </button>

                {!wallet && (
                  <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Use the "Connect Wallet" button in the navbar
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Loans browser */}
          <div>
            {/* Tab bar */}
            <div style={{
              display: 'flex',
              gap: 0,
              marginBottom: '1.5rem',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '4px',
              width: 'fit-content',
            }}>
              {[
                { key: 'marketplace', label: `Marketplace (${otherLoans.length})` },
                { key: 'my-loans', label: `My Loans (${myLoans.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    background: activeTab === tab.key
                      ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                      : 'transparent',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loans grid */}
            {displayedLoans.length === 0 ? (
              <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '4rem 2rem',
                textAlign: 'center',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {activeTab === 'marketplace' ? 'No Loans Available' : 'No Loans Yet'}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {activeTab === 'marketplace'
                    ? 'No loans are available to fund right now. Check back later!'
                    : 'You haven\'t requested any loans. Use the form to get started!'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {displayedLoans.map(loan => renderLoanCard(loan, activeTab === 'my-loans'))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
