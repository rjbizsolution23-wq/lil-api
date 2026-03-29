"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Loader2,
  Plug,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
  Trash2,
  RefreshCw,
  ExternalLink,
  Copy,
} from "lucide-react"

// Types
interface Integration {
  id: string
  name: string
  provider: string
  status: 'active' | 'pending' | 'error'
  endpointCount: number
  lastSync: string
  baseUrl: string
}

interface Endpoint {
  id: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  operationId: string
}

// Demo integrations
const demoIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Stripe Payments',
    provider: 'stripe',
    status: 'active',
    endpointCount: 142,
    lastSync: '2026-03-29T10:30:00Z',
    baseUrl: 'https://api.stripe.com/v1',
  },
  {
    id: '2',
    name: 'OpenAI',
    provider: 'openai',
    status: 'active',
    endpointCount: 28,
    lastSync: '2026-03-29T09:15:00Z',
    baseUrl: 'https://api.openai.com/v1',
  },
  {
    id: '3',
    name: 'GitHub',
    provider: 'github',
    status: 'pending',
    endpointCount: 0,
    lastSync: '',
    baseUrl: 'https://api.github.com',
  },
]

export default function DashboardPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(demoIntegrations)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [newApiUrl, setNewApiUrl] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)

  const filteredIntegrations = integrations.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.provider.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddIntegration = async () => {
    if (!newApiUrl) return

    setLoading(true)
    try {
      // Simulate API analysis
      await new Promise(r => setTimeout(r, 2000))

      const newIntegration: Integration = {
        id: crypto.randomUUID(),
        name: new URL(newApiUrl).hostname,
        provider: 'custom',
        status: 'pending',
        endpointCount: 0,
        lastSync: '',
        baseUrl: newApiUrl,
      }

      setIntegrations([...integrations, newIntegration])
      setNewApiUrl('')
      setShowNewModal(false)
      toast.success('Integration added! Analyzing endpoints...')
    } catch (error) {
      toast.error('Failed to add integration')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400">Manage your API connections</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Integration Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 hover:border-amber-500/30 transition-colors cursor-pointer"
            onClick={() => setSelectedIntegration(integration)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                <Plug className="w-6 h-6 text-amber-500" />
              </div>
              {getStatusIcon(integration.status)}
            </div>

            <h3 className="font-semibold text-white mb-1">{integration.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{integration.baseUrl}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {integration.endpointCount} endpoints
              </span>
              {integration.lastSync && (
                <span className="text-slate-500">
                  {new Date(integration.lastSync).toLocaleDateString()}
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Add new card */}
        <button
          onClick={() => setShowNewModal(true)}
          className="p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 transition-colors flex flex-col items-center justify-center min-h-[180px]"
        >
          <Plus className="w-8 h-8 text-slate-500 mb-2" />
          <span className="text-slate-400">Add new API</span>
        </button>
      </div>

      {/* New Integration Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setShowNewModal(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Add New Integration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  OpenAPI Spec URL or API Base URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.example.com/v1"
                  value={newApiUrl}
                  onChange={(e) => setNewApiUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIntegration}
                  disabled={loading || !newApiUrl}
                  className="flex-1 py-3 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze API
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Integration Detail Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedIntegration(null)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedIntegration.name}</h2>
                <p className="text-sm text-slate-400">{selectedIntegration.baseUrl}</p>
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-800/50">
                <div className="text-2xl font-bold text-white">{selectedIntegration.endpointCount}</div>
                <div className="text-sm text-slate-400">Endpoints</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <div className="text-2xl font-bold text-white">
                  {selectedIntegration.status === 'active' ? 'Connected' : 'Pending'}
                </div>
                <div className="text-sm text-slate-400">Status</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <div className="text-2xl font-bold text-white">
                  {selectedIntegration.lastSync ? new Date(selectedIntegration.lastSync).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-sm text-slate-400">Last Sync</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
              <button className="flex-1 py-3 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />
                Copy Client
              </button>
              <button className="flex-1 py-3 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Docs
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
