'use client'

import React, { useEffect, useState } from 'react'
import { X, MessageSquare, Loader2, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface ThemeFeedbackItem {
  id: string
  content: string
  channel: string
  sentiment: 'POS' | 'NEU' | 'NEG' | null
  status: string
  createdAt: string
}

interface ThemeFeedbackDrawerProps {
  themeId: string | null
  themeName: string | null
  isOpen: boolean
  onClose: () => void
}

export function ThemeFeedbackDrawer({
  themeId,
  themeName,
  isOpen,
  onClose,
}: ThemeFeedbackDrawerProps) {
  const [items, setItems] = useState<ThemeFeedbackItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadThemeFeedback() {
      if (!isOpen || !themeId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/themes/${themeId}/feedback?page=${page}&limit=10`)
        const data = await res.json()
        if (!ignore && res.ok) {
          setItems(data.data || [])
          setTotal(data.pagination?.total || 0)
          setLoading(false)
        }
      } catch {
        if (!ignore) setLoading(false)
      }
    }

    loadThemeFeedback()
    return () => {
      ignore = true
    }
  }, [isOpen, themeId, page])

  if (!isOpen || !themeId) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Theme Drill-Down
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-400">• {total} total items</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              {themeName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-400 text-xs">
              <MessageSquare className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-600" />
              <p>No feedback records found for this theme.</p>
            </div>
          ) : (
            items.map((item, i) => {
              const sentimentVariant =
                item.sentiment === 'POS'
                  ? 'positive'
                  : item.sentiment === 'NEG'
                  ? 'negative'
                  : 'neutral'

              const dt = new Date(item.createdAt)
              const formattedDate = !isNaN(dt.getTime())
                ? dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : ''

              return (
                <div
                  key={`drawer-item-${item.id}-${i}`}
                  className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2 hover:border-zinc-200 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={sentimentVariant} size="sm">
                      {item.sentiment === 'POS'
                        ? 'Positive'
                        : item.sentiment === 'NEG'
                        ? 'Negative'
                        : 'Neutral'}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                    {item.content}
                  </p>
                  <div className="text-[10px] text-zinc-400 capitalize">
                    Source: {item.channel.replace(/_/g, ' ')}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
