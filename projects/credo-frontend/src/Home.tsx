// src/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import Footer from './components/layout/Footer'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal)
  const toggleDemoModal = () => setOpenDemoModal(!openDemoModal)
  const toggleAppCallsModal = () => setAppCallsDemoModal(!appCallsDemoModal)

  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar 
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
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
      {/* <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} /> */}
    </div>
  )
}

export default Home
