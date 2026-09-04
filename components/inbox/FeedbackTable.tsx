'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'
import { useSession } from 'next-auth/react'
import { Sparkles, ChevronLeft, ChevronRight, MessageSquareOff } from 'lucide-react'

export interface FeedbackItem {
  id: string
  content: string
  channel: string
  customerLabel?: string | null
  sentiment?: 'POS' | 'NEU' | 'NEG' | null
  sentimentScore?: number | null
  status: 'NEW' | 'REVIEWED' | 'ACTIONED'
  createdAt: string
  themes?: Array<{
    theme: {
      id: string
      name: string
      color?: string | null
    }
  }>
}

interface FeedbackTableProps {
  items: FeedbackItem[]
  loading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  onPageChange: (newPage: number) => void
  onItemUpdated: () => void
}

export function FeedbackTable({
  items,
  loading,
  pagination,
  onPageChange,
  onItemUpdated,
}: FeedbackTableProps) {
  const { data: session } = useSession()
  const { error: toastError, success: toastSuccess } = useToast()
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const isViewer = session?.user?.role === 'VIEWER'

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (isViewer) return
    setStatusUpdatingId(id)
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      toastSuccess(`Status updated to ${newStatus}`)
      onItemUpdated()
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Status update failed')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleReclassify = async (id: string) => {
    if (isViewer) return
    setReclassifyingId(id)
    try {
      const res = await fetch(`/api/feedback/${id}/reclassify`, {
        method: 'POST',
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reclassify')
      }

      toastSuccess('Feedback re-classified with Claude AI!')
      onItemUpdated()
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Reclassification failed')
    } finally {
      setReclassifyingId(null)
    }
  }

  const formatChannel = (ch: string) => ch.replace(/_/g, ' ')

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-28">Sentiment</th>
              <th className="py-3.5 px-4">Feedback Content</th>
              <th className="py-3.5 px-4 w-36">Channel</th>
              <th className="py-3.5 px-4 w-44">Themes</th>
              <th className="py-3.5 px-4 w-32">Status</th>
              <th className="py-3.5 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
            {loading ? (
              <>
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
              </>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquareOff className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                    <p className="font-medium text-sm text-zinc-600 dark:text-zinc-400">No feedback found</p>
                    <p className="text-xs text-zinc-400">Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const sentimentVariant =
                  item.sentiment === 'POS'
                    ? 'positive'
                    : item.sentiment === 'NEG'
                    ? 'negative'
                    : 'neutral'

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    {/* Sentiment */}
                    <td className="py-3.5 px-4 align-top">
                      <Badge variant={sentimentVariant} size="sm">
                        {item.sentiment === 'POS'
                          ? 'Positive'
                          : item.sentiment === 'NEG'
                          ? 'Negative'
                          : item.sentiment === 'NEU'
                          ? 'Neutral'
                          : 'Unclassified'}
                      </Badge>
                    </td>

                    {/* Content & Metadata */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed font-normal">
                        {item.content}
                      </p>
                      {item.customerLabel && (
                        <span className="inline-block mt-1 text-[10px] text-zinc-400 font-medium">
                          Customer: {item.customerLabel}
                        </span>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="capitalize text-zinc-600 dark:text-zinc-400">
                        {formatChannel(item.channel)}
                      </span>
                    </td>

                    {/* Themes */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-wrap gap-1">
                        {item.themes && item.themes.length > 0 ? (
                          item.themes.map((t) => (
                            <span
                              key={t.theme.id}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-medium"
                            >
                              {t.theme.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 text-[11px] italic">No themes</span>
                        )}
                      </div>
                    </td>

                    {/* Status Workflow */}
                    <td className="py-3.5 px-4 align-top">
                      {isViewer ? (
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium capitalize">
                          {item.status.toLowerCase()}
                        </span>
                      ) : (
                        <select
                          disabled={statusUpdatingId === item.id}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="NEW">New</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="ACTIONED">Actioned</option>
                        </select>
                      )}
                    </td>

                    {/* Reclassify Action */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      {!isViewer && (
                        <button
                          disabled={reclassifyingId === item.id}
                          onClick={() => handleReclassify(item.id)}
                          title="Re-run AI classification"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Sparkles
                            className={`w-4 h-4 ${reclassifyingId === item.id ? 'animate-spin text-indigo-600' : ''}`}
                          />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && pagination.pages > 1 && (
        <div className="p-3 sm:p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 text-center sm:text-left">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total items)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
