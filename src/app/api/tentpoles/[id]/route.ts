import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tentpole = await prisma.tentpole.findUnique({
      where: { id },
      include: {
        postLinks: {
          include: {
            post: {
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
            },
          },
          orderBy: { relevanceScore: 'desc' },
        },
      },
    })

    if (!tentpole) {
      return NextResponse.json(
        { success: false, error: 'Tentpole not found' },
        { status: 404 }
      )
    }

    // Get historical posts for this tentpole (posts from previous years on same date)
    const tentpoleDate = new Date(tentpole.date)
    const dayOfYear = Math.floor(
      (tentpoleDate.getTime() - new Date(tentpoleDate.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Find posts from similar dates in previous years
    const historicalPosts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        OR: [
          { topics: { hasSome: tentpole.relatedTopics } },
          { artists: { hasSome: tentpole.relatedArtists } },
          {
            captionText: {
              contains: tentpole.name,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { viralScore: 'desc' },
      take: 20,
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
        tentpole,
        historicalPosts,
      },
    })
  } catch (error) {
    console.error('Get tentpole error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get tentpole' },
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

    const tentpole = await prisma.tentpole.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        date: body.date ? new Date(body.date) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isRecurring: body.isRecurring,
        recurrencePattern: body.recurrencePattern,
        relatedTopics: body.relatedTopics,
        relatedArtists: body.relatedArtists,
        imageUrl: body.imageUrl,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({ success: true, data: tentpole })
  } catch (error) {
    console.error('Update tentpole error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tentpole' },
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

    // Soft delete by marking inactive
    await prisma.tentpole.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tentpole error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tentpole' },
      { status: 500 }
    )
  }
}
