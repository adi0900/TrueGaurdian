function Projects() {
  const projects = [
    { id: 1, name: 'Chrome Extension', status: 'Active', progress: 85 },
    { id: 2, name: 'Dashboard Analytics', status: 'In Progress', progress: 60 },
    { id: 3, name: 'Mobile App', status: 'Planning', progress: 20 },
    { id: 4, name: 'API Integration', status: 'Active', progress: 90 },
    { id: 5, name: 'Documentation', status: 'In Progress', progress: 45 },
    { id: 6, name: 'Testing Suite', status: 'Active', progress: 75 },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'In Progress':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'Planning':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl w-full mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg fade-in-0">
          Our Projects
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto fade-in-200">
          Explore our current initiatives and development progress.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in-400">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 hover:bg-white/15 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-xl font-bold text-white mb-3">{project.name}</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <p className="text-white/80 text-sm">{project.progress}% Complete</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Projects
