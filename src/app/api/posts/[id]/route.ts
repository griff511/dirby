import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await prisma.post.findUnique({
      where: { id },
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
        tentpoleLinks: {
          include: {
            tentpole: true,
          },
        },
        metricsHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 30,
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get brand average for comparison
    const brandAverage = await prisma.post.aggregate({
      where: {
        brandId: post.brandId,
        publishedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
        isDeleted: false,
      },
      _avg: {
        views: true,
        likes: true,
        comments: true,
        shares: true,
        engagementRate: true,
      },
    })

    // Find similar posts (same topic or artist)
    const similarPosts = await prisma.post.findMany({
      where: {
        id: { not: post.id },
        isDeleted: false,
        OR: [
          { topics: { hasSome: post.topics } },
          { artists: { hasSome: post.artists } },
        ],
      },
      orderBy: { viralScore: 'desc' },
      take: 5,
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

    return NextResponse.json({
      success: true,
      data: {
        post,
        brandAverage,
        similarPosts,
      },
    })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get post' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const post = await prisma.post.update({
      where: { id },
      data: {
        isEvergreen: body.isEvergreen,
        topics: body.topics,
        artists: body.artists,
      },
      include: {
        brand: true,
        socialAccount: true,
      },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete
    await prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
