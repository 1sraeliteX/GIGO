import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return email ? email[0].toUpperCase() : '?'
}

export default function ProfileSection({ remainingDays }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const initials = getInitials(user?.name, user?.email)

  async function handlePlan(planId) {
    setLoading(planId)
    try {
      const res = await client.post('/payments/initialize', { plan: planId })
      window.location.href = res.data.authorization_url
    } catch {
      setLoading(null)
    } finally {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5"
      >
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center hover:bg-indigo-700 transition shrink-0">
          {initials}
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          {remainingDays !== null && (
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-700 tabular-nums">
                {remainingDays} day{remainingDays !== 1 ? 's' : ''} left
              </span>
            </div>
          )}

          <div className="py-1">
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Subscription</p>
            <button
              onClick={() => handlePlan('1_week')}
              disabled={loading !== null}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loading === '1_week' ? 'Redirecting...' : '1 Week Plan — ₦10,000'}
            </button>
            <button
              onClick={() => handlePlan('1_month')}
              disabled={loading !== null}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loading === '1_month' ? 'Redirecting...' : '1 Month Plan — ₦60,000'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
