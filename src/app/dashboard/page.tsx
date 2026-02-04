'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostCard, PostCardSkeleton } from '@/components/posts/post-card'
import {
  MetricsCards,
  PlatformMetrics,
  TrendingList,
} from '@/components/dashboard/metrics-cards'
import type { PostWithDetails } from '@/types'

interface DashboardResponse {
  success: boolean
  data: {
    totalPosts: number
    totalViews: string
    totalEngagement: string
    avgEngagementRate: number
    avgViralScore: number
    topPerformingPosts: PostWithDetails[]
    recentPosts: PostWithDetails[]
    platformMetrics: {
      platform: string
      totalPosts: number
      totalViews: string
      totalEngagement: string
      avgEngagementRate: number
    }[]
    brandMetrics: {
      brand: { id: string; name: string; slug: string; color: string | null }
      totalPosts: number
      totalViews: string
      totalEngagement: string
      avgEngagementRate: number
    }[]
    trendingTopics: { topic: string; count: number; growth: number }[]
    trendingArtists: { artist: string; count: number; growth: number }[]
  }
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
]

export default function DashboardPage() {
  const [period, setPeriod] = useState('30')

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?period=${period}`)
      return res.json()
    },
  })

  const dashboardData = data?.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6" />
            Dashboard
          </h1>
          <p className="text-zinc-500">
            Performance overview across all brands and platforms
          </p>
        </div>
        <div className="flex gap-2">
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
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : dashboardData ? (
        <>
          {/* Key Metrics */}
          <MetricsCards
            totalPosts={dashboardData.totalPosts}
            totalViews={dashboardData.totalViews}
            totalEngagement={dashboardData.totalEngagement}
            avgEngagementRate={dashboardData.avgEngagementRate}
            avgViralScore={dashboardData.avgViralScore}
          />

          {/* Platform & Trending */}
          <div className="grid gap-6 lg:grid-cols-3">
            <PlatformMetrics platforms={dashboardData.platformMetrics} />
            <TrendingList
              title="Trending Topics"
              items={dashboardData.trendingTopics.map((t) => ({
                name: t.topic,
                count: t.count,
                growth: t.growth,
              }))}
              type="topics"
            />
            <TrendingList
              title="Trending Artists"
              items={dashboardData.trendingArtists.map((a) => ({
                name: a.artist,
                count: a.count,
                growth: a.growth,
              }))}
              type="artists"
            />
          </div>

          {/* Brand Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-zinc-500">
                      <th className="pb-3 font-medium">Brand</th>
                      <th className="pb-3 font-medium">Posts</th>
                      <th className="pb-3 font-medium">Views</th>
                      <th className="pb-3 font-medium">Engagement</th>
                      <th className="pb-3 font-medium">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.brandMetrics.map((metric) => (
                      <tr
                        key={metric.brand.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-3">
                          <Badge
                            style={{
                              backgroundColor: metric.brand.color || '#18181b',
                            }}
                          >
                            {metric.brand.name}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {metric.totalPosts.toLocaleString()}
                        </td>
                        <td className="py-3">
                          {BigInt(metric.totalViews).toLocaleString()}
                        </td>
                        <td className="py-3">
                          {BigInt(metric.totalEngagement).toLocaleString()}
                        </td>
                        <td className="py-3">
                          {metric.avgEngagementRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {dashboardData.topPerformingPosts.slice(0, 5).map((post) => (
                  <PostCard key={post.id} post={post} showActions={false} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {dashboardData.recentPosts.slice(0, 5).map((post) => (
                  <PostCard key={post.id} post={post} showActions={false} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">No data available</h3>
          <p className="text-zinc-500">
            Start syncing your social accounts to see analytics
          </p>
        </Card>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
