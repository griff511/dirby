import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Platform, ContentType, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const query = searchParams.get('q') || ''
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || []
    const platforms = searchParams.get('platforms')?.split(',').filter(Boolean) as Platform[] || []
    const contentTypes = searchParams.get('contentTypes')?.split(',').filter(Boolean) as ContentType[] || []
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const minViews = parseInt(searchParams.get('minViews') || '0')
    const minEngagementRate = parseFloat(searchParams.get('minEngagementRate') || '0')
    const artists = searchParams.get('artists')?.split(',').filter(Boolean) || []
    const topics = searchParams.get('topics')?.split(',').filter(Boolean) || []
    const isEvergreen = searchParams.get('isEvergreen')
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Build where clause
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
    }

    // Full-text search on caption
    if (query) {
      where.captionText = {
        contains: query,
        mode: 'insensitive',
      }
    }

    // Brand filter
    if (brands.length > 0) {
      where.brand = {
        slug: { in: brands },
      }
    }

    // Platform filter
    if (platforms.length > 0) {
      where.platform = { in: platforms }
    }

    // Content type filter
    if (contentTypes.length > 0) {
      where.contentType = { in: contentTypes }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.publishedAt = {}
      if (dateFrom) {
        where.publishedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.publishedAt.lte = new Date(dateTo)
      }
    }

    // Engagement filters
    if (minViews > 0) {
      where.views = { gte: minViews }
    }

    if (minEngagementRate > 0) {
      where.engagementRate = { gte: minEngagementRate }
    }

    // Artist filter
    if (artists.length > 0) {
      where.artists = { hasSome: artists }
    }

    // Topic filter
    if (topics.length > 0) {
      where.topics = { hasSome: topics }
    }

    // Evergreen filter
    if (isEvergreen === 'true') {
      where.isEvergreen = true
    }

    // Build orderBy
    const orderByMap: Record<string, Prisma.PostOrderByWithRelationInput> = {
      publishedAt: { publishedAt: sortOrder },
      date: { publishedAt: sortOrder },
      views: { views: sortOrder },
      engagementRate: { engagementRate: sortOrder },
      viralScore: { viralScore: sortOrder },
    }

    const orderBy = orderByMap[sortBy] || { publishedAt: 'desc' }

    // Execute query with pagination
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
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
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    // Get facets for filtering
    const [brandFacets, platformFacets, contentTypeFacets] = await Promise.all([
      prisma.post.groupBy({
        by: ['brandId'],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.post.groupBy({
        by: ['platform'],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.post.groupBy({
        by: ['contentType'],
        where: { isDeleted: false },
        _count: true,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        facets: {
          platforms: platformFacets.map(f => ({
            name: f.platform,
            count: f._count,
          })),
          contentTypes: contentTypeFacets.map(f => ({
            name: f.contentType,
            count: f._count,
          })),
        },
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const post = await prisma.post.create({
      data: {
        externalId: body.externalId,
        platform: body.platform,
        brandId: body.brandId,
        socialAccountId: body.socialAccountId,
        contentType: body.contentType,
        captionText: body.captionText,
        hashtags: body.hashtags || [],
        mentions: body.mentions || [],
        mediaUrls: body.mediaUrls || [],
        thumbnailUrl: body.thumbnailUrl,
        permalink: body.permalink,
        publishedAt: new Date(body.publishedAt),
        views: body.views || 0,
        likes: body.likes || 0,
        comments: body.comments || 0,
        shares: body.shares || 0,
        saves: body.saves || 0,
        engagementRate: body.engagementRate || 0,
        viralScore: body.viralScore || 0,
        topics: body.topics || [],
        artists: body.artists || [],
      },
      include: {
        brand: true,
        socialAccount: true,
      },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
