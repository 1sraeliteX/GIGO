import { useState, useEffect, useCallback, useMemo } from 'react'
import client from '../api/client'
import { useAuth } from '../hooks/useAuth'
import ProfileSection from './ProfileSection'

const PLANS = [
  { id: '1_week', label: '1 Week', price: '₦10,000' },
  { id: '1_month', label: '1 Month', price: '₦60,000' },
]

const FILTERS = ['All', 'Audio', 'Image', 'Mango', 'Multimodal', 'Text', 'Video']

const TAG_STYLES = {
  audio: 'bg-emerald-100 text-emerald-700',
  image: 'bg-violet-100 text-violet-700',
  text: 'bg-amber-100 text-amber-800',
  video: 'bg-cyan-100 text-cyan-700',
  multimodal: 'bg-indigo-100 text-indigo-700',
  mango: 'bg-orange-100 text-orange-700',
}

const NAV_ITEMS = [
  {
    label: 'Tasks',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'QA Feedback',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const MOCK_TASKS = [
  {
    id: 1,
    title: 'Language Proficiency Survey',
    taskId: '268210-language-proficiency-survey',
    description: 'Collect and analyze audio samples to assess language proficiency across multiple dialects and regions.',
    tags: ['audio', 'text'],
    difficulty: 'intermediate',
    status: 'available',
  },
  {
    id: 2,
    title: 'Image Classification Dataset',
    taskId: '894532-image-classification',
    description: 'Label objects and scenes in a diverse set of images for training computer vision models.',
    tags: ['image'],
    difficulty: 'beginner',
    status: 'available',
  },
  {
    id: 3,
    title: 'Video Scene Description',
    taskId: '451278-video-scene-desc',
    description: 'Watch video clips and provide detailed descriptions of scenes, actions, and events occurring in each clip.',
    tags: ['video'],
    difficulty: 'intermediate',
    status: 'available',
  },
  {
    id: 4,
    title: 'Multimodal Sentiment Analysis',
    taskId: '723916-multimodal-sentiment',
    description: 'Analyze text, audio, and visual cues to determine the sentiment expressed in each sample.',
    tags: ['multimodal', 'text'],
    difficulty: 'advanced',
    status: 'available',
  },
  {
    id: 5,
    title: 'Audio Transcription Batch',
    taskId: '156789-audio-transcription',
    description: 'Transcribe spoken audio content into accurate written text across various languages and accents.',
    tags: ['audio'],
    difficulty: 'intermediate',
    status: 'available',
  },
  {
    id: 6,
    title: 'Visual Question Answering',
    taskId: '342567-visual-qa',
    description: 'Answer natural language questions based on the visual content of provided images.',
    tags: ['image', 'multimodal'],
    difficulty: 'advanced',
    status: 'available',
  },
  {
    id: 7,
    title: 'Mango Ripeness Detection',
    taskId: '678234-mango-ripeness',
    description: 'Classify mango images by ripeness stage and identify visual quality indicators.',
    tags: ['mango', 'image'],
    difficulty: 'intermediate',
    status: 'available',
  },
  {
    id: 8,
    title: 'Text Translation Project',
    taskId: '901345-text-translation',
    description: 'Translate text content between multiple language pairs while preserving meaning and context.',
    tags: ['text'],
    difficulty: 'intermediate',
    status: 'available',
  },
  {
    id: 9,
    title: 'Video Annotation Pipeline',
    taskId: '234567-video-annotation',
    description: 'Annotate video frames with bounding boxes, labels, and temporal event markers.',
    tags: ['video'],
    difficulty: 'advanced',
    status: 'available',
  },
  {
    id: 10,
    title: 'Cross-modal Retrieval Task',
    taskId: '789012-cross-modal',
    description: 'Match related content across different modalities including text, image, and audio.',
    tags: ['multimodal'],
    difficulty: 'advanced',
    status: 'available',
  },
  {
    id: 11,
    title: 'Speech-to-Text Conversion',
    taskId: '456789-speech-to-text',
    description: 'Convert speech recordings from various speakers and accents into accurate written text.',
    tags: ['audio'],
    difficulty: 'beginner',
    status: 'available',
  },
  {
    id: 12,
    title: 'Mango Variety Classification',
    taskId: '123456-mango-variety',
    description: 'Identify and classify different mango varieties based on visual characteristics in images.',
    tags: ['mango', 'image'],
    difficulty: 'beginner',
    status: 'available',
  },
]

const DIFFICULTY_COLORS = {
  beginner: 'text-emerald-600',
  intermediate: 'text-amber-600',
  advanced: 'text-red-600',
}

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
        <button onClick={logout} className="mt-6 text-sm text-gray-400 hover:text-red-500 transition">
          Logout
        </button>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks] = useState(MOCK_TASKS)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const expired = remainingDays !== null && remainingDays <= 0
  const showModal = subLoaded && !awaitingPayment && (!sub || sub.remaining_seconds <= 0 || expired)

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return tasks
    return tasks.filter((task) => task.tags.includes(activeFilter))
  }, [tasks, activeFilter])

  return (
    <div className={`min-h-screen bg-gray-50 flex ${showModal ? 'overflow-hidden h-screen' : ''}`}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              GIGO
            </h1>
            <button className="lg:hidden p-1 text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  item.label === 'Tasks'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <span className={item.label === 'Tasks' ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Available Tasks</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Select a task to begin working on.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hidden sm:block">
                View QA feedback
              </a>
              <ProfileSection remainingDays={remainingDays} hasActiveSub={remainingDays !== null && remainingDays > 0} />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="sm:hidden mb-4">
            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View QA feedback
            </a>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((filter) => {
              const lower = filter.toLowerCase()
              const isActive = filter === 'All' ? activeFilter === 'all' : activeFilter === lower
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(isActive && filter !== 'All' ? 'all' : lower)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>

          {awaitingPayment && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-indigo-700 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 shrink-0" />
              {paymentMsg}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm">No tasks match the selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTasks.map((task) => {
                const isSelected = selectedTask?.id === task.id
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(isSelected ? null : task)}
                    className={`bg-white rounded-xl border transition-all cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-indigo-300 shadow-md ring-1 ring-indigo-200'
                        : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    <div className="p-4 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{task.title}</h3>
                      <p className="text-xs text-gray-400 mb-2 font-mono">{task.taskId}</p>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{task.description}</p>
                      {task.difficulty && (
                        <span
                          className={`inline-block mt-2 text-[10px] uppercase tracking-wider font-semibold ${
                            DIFFICULTY_COLORS[task.difficulty] || 'text-gray-500'
                          }`}
                        >
                          {task.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            TAG_STYLES[tag] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {showModal && <SubscriptionModal />}
    </div>
  )
}
