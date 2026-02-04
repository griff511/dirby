import { PrismaClient, Platform, ContentType, TentpoleCategory, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'raptv' },
      update: {},
      create: {
        name: 'RapTV',
        slug: 'raptv',
        description: 'Your source for hip-hop news and culture',
        color: '#FF0000',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'bars' },
      update: {},
      create: {
        name: 'Bars',
        slug: 'bars',
        description: 'Lyrics and bars that hit different',
        color: '#9333EA',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'pophive' },
      update: {},
      create: {
        name: 'PopHive',
        slug: 'pophive',
        description: 'Pop culture central',
        color: '#EC4899',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'controller' },
      update: {},
      create: {
        name: 'Controller',
        slug: 'controller',
        description: 'Gaming and esports content',
        color: '#22C55E',
      },
    }),
  ])

  console.log(`Created ${brands.length} brands`)

  // Create social accounts for each brand
  const socialAccounts = []
  for (const brand of brands) {
    const igAccount = await prisma.socialAccount.upsert({
      where: {
        platform_platformUserId: {
          platform: Platform.INSTAGRAM,
          platformUserId: `ig_${brand.slug}`,
        },
      },
      update: {},
      create: {
        brandId: brand.id,
        platform: Platform.INSTAGRAM,
        platformUserId: `ig_${brand.slug}`,
        username: brand.slug,
        displayName: brand.name,
        followerCount: Math.floor(Math.random() * 10000000) + 1000000,
        isActive: true,
      },
    })

    const tiktokAccount = await prisma.socialAccount.upsert({
      where: {
        platform_platformUserId: {
          platform: Platform.TIKTOK,
          platformUserId: `tt_${brand.slug}`,
        },
      },
      update: {},
      create: {
        brandId: brand.id,
        platform: Platform.TIKTOK,
        platformUserId: `tt_${brand.slug}`,
        username: brand.slug,
        displayName: brand.name,
        followerCount: Math.floor(Math.random() * 5000000) + 500000,
        isActive: true,
      },
    })

    socialAccounts.push(igAccount, tiktokAccount)
  }

  console.log(`Created ${socialAccounts.length} social accounts`)

  // Sample post data
  const sampleCaptions = [
    'Drake just dropped a new snippet! What do yall think?',
    'Kendrick Lamar announces new album coming this year',
    'This verse from J. Cole hits different',
    'Travis Scott spotted in the studio with Kanye',
    'Cardi B responds to the haters',
    'Nicki Minaj breaks another streaming record',
    'Future and Metro Boomin announce joint tour',
    'Tyler The Creator teases new project',
    'Megan Thee Stallion wins big at the awards',
    'Lil Baby just went platinum in one week',
  ]

  const artists = [
    'Drake', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Kanye West',
    'Cardi B', 'Nicki Minaj', 'Future', 'Metro Boomin', 'Tyler The Creator',
    'Megan Thee Stallion', 'Lil Baby', 'Doja Cat', 'SZA', 'The Weeknd',
  ]

  const topics = [
    'new music', 'album', 'tour', 'awards', 'streaming', 'beef', 'collab',
    'grammy', 'billboard', 'viral', 'bars', 'freestyle', 'interview',
  ]

  // Create sample posts
  const posts = []
  for (let i = 0; i < 100; i++) {
    const account = socialAccounts[Math.floor(Math.random() * socialAccounts.length)]
    const caption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)]
    const postArtists = [artists[Math.floor(Math.random() * artists.length)]]
    const postTopics = [topics[Math.floor(Math.random() * topics.length)]]

    const views = BigInt(Math.floor(Math.random() * 10000000) + 100000)
    const likes = BigInt(Math.floor(Number(views) * (Math.random() * 0.1 + 0.02)))
    const comments = BigInt(Math.floor(Number(likes) * (Math.random() * 0.1 + 0.01)))
    const shares = BigInt(Math.floor(Number(likes) * (Math.random() * 0.05 + 0.005)))
    const saves = BigInt(Math.floor(Number(likes) * (Math.random() * 0.03 + 0.002)))

    const totalEngagement = Number(likes) + Number(comments) + Number(shares) + Number(saves)
    const engagementRate = (totalEngagement / account.followerCount) * 100
    const viralScore = Math.min(100, Math.random() * 100)

    const publishedAt = new Date()
    publishedAt.setDate(publishedAt.getDate() - Math.floor(Math.random() * 365))

    const post = await prisma.post.create({
      data: {
        externalId: `post_${i}_${Date.now()}`,
        platform: account.platform,
        brandId: account.brandId,
        socialAccountId: account.id,
        contentType: Math.random() > 0.5 ? ContentType.VIDEO : ContentType.IMAGE,
        captionText: caption + ` #${postTopics[0].replace(' ', '')} @${postArtists[0].toLowerCase().replace(' ', '')}`,
        hashtags: [postTopics[0].replace(' ', ''), 'hiphop', 'rap'],
        mentions: [postArtists[0].toLowerCase().replace(' ', '')],
        mediaUrls: ['https://picsum.photos/1080/1080?random=' + i],
        thumbnailUrl: 'https://picsum.photos/400/400?random=' + i,
        publishedAt,
        views,
        likes,
        comments,
        shares,
        saves,
        engagementRate,
        viralScore,
        artists: postArtists,
        topics: postTopics,
        isEvergreen: Math.random() > 0.9,
      },
    })

    posts.push(post)
  }

  console.log(`Created ${posts.length} posts`)

  // Create tentpoles
  const tentpoles = await Promise.all([
    prisma.tentpole.upsert({
      where: { id: 'grammy-2025' },
      update: {},
      create: {
        id: 'grammy-2025',
        name: 'Grammy Awards 2025',
        description: 'The 67th Annual Grammy Awards',
        category: TentpoleCategory.AWARDS_SHOW,
        date: new Date('2025-02-02'),
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        relatedTopics: ['grammys', 'awards', 'music', 'album of the year'],
        relatedArtists: [],
      },
    }),
    prisma.tentpole.upsert({
      where: { id: 'super-bowl-2025' },
      update: {},
      create: {
        id: 'super-bowl-2025',
        name: 'Super Bowl LIX',
        description: 'Super Bowl LIX Halftime Show',
        category: TentpoleCategory.SPORTS,
        date: new Date('2025-02-09'),
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        relatedTopics: ['super bowl', 'halftime show', 'nfl', 'football'],
        relatedArtists: [],
      },
    }),
    prisma.tentpole.upsert({
      where: { id: 'bet-awards-2025' },
      update: {},
      create: {
        id: 'bet-awards-2025',
        name: 'BET Awards 2025',
        description: 'Annual BET Awards ceremony',
        category: TentpoleCategory.AWARDS_SHOW,
        date: new Date('2025-06-29'),
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        relatedTopics: ['bet awards', 'awards', 'black excellence'],
        relatedArtists: [],
      },
    }),
    prisma.tentpole.upsert({
      where: { id: 'black-history-month' },
      update: {},
      create: {
        id: 'black-history-month',
        name: 'Black History Month',
        description: 'Celebrating Black history and culture',
        category: TentpoleCategory.CULTURAL,
        date: new Date('2025-02-01'),
        endDate: new Date('2025-02-28'),
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        relatedTopics: ['black history month', 'bhm', 'culture', 'history'],
        relatedArtists: [],
      },
    }),
    prisma.tentpole.upsert({
      where: { id: 'vmas-2025' },
      update: {},
      create: {
        id: 'vmas-2025',
        name: 'MTV VMAs 2025',
        description: 'MTV Video Music Awards',
        category: TentpoleCategory.AWARDS_SHOW,
        date: new Date('2025-09-10'),
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        relatedTopics: ['vmas', 'mtv', 'music video', 'awards'],
        relatedArtists: [],
      },
    }),
  ])

  console.log(`Created ${tentpoles.length} tentpoles`)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lowbattery.co' },
    update: {},
    create: {
      email: 'admin@lowbattery.co',
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  })

  console.log(`Created admin user: ${adminUser.email}`)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
