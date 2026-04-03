import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { auth } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useWallet } from '@txnlab/use-wallet-react';
import { sendToBlockchain } from '../utils/blockchain';
import algosdk from 'algosdk';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // App specific states
  const { activeAddress, signTransactions } = useWallet();
  const wallet = activeAddress || '';
  const [amount, setAmount] = useState('');
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);

  const myLoans = loans.filter((l) => l.borrower === wallet);
  const otherLoans = loans.filter((l) => l.borrower !== wallet);

  // Protected Route logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!loading) {
      fetchLoans();
    }
  }, [loading]);

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
    if (!wallet || !amount) {
      alert('Missing fields (ensure wallet is connected and amount is set)');
      return;
    }

    try {
      const { txn, hash } = await sendToBlockchain(
        wallet,
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
            amount: Number(amount),
            txId: result.txid,
            hash,
          }),
        });
      } catch (e) {
        console.warn('Backend save failed', e);
      }

      setAmount('');
      fetchLoans();
      alert('Loan created with blockchain proof 🚀');
    } catch (err) {
      console.error(err);
      alert('Blockchain failed');
    }
  };

  const fundLoan = async (id: string) => {
    const fundAmount = prompt('Enter amount:');
    if (!fundAmount || !wallet) return;

    try {
      const { txn, hash } = await sendToBlockchain(
        wallet,
        wallet + id + fundAmount + Date.now()
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

  const viewDetails = async (loanId: string) => {
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

  const repayLoan = async (id: string) => {
    if (!wallet) return;

    try {
      const { txn, hash } = await sendToBlockchain(
        wallet,
        'REPAY_' + id + '_' + Date.now()
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

  const renderLoanCard = (loan: any, isMyLoan: boolean) => (
    <div key={loan.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '1.5rem', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--accent-primary)' }}>Loan {loan.id ? `#${loan.id}` : ''}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        <p style={{ margin: 0 }}><b>Borrower:</b> <span title={loan.borrower}>{loan.borrower?.slice(0, 8)}...{loan.borrower?.slice(-8)}</span></p>
        <p style={{ margin: 0 }}><b>Amount:</b> {loan.amount}</p>
        <p style={{ margin: 0 }}><b>Funded:</b> {loan.funded}</p>
        <p style={{ margin: 0 }}><b>Status:</b> <span style={{ textTransform: 'capitalize', color: loan.status === 'funded' ? '#4ade80' : 'var(--text-muted)' }}>{loan.status}</span></p>
        <p style={{ margin: 0, gridColumn: '1 / -1' }}><b>TxId:</b> {loan.txId}</p>
        <p style={{ margin: 0, gridColumn: '1 / -1', wordBreak: 'break-all' }}><b>Hash:</b> {loan.hash}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {loan.status !== 'funded' && !isMyLoan && (
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
              <p style={{ margin: '2px 0' }}><b>TxId:</b> {c.txId}</p>
              <p style={{ margin: '2px 0' }}><b>Hash:</b> {c.hash}</p>
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
        <div className="w-full max-w-4xl">
          
          <div className="text-center mb-8">
            <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Lending Dashboard</h1>
            <p className="hero-subtitle mb-4">Manage your loans and contributions.</p>
            {!wallet && (
              <p style={{ color: '#ef4444' }}>Please connect your wallet using the button in the top right to create or fund loans.</p>
            )}
          </div>

          {/* Create Loan Section */}
          <div className="glass-panel mb-8" style={{ padding: '2rem', borderRadius: '16px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Create a Loan</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: 1, minWidth: '200px', margin: 0 }}
                placeholder="Enter loan amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
              <button className="btn-modern btn-primary" onClick={createLoan} disabled={!wallet}>
                Create Loan
              </button>
            </div>
          </div>

          {/* Loans Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Other Loans */}
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Available to Fund</h2>
              {otherLoans.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No available loans to fund.</p>
              ) : (
                otherLoans.map(loan => renderLoanCard(loan, false))
              )}
            </div>

            {/* My Loans */}
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>My Loans</h2>
              {myLoans.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>You haven't created any loans.</p>
              ) : (
                myLoans.map(loan => renderLoanCard(loan, true))
              )}
            </div>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
