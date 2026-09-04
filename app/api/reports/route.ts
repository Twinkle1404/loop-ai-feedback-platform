import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { requirePermission, Permission } from '@/lib/auth'
import { generateReportNarrative, type ReportPrecomputedStats } from '@/lib/ai'
import {
  createReportSchema,
  getReportsQuerySchema,
} from '@/lib/validations/report'
import { ZodError } from 'zod'

function formatReportDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * POST /api/reports
 * Pre-computes real database statistics for a requested date range,
 * generates a Voice-of-Customer narrative via Claude / AI using ONLY the computed facts,
 * and persists the report to the database.
 * Requires CREATE_REPORT permission (ADMIN, ANALYST).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce RBAC authentication (ADMIN and ANALYST allowed; VIEWER rejected with 403)
    const auth = await requirePermission(Permission.CREATE_REPORT)
    if (!auth.success) {
      return auth.response
    }

    // 2. Parse & validate request body
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const validated = createReportSchema.parse(rawBody)
    const start = validated.periodStart
    const end = validated.periodEnd

    // 3. Compute date window boundaries for current and previous period
    const durationMs = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - durationMs)

    const currentWhere: Prisma.FeedbackWhereInput = {
      workspaceId: auth.user.workspaceId,
      createdAt: {
        gte: start,
        lte: end,
      },
    }

    const previousWhere: Prisma.FeedbackWhereInput = {
      workspaceId: auth.user.workspaceId,
      createdAt: {
        gte: prevStart,
        lt: start,
      },
    }

    // 4. Pre-compute real statistics from database FIRST
    const [
      totalItems,
      currentSentimentGroups,
      previousSentimentGroups,
      themes,
      representativeFeedbackRecords,
    ] = await Promise.all([
      // Total feedback count in period
      prisma.feedback.count({ where: currentWhere }),

      // Current period sentiment breakdown
      prisma.feedback.groupBy({
        by: ['sentiment'],
        where: currentWhere,
        _count: { _all: true },
      }),

      // Previous period sentiment breakdown
      prisma.feedback.groupBy({
        by: ['sentiment'],
        where: previousWhere,
        _count: { _all: true },
      }),

      // Themes with feedback counts inside the current period
      prisma.theme.findMany({
        where: { workspaceId: auth.user.workspaceId },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              feedback: {
                where: {
                  feedback: currentWhere,
                },
              },
            },
          },
        },
      }),

      // 3-5 real representative feedback records from the current period
      prisma.feedback.findMany({
        where: currentWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          channel: true,
          sentiment: true,
        },
      }),
    ])

    // Format current sentiment counts
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
    for (const group of currentSentimentGroups) {
      if (group.sentiment === 'POS') sentimentCounts.positive = group._count._all
      else if (group.sentiment === 'NEU') sentimentCounts.neutral = group._count._all
      else if (group.sentiment === 'NEG') sentimentCounts.negative = group._count._all
    }

    // Format previous sentiment counts
    const prevSentimentCounts = { positive: 0, neutral: 0, negative: 0 }
    for (const group of previousSentimentGroups) {
      if (group.sentiment === 'POS') prevSentimentCounts.positive = group._count._all
      else if (group.sentiment === 'NEU') prevSentimentCounts.neutral = group._count._all
      else if (group.sentiment === 'NEG') prevSentimentCounts.negative = group._count._all
    }

    const percentNegative =
      totalItems > 0
        ? Math.round((sentimentCounts.negative / totalItems) * 100)
        : 0
    const prevTotal =
      prevSentimentCounts.positive +
      prevSentimentCounts.neutral +
      prevSentimentCounts.negative
    const prevPercentNegative =
      prevTotal > 0
        ? Math.round((prevSentimentCounts.negative / prevTotal) * 100)
        : 0

    // Format top themes (sorted by count descending, top 10)
    const topThemes = themes
      .map((t) => ({
        themeId: t.id,
        name: t.name,
        count: t._count.feedback,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Format representative quotes (real quotes from DB only)
    const representativeFeedback = representativeFeedbackRecords.map((f) => ({
      feedbackId: f.id,
      quote: f.content,
      content: f.content,
      channel: f.channel,
      sentiment: f.sentiment,
    }))

    const precomputedStats: ReportPrecomputedStats = {
      totalItems,
      sentiment: sentimentCounts,
      previousPeriodSentiment: prevSentimentCounts,
      topThemes,
      representativeFeedback,
    }

    // 5. Generate narrative via Claude / AI using pre-computed statistics only
    const narrative = await generateReportNarrative(start, end, precomputedStats)
    if (!narrative) {
      return NextResponse.json(
        { error: 'Failed to generate report narrative. Please ensure AI services are available.' },
        { status: 500 }
      )
    }

    // 6. Generate deterministic report title
    const title = `Voice of Customer Report — ${formatReportDate(start)} to ${formatReportDate(end)}`

    // 7. Save report to database
    const report = await prisma.report.create({
      data: {
        title,
        periodStart: start,
        periodEnd: end,
        contentJson: {
          stats: {
            totalItems,
            sentiment: sentimentCounts,
            previousPeriodSentiment: prevSentimentCounts,
            currentPeriod: {
              total: totalItems,
              positive: sentimentCounts.positive,
              neutral: sentimentCounts.neutral,
              negative: sentimentCounts.negative,
              percentNegative,
            },
            previousPeriod: {
              total: prevTotal,
              positive: prevSentimentCounts.positive,
              neutral: prevSentimentCounts.neutral,
              negative: prevSentimentCounts.negative,
              percentNegative: prevPercentNegative,
            },
            topThemes,
            representativeFeedback,
            representativeQuotes: representativeFeedback,
          },
          narrative,
        },
        workspaceId: auth.user.workspaceId,
        generatedBy: auth.user.id,
      },
      include: {
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error('Error creating report:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports
 * Returns paginated Voice-of-Customer reports for the authenticated user's workspace.
 * Requires VIEW_REPORTS permission (ADMIN, ANALYST, VIEWER).
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Enforce authentication & permission
    const auth = await requirePermission(Permission.VIEW_REPORTS)
    if (!auth.success) {
      return auth.response
    }

    // 2. Parse & validate pagination parameters
    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const query = getReportsQuerySchema.parse(queryParams)

    const page = query.page
    const pageSize = query.pageSize ?? query.limit ?? 25
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: Prisma.ReportWhereInput = {
      workspaceId: auth.user.workspaceId,
    }

    // 3. Query reports and total count concurrently
    const [data, totalItems] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          generator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ])

    const totalPages = Math.ceil(totalItems / pageSize)

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error('Error fetching reports:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
