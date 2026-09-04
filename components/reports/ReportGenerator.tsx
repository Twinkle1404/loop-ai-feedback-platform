'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'
import { Sparkles } from 'lucide-react'

interface ReportGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (reportId?: string) => void
}

export function ReportGenerator({ isOpen, onClose, onSuccess }: ReportGeneratorProps) {
  const { error: toastError, success: toastSuccess } = useToast()

  // Default to past 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const [periodStart, setPeriodStart] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [periodEnd, setPeriodEnd] = useState(today.toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodStart || !periodEnd) {
      toastError('Please choose both start and end dates.')
      return
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      toastError('Start date must be before or equal to end date.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart,
          periodEnd,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report')
      }

      toastSuccess('Voice-of-Customer report synthesized successfully!')
      onSuccess(data.id)
      onClose()
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Error generating report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Voice-of-Customer Report"
      description="Claude AI calculates real workspace statistics and writes an executive digest"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Period Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="block w-full px-3 py-2.5 sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Period End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="block w-full px-3 py-2.5 sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Zero-Hallucination Pipeline
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Project LOOP pre-computes exact totals, sentiment deltas, and theme distributions from PostgreSQL before passing them to Claude for narrative structuring.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} icon={<Sparkles className="w-4 h-4" />}>
            Generate Report
          </Button>
        </div>
      </form>
    </Modal>
  )
}
