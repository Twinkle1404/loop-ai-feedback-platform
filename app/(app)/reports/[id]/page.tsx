'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Printer,
  Sparkles,
  FileText,
  User,
  Quote,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'

interface ReportDetail {
  id: string
  title: string
  periodStart: string
  periodEnd: string
  createdAt: string
  generatedBy?: {
    name: string | null
    email: string
  } | null
  contentJson: {
    stats?: {
      totalItems?: number
      sentiment?: {
        positive?: number
        neutral?: number
        negative?: number
      }
      currentPeriod?: {
        total?: number
        positive?: number
        neutral?: number
        negative?: number
        percentNegative?: number
      }
      previousPeriod?: {
        total?: number
        positive?: number
        neutral?: number
        negative?: number
        percentNegative?: number
      }
      topThemes?: Array<{
        name: string
        count: number
      }>
      representativeQuotes?: Array<{
        quote?: string
        content?: string
        sentiment?: string
        channel?: string
      }>
      representativeFeedback?: Array<{
        quote?: string
        content?: string
        sentiment?: string
        channel?: string
      }>
    }
    narrative?:
      | {
          executiveSummary?: string
          themeHighlights?: string
          sentimentAnalysis?: string
          recommendedActions?: string[] | string
        }
      | string
  }
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { error: toastError } = useToast()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      setLoading(true)
      try {
        const res = await fetch(`/api/reports/${resolvedParams.id}`)
        if (!res.ok) {
          throw new Error('Report not found')
        }
        const data = await res.json()
        setReport(data)
      } catch (err: unknown) {
        toastError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [resolvedParams.id, toastError])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-24 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
        <FileText className="w-12 h-12 text-zinc-400 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Report Not Found</h2>
        <p className="text-xs text-zinc-500">
          The requested executive Voice-of-Customer report does not exist or you do not have permission to view it.
        </p>
        <Link href="/reports">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Reports
          </Button>
        </Link>
      </div>
    )
  }

  const dtCreated = new Date(report.createdAt)
  const dtStart = new Date(report.periodStart)
  const dtEnd = new Date(report.periodEnd)

  const formattedPeriod = `${!isNaN(dtStart.getTime()) ? dtStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : report.periodStart} – ${!isNaN(dtEnd.getTime()) ? dtEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : report.periodEnd}`
  const formattedCreated = !isNaN(dtCreated.getTime()) ? dtCreated.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''

  const stats = report.contentJson?.stats
  const narrative = report.contentJson?.narrative

  const totalVol = stats?.totalItems ?? stats?.currentPeriod?.total ?? 0
  const posCount = stats?.currentPeriod?.positive ?? stats?.sentiment?.positive ?? 0
  const neuCount = stats?.currentPeriod?.neutral ?? stats?.sentiment?.neutral ?? 0
  const negCount = stats?.currentPeriod?.negative ?? stats?.sentiment?.negative ?? 0
  const negRatio =
    stats?.currentPeriod?.percentNegative ??
    (totalVol > 0 ? Math.round((negCount / totalVol) * 100) : 0)

  const quotes = stats?.representativeQuotes || stats?.representativeFeedback || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/reports">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Reports
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          icon={<Printer className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Print / Export PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>

      {/* Report Document Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span>Voice of Customer Executive Report</span>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {report.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-2 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Period: <strong>{formattedPeriod}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Generated by <strong>{report.generatedBy?.name || report.generatedBy?.email || 'Admin'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Published: <strong>{formattedCreated}</strong></span>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Total Volume</span>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {totalVol}
            </p>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">records</span>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Positive</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
              {posCount}
            </p>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">items</span>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Neutral</span>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
              {neuCount}
            </p>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">items</span>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Negative Ratio</span>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
              {negRatio}%
            </p>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">{negCount} negative</span>
          </div>
        </div>
      )}

      {/* Report Narrative Sections */}
      {narrative && (
        <Card className="p-5 sm:p-8 space-y-6">
          {typeof narrative === 'string' ? (
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-200 font-normal">
              {narrative}
            </div>
          ) : (
            <div className="space-y-6 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {narrative.executiveSummary && (
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    Executive Summary
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {narrative.executiveSummary}
                  </p>
                </div>
              )}

              {narrative.themeHighlights && (
                <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
                    Theme Highlights &amp; Emerging Issues
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {narrative.themeHighlights}
                  </p>
                </div>
              )}

              {narrative.sentimentAnalysis && (
                <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                    Sentiment Analysis
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {narrative.sentimentAnalysis}
                  </p>
                </div>
              )}

              {narrative.recommendedActions && (
                <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Recommended Action Items
                  </h3>
                  {Array.isArray(narrative.recommendedActions) ? (
                    <ul className="space-y-1.5 list-disc pl-5">
                      {narrative.recommendedActions.map((action, i) => (
                        <li key={i} className="text-zinc-700 dark:text-zinc-300">
                          {action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-700 dark:text-zinc-300">{narrative.recommendedActions}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Representative Customer Quotes */}
      {quotes.length > 0 && (
        <Card className="p-5 sm:p-8 space-y-4">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Quote className="w-4 h-4 text-indigo-500 shrink-0" />
            Notable Customer Verbatim Quotes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quotes.map((q, i) => {
              const content = q.content || q.quote || ''
              const sentiment = q.sentiment || 'Feedback'
              const channel = (q.channel || 'direct').replace(/_/g, ' ')
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-2"
                >
                  <p className="italic text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    &ldquo;{content}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 capitalize pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <span>Channel: {channel}</span>
                    <span>{sentiment}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
