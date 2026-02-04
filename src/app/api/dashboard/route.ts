import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandSlug = searchParams.get('brand')
    const period = searchParams.get('period') || '30' // Days

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const baseWhere: Record<string, unknown> = {
      isDeleted: false,
      publishedAt: { gte: startDate },
    }

    if (brandSlug) {
      baseWhere.brand = { slug: brandSlug }
    }

    // Get aggregate metrics
    const [totalStats, topPosts, recentPosts, platformStats, brandStats] =
      await Promise.all([
        // Total stats
        prisma.post.aggregate({
          where: baseWhere,
          _count: true,
          _sum: {
            views: true,
            likes: true,
            comments: true,
            shares: true,
            saves: true,
          },
          _avg: {
            engagementRate: true,
            viralScore: true,
          },
        }),

        // Top performing posts
        prisma.post.findMany({
          where: baseWhere,
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
        }),

        // Recent posts
        prisma.post.findMany({
          where: baseWhere,
          orderBy: { publishedAt: 'desc' },
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
        }),

        // Stats by platform
        prisma.post.groupBy({
          by: ['platform'],
          where: baseWhere,
          _count: true,
          _sum: {
            views: true,
            likes: true,
            comments: true,
            shares: true,
          },
          _avg: {
            engagementRate: true,
          },
        }),

        // Stats by brand
        prisma.post.groupBy({
          by: ['brandId'],
          where: { isDeleted: false, publishedAt: { gte: startDate } },
          _count: true,
          _sum: {
            views: true,
            likes: true,
            comments: true,
            shares: true,
          },
          _avg: {
            engagementRate: true,
          },
        }),
      ])

    // Get brand details for brand stats
    const brandIds = brandStats.map((b) => b.brandId)
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
      },
    })

    const brandMap = new Map(brands.map((b) => [b.id, b]))

    // Get trending topics (most mentioned in recent posts)
    const recentPostsForTopics = await prisma.post.findMany({
      where: baseWhere,
      select: { topics: true },
    })

    const topicCounts = new Map<string, number>()
    for (const post of recentPostsForTopics) {
      for (const topic of post.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      }
    }

    const trendingTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count, growth: 0 }))

    // Get trending artists
    const recentPostsForArtists = await prisma.post.findMany({
      where: baseWhere,
      select: { artists: true },
    })

    const artistCounts = new Map<string, number>()
    for (const post of recentPostsForArtists) {
      for (const artist of post.artists) {
        artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1)
      }
    }

    const trendingArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([artist, count]) => ({ artist, count, growth: 0 }))

    // Calculate total engagement
    const totalEngagement =
      (totalStats._sum.likes || BigInt(0)) +
      (totalStats._sum.comments || BigInt(0)) +
      (totalStats._sum.shares || BigInt(0)) +
      (totalStats._sum.saves || BigInt(0))

    return NextResponse.json({
      success: true,
      data: {
        totalPosts: totalStats._count,
        totalViews: totalStats._sum.views?.toString() || '0',
        totalEngagement: totalEngagement.toString(),
        avgEngagementRate: totalStats._avg.engagementRate || 0,
        avgViralScore: totalStats._avg.viralScore || 0,
        topPerformingPosts: topPosts,
        recentPosts,
        platformMetrics: platformStats.map((p) => ({
          platform: p.platform,
          totalPosts: p._count,
          totalViews: p._sum.views?.toString() || '0',
          totalEngagement: (
            (p._sum.likes || BigInt(0)) +
            (p._sum.comments || BigInt(0)) +
            (p._sum.shares || BigInt(0))
          ).toString(),
          avgEngagementRate: p._avg.engagementRate || 0,
        })),
        brandMetrics: brandStats.map((b) => ({
          brand: brandMap.get(b.brandId),
          totalPosts: b._count,
          totalViews: b._sum.views?.toString() || '0',
          totalEngagement: (
            (b._sum.likes || BigInt(0)) +
            (b._sum.comments || BigInt(0)) +
            (b._sum.shares || BigInt(0))
          ).toString(),
          avgEngagementRate: b._avg.engagementRate || 0,
        })),
        trendingTopics,
        trendingArtists,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get dashboard data' },
      { status: 500 }
    )
  }
}
