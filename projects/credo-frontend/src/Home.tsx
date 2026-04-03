// src/Home.tsx
import React from 'react'
import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import Footer from './components/layout/Footer'

const Home: React.FC = () => {
  return (
    <div className="landing-layout min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
      </main>

      <Footer />
    </div>
  )
}

export default Home
