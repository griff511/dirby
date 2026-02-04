'use client'

import { Eye, Heart, Share2, TrendingUp, BarChart3, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'

interface MetricsCardsProps {
  totalPosts: number
  totalViews: string
  totalEngagement: string
  avgEngagementRate: number
  avgViralScore?: number
}

export function MetricsCards({
  totalPosts,
  totalViews,
  totalEngagement,
  avgEngagementRate,
  avgViralScore,
}: MetricsCardsProps) {
  const metrics = [
    {
      label: 'Total Posts',
      value: formatNumber(totalPosts),
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Total Views',
      value: formatNumber(BigInt(totalViews)),
      icon: Eye,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Engagement',
      value: formatNumber(BigInt(totalEngagement)),
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Avg Engagement Rate',
      value: `${avgEngagementRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  if (avgViralScore !== undefined) {
    metrics.push({
      label: 'Avg Viral Score',
      value: avgViralScore.toFixed(1),
      icon: Share2,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${metric.bgColor}`}>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface PlatformMetric {
  platform: string
  totalPosts: number
  totalViews: string
  totalEngagement: string
  avgEngagementRate: number
}

interface PlatformMetricsProps {
  platforms: PlatformMetric[]
}

const platformColors: Record<string, string> = {
  INSTAGRAM: 'from-purple-500 to-pink-500',
  TIKTOK: 'from-zinc-800 to-zinc-600',
  TWITTER: 'from-blue-400 to-blue-500',
  YOUTUBE: 'from-red-500 to-red-600',
  FACEBOOK: 'from-blue-600 to-blue-700',
  SNAPCHAT: 'from-yellow-400 to-yellow-500',
}

export function PlatformMetrics({ platforms }: PlatformMetricsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold">Platform Performance</h3>
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.platform} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{platform.platform}</span>
                <span className="text-zinc-500">
                  {formatNumber(platform.totalPosts)} posts
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${platformColors[platform.platform] || 'from-zinc-400 to-zinc-500'}`}
                      style={{
                        width: `${Math.min(platform.avgEngagementRate * 10, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-sm text-zinc-500">
                  {platform.avgEngagementRate.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface TrendingItem {
  name: string
  count: number
  growth?: number
}

interface TrendingListProps {
  title: string
  items: TrendingItem[]
  type: 'topics' | 'artists'
}

export function TrendingList({ title, items, type }: TrendingListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold">{title}</h3>
        <div className="space-y-3">
          {items.slice(0, 10).map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                  {index + 1}
                </span>
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{item.count} posts</span>
                {item.growth !== undefined && item.growth !== 0 && (
                  <span
                    className={
                      item.growth > 0 ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {item.growth > 0 ? '+' : ''}
                    {item.growth}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
