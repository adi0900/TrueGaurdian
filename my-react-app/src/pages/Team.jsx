function Team() {
  const teamMembers = [
    { id: 1, name: 'Alice Johnson', role: 'Lead Developer', avatar: '👩‍💻' },
    { id: 2, name: 'Bob Smith', role: 'UI/UX Designer', avatar: '👨‍🎨' },
    { id: 3, name: 'Carol Davis', role: 'Product Manager', avatar: '👩‍💼' },
    { id: 4, name: 'David Chen', role: 'Backend Engineer', avatar: '👨‍💻' },
    { id: 5, name: 'Emma Wilson', role: 'QA Engineer', avatar: '👩‍🔧' },
    { id: 6, name: 'Frank Miller', role: 'DevOps Specialist', avatar: '👨‍🔬' },
  ]

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl w-full mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg fade-in-0">
          Our Team
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto fade-in-200">
          Meet the talented individuals behind TrueGuardian.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in-400">
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 hover:bg-white/15 transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-6xl mb-4">{member.avatar}</div>
              <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
              <p className="text-white/80">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Team
