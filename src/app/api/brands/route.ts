import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            posts: true,
            socialAccounts: true,
          },
        },
        socialAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            platform: true,
            username: true,
            followerCount: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: brands,
    })
  } catch (error) {
    console.error('Get brands error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get brands' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        logoUrl: body.logoUrl,
        color: body.color,
      },
    })

    return NextResponse.json({ success: true, data: brand })
  } catch (error) {
    console.error('Create brand error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}
