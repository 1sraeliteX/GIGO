import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

export default function ProfileSection() {
  const { user, updateUser, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await client.put('/user/profile', { name })
      updateUser(res.data.user)
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.name || '')
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className="flex items-center gap-4">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition cursor-pointer"
            title="Click to edit name"
          >
            {user?.name || 'User'}
          </button>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Logout
          </button>
        </>
      )}
    </div>
  )
}
