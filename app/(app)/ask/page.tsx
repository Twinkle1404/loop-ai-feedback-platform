'use client'

import React, { useState } from 'react'
import { QuestionInput } from '@/components/ask/QuestionInput'
import { AnswerCard, QAPair } from '@/components/ask/AnswerCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'
import { Sparkles, MessageSquareQuote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function AskPage() {
  const { error: toastError } = useToast()
  const [history, setHistory] = useState<QAPair[]>([])
  const [loading, setLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)

  const handleAsk = async (question: string) => {
    setLoading(true)
    setCurrentQuestion(question)

    try {
      const res = await fetch('/api/insights/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate answer')
      }

      const newPair: QAPair = {
        id: Math.random().toString(36).substring(2, 9),
        question,
        answer: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
      }

      setHistory((prev) => [newPair, ...prev])
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Error asking question')
    } finally {
      setLoading(false)
      setCurrentQuestion(null)
    }
  }

  const handleClear = () => {
    setHistory([])
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Ask LOOP
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              RAG Grounded Q&amp;A
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Plain-English intelligence grounded strictly in your company&apos;s customer feedback
          </p>
        </div>

        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} icon={<Trash2 className="w-4 h-4" />}>
            Clear History
          </Button>
        )}
      </div>

      {/* Input Box */}
      <QuestionInput onSubmit={handleAsk} isLoading={loading} />

      {/* Active Loading Skeleton */}
      {loading && currentQuestion && (
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-end">
            <div className="bg-indigo-600/80 text-white p-4 rounded-2xl max-w-2xl text-sm">
              {currentQuestion}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 max-w-3xl">
              <CardSkeleton />
            </div>
          </div>
        </div>
      )}

      {/* Conversation Stream */}
      {history.length > 0 ? (
        <div className="space-y-8 pt-4">
          {history.map((item) => (
            <AnswerCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="mt-12 text-center p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <MessageSquareQuote className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Retrieval-Grounded Feedback Intelligence
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Ask LOOP uses Google Gemini 768-dimensional vector search to retrieve the most relevant feedback rows from PostgreSQL, then instructs Claude to formulate evidence-based answers with source citations.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
