import { useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import Team from './pages/Team'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Profile from './pages/Profile'

function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard')

  const navItems = ['Dashboard', 'Team', 'Projects', 'Reports', 'Profile']

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />
      case 'Team':
        return <Team />
      case 'Projects':
        return <Projects />
      case 'Reports':
        return <Reports />
      case 'Profile':
        return <Profile />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">TrueGuardian</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item
                        ? 'bg-blue-600 text-white'
                        : 'text-white hover:bg-white/10 hover:text-blue-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-white p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="pt-16">
        {renderPage()}
      </div>
    </div>
  )
}

export default App
