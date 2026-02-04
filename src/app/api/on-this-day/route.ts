import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const brandSlug = searchParams.get('brand')

    const today = dateParam ? new Date(dateParam) : new Date()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()

    // Build base where clause
    const baseWhere: Record<string, unknown> = {
      isDeleted: false,
    }

    if (brandSlug) {
      baseWhere.brand = { slug: brandSlug }
    }

    // Get posts from this day in previous years
    const yearsToCheck = 5 // Look back 5 years
    const yearlyData = []

    for (let i = 1; i <= yearsToCheck; i++) {
      const targetYear = today.getFullYear() - i
      const startOfDay = new Date(targetYear, currentMonth, currentDay, 0, 0, 0)
      const endOfDay = new Date(targetYear, currentMonth, currentDay, 23, 59, 59)

      const posts = await prisma.post.findMany({
        where: {
          ...baseWhere,
          publishedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { viralScore: 'desc' },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          socialAccount: {
            select: {
              id: true,
              username: true,
              platform: true,
            },
          },
        },
      })

      if (posts.length > 0) {
        const totalEngagement = posts.reduce(
          (sum, post) =>
            sum + Number(post.likes) + Number(post.comments) + Number(post.shares),
          0
        )

        yearlyData.push({
          year: targetYear,
          posts,
          topPost: posts[0] || null,
          totalEngagement,
        })
      }
    }

    // Get suggested reposts - high-performing evergreen content from similar dates
    const suggestedReposts = await prisma.post.findMany({
      where: {
        ...baseWhere,
        isEvergreen: true,
        viralScore: { gte: 50 },
      },
      orderBy: { viralScore: 'desc' },
      take: 10,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            username: true,
            platform: true,
          },
        },
      },
    })

    // Get related tentpoles for this date
    const startOfMonth = new Date(today.getFullYear(), currentMonth, 1)
    const endOfMonth = new Date(today.getFullYear(), currentMonth + 1, 0)

    const relatedTentpoles = await prisma.tentpole.findMany({
      where: {
        isActive: true,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        date: today.toISOString(),
        yearlyData,
        suggestedReposts,
        relatedTentpoles,
      },
    })
  } catch (error) {
    console.error('On This Day error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get On This Day data' },
      { status: 500 }
    )
  }
}
