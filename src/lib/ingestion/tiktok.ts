/**
 * TikTok Data Ingestion Service
 *
 * This service handles fetching data from TikTok's API
 * for connected creator accounts.
 */

import axios from 'axios'
import { prisma } from '@/lib/db'
import { Platform, ContentType } from '@prisma/client'
import { calculateViralScore, calculateEngagementRate } from '@/lib/viral-score'
import { extractHashtags, extractMentions } from '@/lib/utils'

interface TikTokVideo {
  id: string
  title?: string
  description?: string
  cover_image_url?: string
  video_url?: string
  share_url?: string
  create_time: number
  duration: number
  view_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
}

interface TikTokVideoListResponse {
  data: {
    videos: TikTokVideo[]
    cursor: number
    has_more: boolean
  }
  error: {
    code: string
    message: string
  }
}

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2'

export class TikTokIngestionService {
  private accessToken: string
  private socialAccountId: string
  private brandId: string

  constructor(accessToken: string, socialAccountId: string, brandId: string) {
    this.accessToken = accessToken
    this.socialAccountId = socialAccountId
    this.brandId = brandId
  }

  /**
   * Fetch all videos from TikTok account
   */
  async fetchVideos(maxVideos = 1000): Promise<TikTokVideo[]> {
    const allVideos: TikTokVideo[] = []
    let cursor = 0
    let hasMore = true

    while (hasMore && allVideos.length < maxVideos) {
      try {
        const response = await axios.post<TikTokVideoListResponse>(
          `${TIKTOK_API_BASE}/video/list/`,
          {
            cursor,
            max_count: 20,
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            params: {
              fields:
                'id,title,description,cover_image_url,share_url,create_time,duration,view_count,like_count,comment_count,share_count',
            },
          }
        )

        const { data, error } = response.data

        if (error?.code) {
          console.error('TikTok API error:', error)
          break
        }

        if (data?.videos) {
          allVideos.push(...data.videos)
          cursor = data.cursor
          hasMore = data.has_more
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error('Error fetching TikTok videos:', error)
        break
      }
    }

    return allVideos
  }

  /**
   * Sync all posts from TikTok to database
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

    // Fetch all videos
    const videos = await this.fetchVideos()

    for (const video of videos) {
      try {
        const views = video.view_count || 0
        const likes = video.like_count || 0
        const comments = video.comment_count || 0
        const shares = video.share_count || 0

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
          saves: 0, // TikTok doesn't provide saves
          followerCount,
        })

        // Extract hashtags and mentions from description
        const caption = video.description || video.title || ''
        const hashtags = extractHashtags(caption)
        const mentions = extractMentions(caption)

        // Upsert post
        const existingPost = await prisma.post.findUnique({
          where: {
            platform_externalId: {
              platform: Platform.TIKTOK,
              externalId: video.id,
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
              saves: 0,
            },
          })
        } else {
          await prisma.post.create({
            data: {
              externalId: video.id,
              platform: Platform.TIKTOK,
              brandId: this.brandId,
              socialAccountId: this.socialAccountId,
              contentType: ContentType.SHORT,
              captionText: caption,
              hashtags,
              mentions,
              mediaUrls: video.video_url ? [video.video_url] : [],
              thumbnailUrl: video.cover_image_url,
              permalink: video.share_url,
              publishedAt: new Date(video.create_time * 1000),
              views,
              likes,
              comments,
              shares,
              saves: 0,
              engagementRate,
              viralScore: viralScoreResult.totalScore,
            },
          })
          stats.created++
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error)
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
 * Create a sync job and run TikTok ingestion
 */
export async function runTikTokSync(socialAccountId: string) {
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
      type: 'TIKTOK_SYNC',
      status: 'RUNNING',
      startedAt: new Date(),
      metadata: { socialAccountId },
    },
  })

  try {
    const service = new TikTokIngestionService(
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
