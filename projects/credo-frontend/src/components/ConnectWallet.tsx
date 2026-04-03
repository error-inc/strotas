import React from 'react'
import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const boxStyle: React.CSSProperties = {
  background: '#1a1b2e',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '16px',
  padding: '2rem',
  minWidth: '320px',
  maxWidth: '440px',
  width: '100%',
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  if (!openModal) return null

  return (
    <div style={overlayStyle} onClick={closeModal}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff' }}>
          Connect Wallet
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!activeAddress ? (
            wallets && wallets.length > 0 ? (
              wallets.map((wallet) => (
                <button
                  key={`provider-${wallet.id}`}
                  data-test-id={`${wallet.id}-connect`}
                  onClick={() => { wallet.connect(); closeModal(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 500,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  {!isKmd(wallet) && (
                    <img
                      alt={`wallet_icon_${wallet.id}`}
                      src={wallet.metadata.icon}
                      style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }}
                    />
                  )}
                  <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
                </button>
              ))
            ) : (
              <p style={{ color: '#aaa', textAlign: 'center' }}>No wallets available. Check network config.</p>
            )
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#a0f0a0', marginBottom: '1rem' }}>
                ✓ Connected: <strong>{activeAddress.slice(0, 8)}...{activeAddress.slice(-4)}</strong>
              </p>
              <button
                onClick={async () => {
                  const activeWallet = wallets?.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                  closeModal()
                }}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: 'rgba(255,80,80,0.15)',
                  border: '1px solid rgba(255,80,80,0.4)',
                  borderRadius: '8px',
                  color: '#ff8080',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>

        <button
          onClick={closeModal}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '0.6rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ConnectWallet
