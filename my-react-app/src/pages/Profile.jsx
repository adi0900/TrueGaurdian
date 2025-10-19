import { useState, useEffect } from 'react'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    checkSignInStatus()
  }, [])

  const checkSignInStatus = () => {
    // Try to get Chrome identity
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.getProfileUserInfo((userInfo) => {
        if (userInfo.email) {
          setUser({
            email: userInfo.email,
            id: userInfo.id
          })
          setIsSignedIn(true)
        } else {
          setUser(null)
          setIsSignedIn(false)
        }
        setLoading(false)
      })
    } else {
      // Browser testing fallback
      setUser({
        email: 'demo@trueguardian.com',
        id: 'demo123'
      })
      setIsSignedIn(true)
      setLoading(false)
    }
  }

  const handleSignIn = () => {
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Sign-in error:', chrome.runtime.lastError)
          alert('Sign-in failed. Please try again.')
        } else {
          checkSignInStatus()
        }
      })
    } else {
      // Demo sign-in for browser testing
      alert('Chrome Identity API not available. Showing demo profile.')
      setUser({
        email: 'demo@trueguardian.com',
        id: 'demo123'
      })
      setIsSignedIn(true)
    }
  }

  const handleSignOut = () => {
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.clearAllCachedAuthTokens(() => {
        setUser(null)
        setIsSignedIn(false)
      })
    } else {
      setUser(null)
      setIsSignedIn(false)
    }
  }

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg fade-in-0">
          Your Profile
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto fade-in-200">
          Manage your account and preferences.
        </p>

        {loading ? (
          <div className="text-white text-xl fade-in-400">Loading profile...</div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl fade-in-400">
            {isSignedIn && user ? (
              <div>
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
                <p className="text-white/80 mb-6">{user.email}</p>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 text-left">
                    <p className="text-white/70 text-sm">User ID</p>
                    <p className="text-white font-mono">{user.id}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-left">
                    <p className="text-white/70 text-sm">Account Status</p>
                    <p className="text-green-400 font-semibold">Active</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Not Signed In</h2>
                <p className="text-white/80 mb-8">Sign in to access your profile and sync your data across devices.</p>
                <button
                  onClick={handleSignIn}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign In with Chrome
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
