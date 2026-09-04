'use client'

import React from 'react'
import { Search, RotateCcw } from 'lucide-react'

interface FilterBarProps {
  search: string
  onSearchChange: (val: string) => void
  channel: string
  onChannelChange: (val: string) => void
  sentiment: string
  onSentimentChange: (val: string) => void
  status: string
  onStatusChange: (val: string) => void
  onReset: () => void
}

const CHANNELS = [
  { value: '', label: 'All Channels' },
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'app_review', label: 'App Store Review' },
  { value: 'nps_survey', label: 'NPS Survey' },
  { value: 'sales_note', label: 'Sales Note' },
  { value: 'community_post', label: 'Community Post' },
]

const SENTIMENTS = [
  { value: '', label: 'All Sentiments' },
  { value: 'POS', label: 'Positive' },
  { value: 'NEU', label: 'Neutral' },
  { value: 'NEG', label: 'Negative' },
]

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ACTIONED', label: 'Actioned' },
]

export function FilterBar({
  search,
  onSearchChange,
  channel,
  onChannelChange,
  sentiment,
  onSentimentChange,
  status,
  onStatusChange,
  onReset,
}: FilterBarProps) {
  const isFiltered = search || channel || sentiment || status

  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
      {/* Search Input */}
      <div className="relative w-full sm:flex-1 min-w-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search feedback text, quotes, customer tags..."
          className="block w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
        />
      </div>

      {/* Filter Dropdowns Grid / Row */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
        {/* Channel Filter */}
        <select
          value={channel}
          onChange={(e) => onChannelChange(e.target.value)}
          className="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
        >
          {CHANNELS.map((ch) => (
            <option key={ch.value} value={ch.value} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
              {ch.label}
            </option>
          ))}
        </select>

        {/* Sentiment Filter */}
        <select
          value={sentiment}
          onChange={(e) => onSentimentChange(e.target.value)}
          className="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
        >
          {SENTIMENTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
              {s.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto col-span-2 sm:col-span-1"
        >
          {STATUSES.map((st) => (
            <option key={st.value} value={st.value} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
              {st.label}
            </option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer col-span-2 sm:col-span-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
