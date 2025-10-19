import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LaserBackground from './components/LaserBackground'

function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)
  const [laserActive, setLaserActive] = useState(false)

  const handleGetStarted = () => {
    setLaserActive(true)
    setTimeout(() => setLaserActive(false), 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
      {/* Magical glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Headline */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in-up tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            Welcome to My App
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-purple-200 mb-12 animate-fade-in-up animate-delay-200 max-w-3xl mx-auto font-light">
          Build something amazing with{' '}
          <span className="text-pink-300 font-semibold glow-text">laser-powered magic</span>{' '}
          today.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            animate-fade-in-up animate-delay-400
            relative group
            bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600
            hover:from-purple-500 hover:via-pink-500 hover:to-blue-500
            text-white font-semibold px-10 py-5 rounded-full text-lg
            transition-all duration-500
            shadow-2xl hover:shadow-purple-500/50
            transform hover:scale-110 active:scale-95
            border-2 border-purple-400/50
            ${laserActive ? 'animate-laser-pulse' : ''}
          `}
        >
          <span className="relative z-10 flex items-center gap-2">
            Get Started
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          {/* Animated glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        </button>

        {/* Floating particles/orbs */}
        <div className="mt-24 flex justify-center gap-6">
          <div className="w-3 h-3 rounded-full bg-purple-400 animate-float shadow-lg shadow-purple-400/50"></div>
          <div className="w-4 h-4 rounded-full bg-pink-400 animate-float shadow-lg shadow-pink-400/50" style={{animationDelay: '0.3s', animationDuration: '3.5s'}}></div>
          <div className="w-3 h-3 rounded-full bg-blue-400 animate-float shadow-lg shadow-blue-400/50" style={{animationDelay: '0.6s', animationDuration: '4s'}}></div>
        </div>

        {/* Unicorn magic sparkles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-purple-300 rounded-full animate-twinkle" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-pink-300 rounded-full animate-twinkle" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}}></div>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <LaserBackground />
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
      </main>
      <Footer />
    </div>
  )
}

export default App
