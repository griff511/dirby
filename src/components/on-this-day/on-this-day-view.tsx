'use client'

import { useState } from 'react'
import { format, subYears } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostCard, PostCardSkeleton } from '@/components/posts/post-card'
import { formatNumber } from '@/lib/utils'
import type { OnThisDayData, PostWithDetails } from '@/types'

interface OnThisDayViewProps {
  data: OnThisDayData | null
  isLoading?: boolean
  onDateChange: (date: Date) => void
}

export function OnThisDayView({
  data,
  isLoading,
  onDateChange,
}: OnThisDayViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateChange(today)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">On This Day</h1>
          <p className="text-zinc-500">
            See what you posted on this date in previous years
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleToday}>
            <Calendar className="h-4 w-4" />
            {format(currentDate, 'MMMM d')}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <OnThisDayLoading />
      ) : data ? (
        <>
          {/* Yearly breakdowns */}
          {data.yearlyData.length > 0 ? (
            <div className="space-y-8">
              {data.yearlyData.map((yearData) => (
                <Card key={yearData.year}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-3xl font-bold">
                          {yearData.year}
                        </span>
                        <Badge variant="secondary">
                          {yearData.posts.length} posts
                        </Badge>
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-sm text-zinc-500">
                          Total Engagement
                        </div>
                        <div className="text-lg font-semibold">
                          {formatNumber(yearData.totalEngagement)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Top post highlight */}
                    {yearData.topPost && (
                      <div className="mb-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          <Sparkles className="h-4 w-4" />
                          Top Performing Post
                        </div>
                        <PostCard post={yearData.topPost} showActions={false} />
                      </div>
                    )}

                    {/* Other posts */}
                    {yearData.posts.length > 1 && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {yearData.posts
                          .filter((p) => p.id !== yearData.topPost?.id)
                          .slice(0, 6)
                          .map((post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              showActions={false}
                            />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium">
                No posts on this date
              </h3>
              <p className="text-zinc-500">
                You haven&apos;t posted anything on{' '}
                {format(currentDate, 'MMMM d')} in previous years.
              </p>
            </Card>
          )}

          {/* Suggested Reposts */}
          {data.suggestedReposts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Suggested Reposts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-zinc-500">
                  High-performing evergreen content that could be resurfaced
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.suggestedReposts.slice(0, 4).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Tentpoles */}
          {data.relatedTentpoles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Tentpoles This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.relatedTentpoles.map((tentpole) => (
                    <Badge key={tentpole.id} variant="outline" className="py-2">
                      <span className="font-medium">{tentpole.name}</span>
                      <span className="ml-2 text-zinc-500">
                        {format(new Date(tentpole.date), 'MMM d')}
                      </span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-zinc-500">Unable to load data. Please try again.</p>
        </Card>
      )}
    </div>
  )
}

function OnThisDayLoading() {
  return (
    <div className="space-y-8">
      {[1, 2].map((year) => (
        <Card key={year}>
          <CardHeader>
            <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
