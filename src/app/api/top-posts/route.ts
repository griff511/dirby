import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Platform } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const period = searchParams.get('period') || '7' // Days
    const brandSlug = searchParams.get('brand')
    const platform = searchParams.get('platform') as Platform | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const sortBy = searchParams.get('sortBy') || 'viralScore'

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const where: Record<string, unknown> = {
      isDeleted: false,
      publishedAt: { gte: startDate },
    }

    if (brandSlug) {
      where.brand = { slug: brandSlug }
    }

    if (platform) {
      where.platform = platform
    }

    // Map sort options
    const orderByMap: Record<string, Record<string, 'desc'>> = {
      viralScore: { viralScore: 'desc' },
      views: { views: 'desc' },
      engagement: { likes: 'desc' },
      engagementRate: { engagementRate: 'desc' },
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: orderByMap[sortBy] || { viralScore: 'desc' },
      take: limit,
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
            followerCount: true,
          },
        },
      },
    })

    // Calculate stats for context
    const stats = await prisma.post.aggregate({
      where: {
        isDeleted: false,
        publishedAt: { gte: startDate },
      },
      _avg: {
        viralScore: true,
        engagementRate: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        posts,
        period: periodDays,
        averageViralScore: stats._avg.viralScore || 0,
        averageEngagementRate: stats._avg.engagementRate || 0,
      },
    })
  } catch (error) {
    console.error('Top posts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get top posts' },
      { status: 500 }
    )
  }
}
