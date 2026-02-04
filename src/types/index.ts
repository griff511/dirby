import type { Platform, ContentType, UserRole, TentpoleCategory, Sentiment } from '@prisma/client'

// Re-export Prisma enums for convenience
export type { Platform, ContentType, UserRole, TentpoleCategory, Sentiment }

// Search types
export interface SearchFilters {
  query?: string
  brands?: string[]
  platforms?: Platform[]
  contentTypes?: ContentType[]
  dateFrom?: Date
  dateTo?: Date
  minViews?: number
  minEngagementRate?: number
  artists?: string[]
  topics?: string[]
  isEvergreen?: boolean
  sortBy?: 'date' | 'views' | 'engagementRate' | 'viralScore'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult {
  posts: PostWithDetails[]
  total: number
  page: number
  totalPages: number
  facets?: SearchFacets
}

export interface SearchFacets {
  brands: { name: string; count: number }[]
  platforms: { name: Platform; count: number }[]
  contentTypes: { name: ContentType; count: number }[]
  topArtists: { name: string; count: number }[]
  topTopics: { name: string; count: number }[]
}

// Post types
export interface PostWithDetails {
  id: string
  externalId: string
  platform: Platform
  contentType: ContentType
  captionText: string | null
  hashtags: string[]
  mentions: string[]
  mediaUrls: string[]
  thumbnailUrl: string | null
  permalink: string | null
  publishedAt: Date
  views: bigint
  likes: bigint
  comments: bigint
  shares: bigint
  saves: bigint
  engagementRate: number
  viralScore: number
  topics: string[]
  artists: string[]
  sentiment: Sentiment | null
  isEvergreen: boolean
  brand: {
    id: string
    name: string
    slug: string
    color: string | null
  }
  socialAccount: {
    id: string
    username: string
    platform: Platform
  }
}

// Tentpole types
export interface TentpoleWithPosts {
  id: string
  name: string
  description: string | null
  category: TentpoleCategory
  date: Date
  endDate: Date | null
  isRecurring: boolean
  recurrencePattern: string | null
  relatedTopics: string[]
  relatedArtists: string[]
  imageUrl: string | null
  posts: PostWithDetails[]
  historicalPosts: PostWithDetails[]
}

// On This Day types
export interface OnThisDayData {
  date: Date
  yearlyData: {
    year: number
    posts: PostWithDetails[]
    topPost: PostWithDetails | null
    totalEngagement: number
  }[]
  suggestedReposts: PostWithDetails[]
  relatedTentpoles: TentpoleWithPosts[]
}

// Dashboard types
export interface DashboardMetrics {
  totalPosts: number
  totalViews: bigint
  totalEngagement: bigint
  avgEngagementRate: number
  topPerformingPosts: PostWithDetails[]
  recentPosts: PostWithDetails[]
  brandMetrics: BrandMetrics[]
  platformMetrics: PlatformMetrics[]
  trendingTopics: { topic: string; count: number; growth: number }[]
  trendingArtists: { artist: string; count: number; growth: number }[]
}

export interface BrandMetrics {
  brand: {
    id: string
    name: string
    slug: string
    color: string | null
  }
  totalPosts: number
  totalViews: bigint
  totalEngagement: bigint
  avgEngagementRate: number
  topPost: PostWithDetails | null
}

export interface PlatformMetrics {
  platform: Platform
  totalPosts: number
  totalViews: bigint
  totalEngagement: bigint
  avgEngagementRate: number
}

// User types
export interface UserWithAccess {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  brandAccess: {
    brand: {
      id: string
      name: string
      slug: string
    }
  }[]
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Calendar types
export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tentpoles: {
    id: string
    name: string
    category: TentpoleCategory
  }[]
  postCount: number
  topPostViews: bigint | null
}

// Chart types
export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface PieChartData {
  name: string
  value: number
  color?: string
}
