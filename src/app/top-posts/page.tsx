'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostCard, PostCardSkeleton } from '@/components/posts/post-card'
import type { PostWithDetails, Platform } from '@/types'

interface TopPostsResponse {
  success: boolean
  data: {
    posts: PostWithDetails[]
    period: number
    averageViralScore: number
    averageEngagementRate: number
  }
}

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
]

const SORT_OPTIONS = [
  { value: 'viralScore', label: 'Viral Score' },
  { value: 'views', label: 'Views' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'engagementRate', label: 'Engagement Rate' },
]

const PLATFORM_OPTIONS = [
  { value: '', label: 'All Platforms' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'Twitter' },
  { value: 'YOUTUBE', label: 'YouTube' },
]

export default function TopPostsPage() {
  const [period, setPeriod] = useState('7')
  const [sortBy, setSortBy] = useState('viralScore')
  const [platform, setPlatform] = useState('')

  const { data, isLoading } = useQuery<TopPostsResponse>({
    queryKey: ['top-posts', period, sortBy, platform],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        sortBy,
        limit: '20',
      })
      if (platform) params.set('platform', platform)
      const res = await fetch(`/api/top-posts?${params.toString()}`)
      return res.json()
    },
  })

  const posts = data?.data.posts || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6" />
            Top Performing Posts
          </h1>
          <p className="text-zinc-500">
            Your highest performing content ranked by performance metrics
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={period === option.value ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Benchmark Stats */}
      {data?.data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-500">Average Viral Score</p>
              <p className="text-2xl font-bold">
                {data.data.averageViralScore.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-500">Average Engagement Rate</p>
              <p className="text-2xl font-bold">
                {data.data.averageEngagementRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Rank Badge */}
                <div className="flex items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-800 sm:w-16">
                  <span className="text-2xl font-bold">#{index + 1}</span>
                </div>

                {/* Post Content */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    {/* Thumbnail */}
                    {post.thumbnailUrl && (
                      <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          style={{
                            backgroundColor: post.brand.color || '#18181b',
                          }}
                        >
                          {post.brand.name}
                        </Badge>
                        <Badge variant="outline">{post.platform}</Badge>
                        <Badge variant="outline">{post.contentType}</Badge>
                      </div>

                      <p className="mb-3 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                        {post.captionText || 'No caption'}
                      </p>

                      {/* Metrics */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Viral Score: </span>
                          <span className="font-semibold">
                            {post.viralScore.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Views: </span>
                          <span className="font-semibold">
                            {Number(post.views).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Engagement: </span>
                          <span className="font-semibold">
                            {post.engagementRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {post.permalink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(post.permalink!, '_blank')}
                        >
                          View Original
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">No posts found</h3>
          <p className="text-zinc-500">
            Try adjusting your filters or time period
          </p>
        </Card>
      )}
    </div>
  )
}
