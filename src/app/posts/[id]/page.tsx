'use client'

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ExternalLink,
  Star,
  Copy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostCard, PostCardSkeleton } from '@/components/posts/post-card'
import { formatNumber } from '@/lib/utils'
import type { PostWithDetails } from '@/types'

interface PostDetailResponse {
  success: boolean
  data: {
    post: PostWithDetails & {
      metricsHistory: {
        id: string
        views: bigint
        likes: bigint
        comments: bigint
        shares: bigint
        saves: bigint
        recordedAt: Date
      }[]
    }
    brandAverage: {
      _avg: {
        views: number | null
        likes: number | null
        comments: number | null
        shares: number | null
        engagementRate: number | null
      }
    }
    similarPosts: PostWithDetails[]
  }
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<PostDetailResponse>({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`)
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: { isEvergreen?: boolean }) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] })
    },
  })

  const post = data?.data.post
  const brandAverage = data?.data.brandAverage
  const similarPosts = data?.data.similarPosts || []

  const handleCopyCaption = () => {
    if (post?.captionText) {
      navigator.clipboard.writeText(post.captionText)
    }
  }

  const getComparisonPercentage = (
    value: bigint | number,
    average: number | null
  ) => {
    if (!average) return null
    const numValue = typeof value === 'bigint' ? Number(value) : value
    return ((numValue - average) / average) * 100
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-2 text-xl font-semibold">Post not found</h2>
        <p className="mb-4 text-zinc-500">
          The post you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button>Go to Search</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Post Details</h1>
          <p className="text-sm text-zinc-500">
            Published {format(new Date(post.publishedAt), 'PPP')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Media & Content */}
        <div className="space-y-4">
          {/* Media */}
          <Card className="overflow-hidden">
            {post.thumbnailUrl ? (
              <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={post.thumbnailUrl}
                  alt="Post media"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                <p className="text-zinc-400">No media available</p>
              </div>
            )}
          </Card>

          {/* Caption */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Caption</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopyCaption}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {post.captionText || 'No caption'}
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.hashtags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {post.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {post.mentions.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Mentions</p>
                  <div className="flex flex-wrap gap-2">
                    {post.mentions.map((mention) => (
                      <Badge key={mention} variant="outline">
                        @{mention}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {post.artists.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Artists</p>
                  <div className="flex flex-wrap gap-2">
                    {post.artists.map((artist) => (
                      <Badge key={artist}>{artist}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {post.topics.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {post.topics.map((topic) => (
                      <Badge key={topic} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics & Actions */}
        <div className="space-y-4">
          {/* Quick Info */}
          <Card>
            <CardContent className="flex flex-wrap gap-4 p-4">
              <Badge
                style={{ backgroundColor: post.brand.color || '#18181b' }}
              >
                {post.brand.name}
              </Badge>
              <Badge variant="outline">{post.platform}</Badge>
              <Badge variant="outline">{post.contentType}</Badge>
              {post.isEvergreen && (
                <Badge className="bg-yellow-500 text-white">Evergreen</Badge>
              )}
            </CardContent>
          </Card>

          {/* Viral Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Viral Score
                <span className="text-3xl font-bold">
                  {post.viralScore.toFixed(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    post.viralScore >= 75
                      ? 'bg-green-500'
                      : post.viralScore >= 50
                        ? 'bg-blue-500'
                        : post.viralScore >= 25
                          ? 'bg-yellow-500'
                          : 'bg-zinc-400'
                  }`}
                  style={{ width: `${post.viralScore}%` }}
                />
              </div>
              <p className="text-sm text-zinc-500">
                {post.viralScore >= 75
                  ? 'Viral - Exceptional performance'
                  : post.viralScore >= 50
                    ? 'High - Above average performance'
                    : post.viralScore >= 25
                      ? 'Average - Normal performance'
                      : 'Low - Below average performance'}
              </p>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                  { label: 'Views', value: post.views, icon: Eye },
                  { label: 'Likes', value: post.likes, icon: Heart },
                  {
                    label: 'Comments',
                    value: post.comments,
                    icon: MessageCircle,
                  },
                  { label: 'Shares', value: post.shares, icon: Share2 },
                  { label: 'Saves', value: post.saves, icon: Bookmark },
                ].map((metric) => {
                  const Icon = metric.icon
                  const comparison = getComparisonPercentage(
                    metric.value,
                    brandAverage?._avg?.[
                      metric.label.toLowerCase() as keyof typeof brandAverage._avg
                    ] || null
                  )

                  return (
                    <div key={metric.label} className="text-center">
                      <Icon className="mx-auto mb-1 h-5 w-5 text-zinc-400" />
                      <p className="text-lg font-semibold">
                        {formatNumber(metric.value)}
                      </p>
                      <p className="text-xs text-zinc-500">{metric.label}</p>
                      {comparison !== null && (
                        <p
                          className={`flex items-center justify-center text-xs ${
                            comparison >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {comparison >= 0 ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {Math.abs(comparison).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 border-t pt-4 text-center">
                <p className="text-sm text-zinc-500">Engagement Rate</p>
                <p className="text-2xl font-bold">
                  {post.engagementRate.toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {post.permalink && (
                <Button
                  variant="outline"
                  onClick={() => window.open(post.permalink!, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Original
                </Button>
              )}
              <Button
                variant={post.isEvergreen ? 'default' : 'outline'}
                onClick={() =>
                  updateMutation.mutate({ isEvergreen: !post.isEvergreen })
                }
              >
                <Star
                  className={`mr-2 h-4 w-4 ${post.isEvergreen ? 'fill-current' : ''}`}
                />
                {post.isEvergreen ? 'Marked Evergreen' : 'Mark as Evergreen'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar Posts */}
      {similarPosts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Similar Posts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {similarPosts.map((similarPost) => (
              <PostCard
                key={similarPost.id}
                post={similarPost}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
