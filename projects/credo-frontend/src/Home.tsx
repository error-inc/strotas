// src/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
// import AppCalls from './components/AppCalls'

import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import Footer from './components/layout/Footer'
import AuthModal, { AuthMode } from './components/auth/AuthModal'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  
  // Auth Modal State
  const [authMode, setAuthMode] = useState<AuthMode>(null)

  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleDemoModal = () => {
    setOpenDemoModal(!openDemoModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  const handleLoginClick = () => setAuthMode('login')
  const handleSignupClick = () => setAuthMode('signup')
  const closeAuthModal = () => setAuthMode(null)

  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar 
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
        onConnectWalletClick={toggleWalletModal}
        activeAddress={activeAddress ?? undefined}
      />
      
      <main className="flex-grow">
        <Hero 
          onConnectWalletClick={toggleWalletModal}
          onTransactDemoClick={toggleDemoModal}
          onAppCallsDemoClick={toggleAppCallsModal}
          activeAddress={activeAddress ?? undefined}
        />
      </main>

      <Footer />

      {/* Modals placed outside the main layout flow */}
      <AuthModal mode={authMode} onClose={closeAuthModal} />
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
      {/* <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} /> */}
    </div>
  )
}

export default Home
