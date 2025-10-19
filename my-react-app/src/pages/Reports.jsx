import { useState, useEffect } from 'react'

function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalSaves, setTotalSaves] = useState(0)

  useEffect(() => {
    // Try to fetch reports from Chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['analyticsData'], (result) => {
        if (result.analyticsData) {
          setReports(result.analyticsData)
          calculateTotal(result.analyticsData)
        } else {
          const mockData = getMockReports()
          setReports(mockData)
          calculateTotal(mockData)
        }
        setLoading(false)
      })
    } else {
      const mockData = getMockReports()
      setReports(mockData)
      calculateTotal(mockData)
      setLoading(false)
    }
  }, [])

  const getMockReports = () => [
    { date: '2025-10-15', saves: 45, category: 'Research' },
    { date: '2025-10-16', saves: 38, category: 'Development' },
    { date: '2025-10-17', saves: 52, category: 'Design' },
    { date: '2025-10-18', saves: 41, category: 'Testing' },
    { date: '2025-10-19', saves: 47, category: 'Documentation' },
  ]

  const calculateTotal = (data) => {
    const total = data.reduce((sum, item) => sum + item.saves, 0)
    setTotalSaves(total)
  }

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl w-full mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg fade-in-0">
          Data Reports
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto fade-in-200">
          Analytics and insights from your extension activity.
        </p>

        {loading ? (
          <div className="text-white text-xl fade-in-400">Loading reports...</div>
        ) : (
          <div className="fade-in-400">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-white/70 text-sm font-semibold mb-2">Total Saves</h3>
                <p className="text-4xl font-bold text-white">{totalSaves}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-lg p-6 border border-blue-500/30">
                <h3 className="text-white/70 text-sm font-semibold mb-2">Days Tracked</h3>
                <p className="text-4xl font-bold text-white">{reports.length}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-md rounded-lg p-6 border border-pink-500/30">
                <h3 className="text-white/70 text-sm font-semibold mb-2">Avg per Day</h3>
                <p className="text-4xl font-bold text-white">{Math.round(totalSaves / reports.length)}</p>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Saves</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {reports.map((report, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-white">{report.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-white">{report.saves}</td>
                        <td className="px-6 py-4 text-sm text-white/80">{report.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
