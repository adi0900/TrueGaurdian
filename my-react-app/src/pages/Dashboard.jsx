import { useState, useEffect } from 'react'

function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to fetch data from Chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['savedData'], (result) => {
        if (result.savedData) {
          setData(result.savedData)
        } else {
          // Fallback to mock data
          setData(getMockData())
        }
        setLoading(false)
      })
    } else {
      // Browser testing fallback
      setData(getMockData())
      setLoading(false)
    }
  }, [])

  const getMockData = () => [
    { id: 1, session: 'Session 1', metric: '100 saves', timestamp: '2025-10-15' },
    { id: 2, session: 'Session 2', metric: '85 saves', timestamp: '2025-10-16' },
    { id: 3, session: 'Session 3', metric: '120 saves', timestamp: '2025-10-17' },
    { id: 4, session: 'Session 4', metric: '95 saves', timestamp: '2025-10-18' },
    { id: 5, session: 'Session 5', metric: '110 saves', timestamp: '2025-10-19' },
  ]

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center px-4">
      <div className="max-w-6xl w-full mx-auto text-center fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg fade-in-0">
          Dashboard
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto fade-in-200">
          View your saved data and activity metrics from the Chrome extension.
        </p>

        {loading ? (
          <div className="text-white text-xl fade-in-400">Loading...</div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl overflow-hidden fade-in-400">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Session</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Metric</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{item.id}</td>
                      <td className="px-6 py-4 text-sm text-white">{item.session}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{item.metric}</td>
                      <td className="px-6 py-4 text-sm text-white/80">{item.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
