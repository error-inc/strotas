import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { auth } from '../../config/firebase';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);

  const { activeAddress, signTransactions } = useWallet();
  const wallet = activeAddress || '';

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termDays, setTermDays] = useState('');

  // UI state for viewing details
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setLoading(false);
        fetchLoans();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchLoans = async () => {
    try {
      const res = await fetch('http://localhost:5000/loans');
      const data = await res.json();
      setLoans(data);
    } catch(err) {
      console.log('Backend not available yet');
    }
  };

  const createLoan = async () => {
    if (!wallet || !amount || !title || !description || !termDays) {
      alert('Missing fields (ensure wallet is connected, title, amount, and term days are set)');
      return;
    }

    try {
      // For creating a loan, just record the request on-chain with a 0 ALGO transaction to oneself
      const { txn, hash } = await sendToBlockchain(
        wallet,
        wallet, // receiver is self
        0,      // 0 ALGO
        wallet + amount + Date.now()
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const result = await client.sendRawTransaction(signedTxns[0] as Uint8Array).do();

      console.log('TX ID:', result.txid);

      try {
        await fetch('http://localhost:5000/loan', {
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
      fetchLoans();
      alert('Loan created with blockchain proof 🚀');
    } catch (err) {
      console.error(err);
      alert('Blockchain failed OR user cancelled transaction');
    }
  };

  const fundLoan = async (id: number) => {
    const fundAmount = prompt('Enter amount:');
    if (!fundAmount || !wallet) return;

    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    try {
      // Lender (wallet) sends ALGO to Borrower (loan.borrower)
      const { txn, hash } = await sendToBlockchain(
        wallet,
        loan.borrower,
        Number(fundAmount),
        wallet + id.toString() + fundAmount + Date.now()
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const result = await client.sendRawTransaction(signedTxns[0] as Uint8Array).do();

      console.log('TX ID:', result.txid);

      try {
        await fetch('http://localhost:5000/fund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: id,
            wallet,
            amount: Number(fundAmount),
            txId: result.txid,
            hash,
          }),
        });
      } catch (e) {
        console.warn('Backend save failed', e);
      }

      fetchLoans();
      alert('Funding recorded on blockchain 🚀');
    } catch (err) {
      console.error(err);
      alert('Transaction failed');
    }
  };

  const viewDetails = async (loanId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/loan/${loanId}/contributions`);
      const data = await res.json();
      setSelectedLoan(loanId);
      setContributions(data);
    } catch(err) {
      console.log('Backend not available yet');
      setSelectedLoan(loanId);
      setContributions([]);
    }
  };

  const repayLoan = async (id: number) => {
    if (!wallet) return;

    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    try {
      // Fetch contributions to know who to repay
      const res = await fetch(`http://localhost:5000/loan/${id}/contributions`);
      const contributionsData = await res.json();
      
      let receiver = wallet; // default to self if no contributions found
      if (contributionsData && contributionsData.length > 0) {
        receiver = contributionsData[0].lender; // Repay the first lender (simplification for hackathon)
      }

      // Borrower (wallet) repays ALGO to Lender (receiver)
      const { txn, hash } = await sendToBlockchain(
        wallet,
        receiver,
        Number(loan.amount), // Repay the total loan amount
        'REPAY_' + id.toString() + '_' + Date.now()
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const result = await client.sendRawTransaction(signedTxns[0] as Uint8Array).do();

      console.log('REPAY TX:', result.txid);

      try {
        await fetch('http://localhost:5000/repay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: id,
            txId: result.txid,
            hash,
          }),
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
    return <div className="landing-layout min-h-screen flex flex-col justify-center items-center">Loading secure access...</div>;
  }

  const myLoans = loans.filter((l) => l.borrower === wallet);
  const otherLoans = loans.filter((l) => l.borrower !== wallet);

  const renderLoanCard = (loan: Loan, isMyLoan: boolean) => (
    <div key={loan.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '1.5rem', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>{loan.title || `Loan #${loan.id}`}</h3>
        <span style={{ 
          background: loan.status === 'open' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(156, 163, 175, 0.2)',
          color: loan.status === 'open' ? '#4ade80' : '#9ca3af',
          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
        }}>{loan.status}</span>
      </div>
      
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', minHeight: '3rem', marginBottom: '1rem' }}>{loan.description || 'No description provided'}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        <p style={{ margin: 0 }}><b>Borrower:</b> <span title={loan.borrower}>{loan.borrower?.slice(0, 8)}...{loan.borrower?.slice(-8)}</span></p>
        <p style={{ margin: 0 }}><b>Amount:</b> {loan.amount}</p>
        <p style={{ margin: 0 }}><b>Interest:</b> {loan.interest_rate}%</p>
        <p style={{ margin: 0 }}><b>Term:</b> {loan.term_days} days</p>
        <p style={{ margin: 0 }}><b>Funded:</b> <span style={{ color: '#4ade80' }}>{loan.funded}</span></p>
        <p style={{ margin: 0, gridColumn: '1 / -1', wordBreak: 'break-all' }}><b>TxId:</b> {loan.txId}</p>
      </div>

      <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--accent-primary)', height: '8px', borderRadius: '4px', width: `${Math.min(100, (loan.funded / loan.amount) * 100)}%` }}></div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {loan.status !== 'funded' && loan.status !== 'repaid' && !isMyLoan && (
          <button className="btn-modern btn-primary" onClick={() => fundLoan(loan.id)}>
            Fund Loan
          </button>
        )}
        {isMyLoan && loan.status === 'funded' && (
          <button className="btn-modern btn-primary" onClick={() => repayLoan(loan.id)}>
            Repay Loan
          </button>
        )}
        <button 
          className="btn-modern btn-ghost" 
          onClick={() => {
            if (selectedLoan === loan.id) {
              setSelectedLoan(null);
            } else {
              viewDetails(loan.id);
            }
          }}
        >
          {selectedLoan === loan.id ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {selectedLoan === loan.id && (
        <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Contributions</h4>
          {contributions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No contributions yet</p>}
          {contributions.map((c, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '10px', fontSize: '0.85rem' }}>
              <p style={{ margin: '2px 0' }}><b>Wallet:</b> {c.lender}</p>
              <p style={{ margin: '2px 0' }}><b>Amount:</b> {c.amount}</p>
              <p style={{ margin: '2px 0', wordBreak: 'break-all' }}><b>TxId:</b> {c.txId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-start justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-6xl">
          
          <div className="text-center mb-8">
            <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Lending Dashboard</h1>
            <p className="hero-subtitle mb-4">Request and support community loans seamlessly.</p>
            {!wallet && (
              <p style={{ color: '#ef4444' }}>Please connect your wallet using the button in the top right to create or fund loans.</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: '2rem' }}>
            {/* Create Loan Section */}
            <div>
              <div className="glass-panel sticky top-24" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', color: 'white' }}>Request a Loan</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Title</label>
                    <input className="form-input" style={{ width: '100%', margin: 0 }} placeholder="e.g. Farm Seeds" value={title} onChange={(e) => setTitle(e.target.value)} type="text" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Description</label>
                    <textarea className="form-input" style={{ width: '100%', margin: 0, minHeight: '80px', resize: 'vertical' }} placeholder="Why do you need the loan?" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Amount</label>
                      <input className="form-input" style={{ width: '100%', margin: 0 }} placeholder="10" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Interest (%)</label>
                      <input className="form-input" style={{ width: '100%', margin: 0 }} placeholder="5.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} type="number" step="0.1" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Term (Days)</label>
                    <input className="form-input" style={{ width: '100%', margin: 0 }} placeholder="30" value={termDays} onChange={(e) => setTermDays(e.target.value)} type="number" />
                  </div>
                  <button className="btn-modern btn-primary mt-4" style={{ width: '100%' }} onClick={createLoan} disabled={!wallet}>
                    Submit Request
                  </button>
                </div>
              </div>
            </div>

            {/* Loans Display */}
            <div>
              {/* Other Loans */}
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'white' }}>Available to Fund</h2>
                {otherLoans.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No available loans to fund right now.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {otherLoans.map(loan => renderLoanCard(loan, false))}
                  </div>
                )}
              </div>

              {/* My Loans */}
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'white' }}>My Loans</h2>
                {myLoans.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>You haven't requested any loans.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {myLoans.map(loan => renderLoanCard(loan, true))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
