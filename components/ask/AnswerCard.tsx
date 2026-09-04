'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { MessageSquareQuote, ShieldCheck, Quote, ChevronDown, ChevronUp, User } from 'lucide-react'

export interface SourceCitation {
  id: string
  contentSnippet: string
}

export interface QAPair {
  id: string
  question: string
  answer: string
  sources: SourceCitation[]
  timestamp: string
}

export function AnswerCard({ item }: { item: QAPair }) {
  const [expandedSources, setExpandedSources] = useState(false)

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* User Question */}
      <div className="flex items-start gap-2.5 sm:gap-3 justify-end">
        <div className="bg-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl rounded-tr-xs max-w-[85%] sm:max-w-2xl shadow-sm text-xs sm:text-sm">
          <p className="font-medium leading-relaxed break-words">{item.question}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
          <User className="w-4 h-4" />
        </div>
      </div>

      {/* AI Grounded Answer */}
      <div className="flex items-start gap-2.5 sm:gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
          <MessageSquareQuote className="w-4 h-4" />
        </div>

        <Card className="p-4 sm:p-6 max-w-full sm:max-w-3xl border-indigo-100 dark:border-zinc-800 shadow-md flex-1 min-w-0">
          {/* Grounding Header */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800/80 text-[11px] sm:text-xs text-zinc-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="leading-tight">Grounded against verified workspace feedback using Gemini &amp; Claude AI</span>
          </div>

          {/* Answer Text */}
          <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 space-y-2 whitespace-pre-line font-normal break-words">
            {item.answer}
          </div>

          {/* Source Citations */}
          {item.sources && item.sources.length > 0 && (
            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  Sources &amp; Evidence ({item.sources.length} items retrieved)
                </span>
                <button
                  onClick={() => setExpandedSources(!expandedSources)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  {expandedSources ? (
                    <>
                      <span>Hide snippets</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show snippets</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {expandedSources && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {item.sources.map((src, i) => (
                    <div
                      key={src.id || i}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="font-mono">Feedback ID: {src.id}</span>
                        <span>Source #{i + 1}</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 italic">
                        &ldquo;{src.contentSnippet}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
