import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'
import { useAuth } from '../hooks/useAuth'
import ProfileSection from './ProfileSection'

const PLANS = [
  { id: '1_week', label: '1 Week', price: '₦10,000' },
  { id: '1_month', label: '1 Month', price: '₦60,000' },
]

function SubscriptionModal() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  async function handlePlan(planId) {
    setLoading(planId)
    setError(null)
    try {
      const res = await client.post('/payments/initialize', { plan: planId })
      window.location.href = res.data.authorization_url
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong'
      setError(msg)
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md mx-4 text-center">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
        <p className="text-sm text-gray-500 mb-6">Subscribe to continue using the app.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handlePlan(plan.id)}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading === plan.id ? 'Redirecting...' : `${plan.label} — ${plan.price}`}
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="mt-6 text-sm text-gray-400 hover:text-red-500 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState(null)
  const [subLoaded, setSubLoaded] = useState(false)
  const [remainingDays, setRemainingDays] = useState(null)
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentMsg, setPaymentMsg] = useState('')

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await client.get('/subscription/current')
      setSub(res.data.subscription)
    } catch {
      // ignore
    } finally {
      setSubLoaded(true)
    }
  }, [])

  useEffect(() => {
    client.get('/tasks')
      .then((res) => setTasks(res.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false))

    const params = new URLSearchParams(window.location.search)
    const ref = params.get('reference')

    if (ref) {
      window.history.replaceState({}, '', '/dashboard')
      setPaymentRef(ref)
      setAwaitingPayment(true)
      setPaymentMsg('Verifying payment...')
    }

    fetchSubscription()
  }, [fetchSubscription])

  useEffect(() => {
    if (!sub || sub.status !== 'active') {
      setRemainingDays(null)
      return
    }

    const startSecs = sub.remaining_seconds
    const startTime = Date.now()

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const rem = Math.max(0, startSecs - elapsed)
      const days = Math.floor(rem / 86400)
      setRemainingDays(days)
      if (rem <= 0) fetchSubscription()
    }

    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [sub, fetchSubscription])

  useEffect(() => {
    if (!awaitingPayment || !paymentRef) return

    const poll = setInterval(async () => {
      try {
        const res = await client.post('/payments/verify', { reference: paymentRef })
        if (res.data.subscription) {
          setSub(res.data.subscription)
          setAwaitingPayment(false)
        }
      } catch {
        // payment not yet confirmed
      }
    }, 3000)

    return () => clearInterval(poll)
  }, [awaitingPayment, paymentRef])

  const showModal = subLoaded && !awaitingPayment && (!sub || sub.remaining_seconds <= 0)

  return (
    <div className={`min-h-screen bg-gray-50 ${showModal ? 'overflow-hidden h-screen' : ''}`}>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>GIGO</h1>
          </div>
          <ProfileSection remainingDays={remainingDays} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {awaitingPayment && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-indigo-700 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 shrink-0" />
            {paymentMsg}
          </div>
        )}

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

      {showModal && (
        <SubscriptionModal />
      )}
    </div>
  )
}
