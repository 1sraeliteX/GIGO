import { useState, useEffect } from 'react'
import client from '../api/client'
import ProfileSection from './ProfileSection'

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/tasks')
      .then((res) => setTasks(res.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>GIGO</h1>
          <ProfileSection />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition"
              >
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {task.id}
                </span>
                <span className="text-gray-700">{task.title}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
