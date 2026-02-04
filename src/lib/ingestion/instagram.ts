/**
 * Instagram Data Ingestion Service
 *
 * This service handles fetching data from Instagram's Graph API
 * for connected business/creator accounts.
 */

import axios from 'axios'
import { prisma } from '@/lib/db'
import { Platform, ContentType } from '@prisma/client'
import { calculateViralScore, calculateEngagementRate } from '@/lib/viral-score'
import { extractHashtags, extractMentions } from '@/lib/utils'

interface InstagramMediaItem {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp: string
  like_count?: number
  comments_count?: number
  insights?: {
    data: {
      name: string
      values: { value: number }[]
    }[]
  }
}

interface InstagramInsight {
  name: string
  values: { value: number }[]
}

const INSTAGRAM_API_BASE = 'https://graph.instagram.com'

export class InstagramIngestionService {
  private accessToken: string
  private socialAccountId: string
  private brandId: string

  constructor(accessToken: string, socialAccountId: string, brandId: string) {
    this.accessToken = accessToken
    this.socialAccountId = socialAccountId
    this.brandId = brandId
  }

  /**
   * Fetch all media from Instagram account
   */
  async fetchMedia(limit = 100): Promise<InstagramMediaItem[]> {
    const allMedia: InstagramMediaItem[] = []
    let nextUrl = `${INSTAGRAM_API_BASE}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${this.accessToken}`

    while (nextUrl && allMedia.length < 1000) {
      try {
        const response = await axios.get(nextUrl)
        const { data, paging } = response.data

        if (data) {
          allMedia.push(...data)
        }

        nextUrl = paging?.next || null
      } catch (error) {
        console.error('Error fetching Instagram media:', error)
        break
      }
    }

    return allMedia
  }

  /**
   * Fetch insights for a specific media item
   */
  async fetchMediaInsights(mediaId: string): Promise<Record<string, number>> {
    try {
      const response = await axios.get(
        `${INSTAGRAM_API_BASE}/${mediaId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,saved,shares,video_views',
            access_token: this.accessToken,
          },
        }
      )

      const insights: Record<string, number> = {}
      for (const insight of response.data.data || []) {
        insights[insight.name] = insight.values?.[0]?.value || 0
      }

      return insights
    } catch (error) {
      console.error(`Error fetching insights for media ${mediaId}:`, error)
      return {}
    }
  }

  /**
   * Map Instagram media type to our ContentType
   */
  private mapContentType(mediaType: string): ContentType {
    switch (mediaType) {
      case 'IMAGE':
        return ContentType.IMAGE
      case 'VIDEO':
        return ContentType.VIDEO
      case 'CAROUSEL_ALBUM':
        return ContentType.CAROUSEL
      default:
        return ContentType.IMAGE
    }
  }

  /**
   * Sync all posts from Instagram to database
   */
  async syncPosts(): Promise<{
    created: number
    updated: number
    errors: number
  }> {
    const stats = { created: 0, updated: 0, errors: 0 }

    // Get follower count for engagement rate calculation
    const socialAccount = await prisma.socialAccount.findUnique({
      where: { id: this.socialAccountId },
    })

    if (!socialAccount) {
      throw new Error('Social account not found')
    }

    const followerCount = socialAccount.followerCount || 1

    // Fetch all media
    const media = await this.fetchMedia()

    for (const item of media) {
      try {
        // Get additional insights
        const insights = await this.fetchMediaInsights(item.id)

        const views = insights.impressions || insights.video_views || 0
        const saves = insights.saved || 0
        const shares = insights.shares || 0
        const likes = item.like_count || 0
        const comments = item.comments_count || 0

        // Calculate metrics
        const engagementRate = calculateEngagementRate(
          likes,
          comments,
          shares,
          followerCount
        )

        const viralScoreResult = calculateViralScore({
          views,
          likes,
          comments,
          shares,
          saves,
          followerCount,
        })

        // Extract hashtags and mentions from caption
        const caption = item.caption || ''
        const hashtags = extractHashtags(caption)
        const mentions = extractMentions(caption)

        // Upsert post
        const existingPost = await prisma.post.findUnique({
          where: {
            platform_externalId: {
              platform: Platform.INSTAGRAM,
              externalId: item.id,
            },
          },
        })

        if (existingPost) {
          await prisma.post.update({
            where: { id: existingPost.id },
            data: {
              views,
              likes,
              comments,
              shares,
              saves,
              engagementRate,
              viralScore: viralScoreResult.totalScore,
            },
          })
          stats.updated++

          // Record metrics history
          await prisma.postMetricsHistory.create({
            data: {
              postId: existingPost.id,
              views,
              likes,
              comments,
              shares,
              saves,
            },
          })
        } else {
          await prisma.post.create({
            data: {
              externalId: item.id,
              platform: Platform.INSTAGRAM,
              brandId: this.brandId,
              socialAccountId: this.socialAccountId,
              contentType: this.mapContentType(item.media_type),
              captionText: caption,
              hashtags,
              mentions,
              mediaUrls: item.media_url ? [item.media_url] : [],
              thumbnailUrl: item.thumbnail_url || item.media_url,
              permalink: item.permalink,
              publishedAt: new Date(item.timestamp),
              views,
              likes,
              comments,
              shares,
              saves,
              engagementRate,
              viralScore: viralScoreResult.totalScore,
            },
          })
          stats.created++
        }
      } catch (error) {
        console.error(`Error processing media ${item.id}:`, error)
        stats.errors++
      }
    }

    // Update last sync time
    await prisma.socialAccount.update({
      where: { id: this.socialAccountId },
      data: { lastSyncAt: new Date() },
    })

    return stats
  }
}

/**
 * Create a sync job and run Instagram ingestion
 */
export async function runInstagramSync(socialAccountId: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
    include: { brand: true },
  })

  if (!account || !account.accessToken) {
    throw new Error('Social account not found or missing access token')
  }

  // Create sync job
  const job = await prisma.syncJob.create({
    data: {
      type: 'INSTAGRAM_SYNC',
      status: 'RUNNING',
      startedAt: new Date(),
      metadata: { socialAccountId },
    },
  })

  try {
    const service = new InstagramIngestionService(
      account.accessToken,
      account.id,
      account.brandId
    )

    const stats = await service.syncPosts()

    // Update job as completed
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: { socialAccountId, stats },
      },
    })

    return stats
  } catch (error) {
    // Update job as failed
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}
