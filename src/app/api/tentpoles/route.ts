import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TentpoleCategory, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const category = searchParams.get('category') as TentpoleCategory | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const upcoming = searchParams.get('upcoming') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Prisma.TentpoleWhereInput = {
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (upcoming) {
      where.date = { gte: new Date() }
    } else if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    const [tentpoles, total] = await Promise.all([
      prisma.tentpole.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { postLinks: true },
          },
        },
      }),
      prisma.tentpole.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        tentpoles,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get tentpoles error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get tentpoles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const tentpole = await prisma.tentpole.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isRecurring: body.isRecurring || false,
        recurrencePattern: body.recurrencePattern,
        relatedTopics: body.relatedTopics || [],
        relatedArtists: body.relatedArtists || [],
        imageUrl: body.imageUrl,
      },
    })

    return NextResponse.json({ success: true, data: tentpole })
  } catch (error) {
    console.error('Create tentpole error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tentpole' },
      { status: 500 }
    )
  }
}
