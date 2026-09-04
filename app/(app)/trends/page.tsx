'use client'

import React, { useState, useEffect } from 'react'
import { TrendCard, ThemeTrendItem } from '@/components/trends/TrendCard'
import { ThemeFeedbackDrawer } from '@/components/trends/ThemeFeedbackDrawer'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function TrendsPage() {
  const { error: toastError } = useToast()
  const [trends, setTrends] = useState<ThemeTrendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Drill-down drawer state
  const [selectedTheme, setSelectedTheme] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadTrends() {
      try {
        const res = await fetch(`/api/themes/trends?period=${period}`)
        if (!res.ok) {
          throw new Error('Failed to load theme trends')
        }
        const data = await res.json()
        if (!ignore) {
          setTrends(data.data || [])
          setLoading(false)
        }
      } catch {
        if (!ignore) {
          toastError('Could not load theme trends.')
          setLoading(false)
        }
      }
    }

    loadTrends()
    return () => {
      ignore = true
    }
  }, [period, refreshTrigger, toastError])

  const handleRefresh = () => {
    setLoading(true)
    setRefreshTrigger((prev) => prev + 1)
  }

  const spikes = trends.filter((t) => t.isSpiking || t.isSpike)

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Theme Trends &amp; Spike Detection
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Compare period-over-period theme volume and detect emerging feedback spikes (&gt;50% growth)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Period Toggle */}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => {
                setLoading(true)
                setPeriod('7d')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === '7d'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                setLoading(true)
                setPeriod('30d')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === '30d'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Spike Alert Banner */}
      {spikes.length > 0 && !loading && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 flex items-start gap-3.5 text-red-900 dark:text-red-200 shadow-xs">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">
              {spikes.length} Customer Feedback {spikes.length === 1 ? 'Spike' : 'Spikes'} Detected
            </h4>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
              The following themes have surged over 50% in volume compared to the previous period:{' '}
              <strong>{spikes.map((s) => s.name).join(', ')}</strong>. Click any card below to inspect the verbatim feedback.
            </p>
          </div>
        </div>
      )}

      {/* Trends Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : trends.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <Layers className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="font-semibold text-base text-zinc-700 dark:text-zinc-300">No Theme Data Available</p>
          <p className="text-xs text-zinc-400 mt-1">Ingest more feedback items to populate automated theme trend clusters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {trends.map((item, index) => {
            const id = item.themeId || item.id || item.name || `theme-${index}`
            return (
              <TrendCard
                key={`trend-card-${id}-${index}`}
                item={item}
                onClick={() => setSelectedTheme({ id, name: item.name })}
              />
            )
          })}
        </div>
      )}

      {/* Drill-down Drawer */}
      <ThemeFeedbackDrawer
        isOpen={Boolean(selectedTheme)}
        themeId={selectedTheme?.id || null}
        themeName={selectedTheme?.name || null}
        onClose={() => setSelectedTheme(null)}
      />
    </div>
  )
}
