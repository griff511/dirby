'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ExternalLink,
  Star,
  Copy,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, truncateText } from '@/lib/utils'
import type { PostWithDetails } from '@/types'

interface PostCardProps {
  post: PostWithDetails
  showActions?: boolean
  onMarkEvergreen?: (postId: string) => void
  onCopyCaption?: (caption: string) => void
}

const platformIcons: Record<string, string> = {
  INSTAGRAM: '/icons/instagram.svg',
  TIKTOK: '/icons/tiktok.svg',
  TWITTER: '/icons/twitter.svg',
  YOUTUBE: '/icons/youtube.svg',
  FACEBOOK: '/icons/facebook.svg',
  SNAPCHAT: '/icons/snapchat.svg',
}

const platformColors: Record<string, string> = {
  INSTAGRAM: 'bg-gradient-to-r from-purple-500 to-pink-500',
  TIKTOK: 'bg-black',
  TWITTER: 'bg-blue-400',
  YOUTUBE: 'bg-red-500',
  FACEBOOK: 'bg-blue-600',
  SNAPCHAT: 'bg-yellow-400',
}

export function PostCard({
  post,
  showActions = true,
  onMarkEvergreen,
  onCopyCaption,
}: PostCardProps) {
  const viralTier =
    post.viralScore >= 75
      ? 'viral'
      : post.viralScore >= 50
        ? 'high'
        : post.viralScore >= 25
          ? 'average'
          : 'low'

  const viralTierColors = {
    viral: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    high: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    average:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    low: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative">
        {/* Thumbnail */}
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.captionText || 'Post thumbnail'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              No image
            </div>
          )}

          {/* Platform badge */}
          <div
            className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ${platformColors[post.platform]} text-white`}
          >
            <span className="text-xs font-bold">
              {post.platform.charAt(0)}
            </span>
          </div>

          {/* Viral score badge */}
          <Badge
            className={`absolute right-2 top-2 ${viralTierColors[viralTier]}`}
          >
            {post.viralScore.toFixed(0)}
          </Badge>

          {/* Evergreen indicator */}
          {post.isEvergreen && (
            <div className="absolute bottom-2 right-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          )}
        </div>

        {/* Brand badge */}
        <div className="absolute -bottom-3 left-3">
          <Badge
            className="border-2 border-white dark:border-zinc-900"
            style={{ backgroundColor: post.brand.color || '#18181b' }}
          >
            {post.brand.name}
          </Badge>
        </div>
      </div>

      <div className="p-4 pt-6">
        {/* Caption */}
        <p className="mb-3 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
          {post.captionText
            ? truncateText(post.captionText, 120)
            : 'No caption'}
        </p>

        {/* Metrics */}
        <div className="mb-3 grid grid-cols-5 gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-col items-center">
            <Eye className="mb-0.5 h-3.5 w-3.5" />
            <span>{formatNumber(post.views)}</span>
          </div>
          <div className="flex flex-col items-center">
            <Heart className="mb-0.5 h-3.5 w-3.5" />
            <span>{formatNumber(post.likes)}</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="mb-0.5 h-3.5 w-3.5" />
            <span>{formatNumber(post.comments)}</span>
          </div>
          <div className="flex flex-col items-center">
            <Share2 className="mb-0.5 h-3.5 w-3.5" />
            <span>{formatNumber(post.shares)}</span>
          </div>
          <div className="flex flex-col items-center">
            <Bookmark className="mb-0.5 h-3.5 w-3.5" />
            <span>{formatNumber(post.saves)}</span>
          </div>
        </div>

        {/* Engagement rate */}
        <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          {post.engagementRate.toFixed(2)}% engagement rate
        </div>

        {/* Date */}
        <div className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
        </div>

        {/* Topics/Artists tags */}
        {(post.topics.length > 0 || post.artists.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-1">
            {post.artists.slice(0, 2).map((artist) => (
              <Badge key={artist} variant="outline" className="text-xs">
                {artist}
              </Badge>
            ))}
            {post.topics.slice(0, 2).map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Link href={`/posts/${post.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View
              </Button>
            </Link>
            {post.permalink && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(post.permalink!, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {onCopyCaption && post.captionText && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onCopyCaption(post.captionText!)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onMarkEvergreen && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${post.isEvergreen ? 'text-yellow-500' : ''}`}
                onClick={() => onMarkEvergreen(post.id)}
              >
                <Star
                  className={`h-4 w-4 ${post.isEvergreen ? 'fill-current' : ''}`}
                />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="p-4">
        <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-5 gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
