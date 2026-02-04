'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Grid, List, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PostCard, PostCardSkeleton } from '@/components/posts/post-card'
import { SearchFilters } from '@/components/search/search-filters'
import type { SearchFilters as SearchFiltersType, PostWithDetails } from '@/types'
import { cn } from '@/lib/utils'

interface SearchResponse {
  success: boolean
  data: {
    posts: PostWithDetails[]
    total: number
    page: number
    totalPages: number
  }
}

interface BrandsResponse {
  success: boolean
  data: { id: string; name: string; slug: string }[]
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<SearchFiltersType>({
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch brands for filter options
  const { data: brandsData } = useQuery<BrandsResponse>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands')
      return res.json()
    },
  })

  // Build search URL
  const buildSearchUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (filters.brands?.length) params.set('brands', filters.brands.join(','))
    if (filters.platforms?.length)
      params.set('platforms', filters.platforms.join(','))
    if (filters.contentTypes?.length)
      params.set('contentTypes', filters.contentTypes.join(','))
    if (filters.dateFrom)
      params.set('dateFrom', filters.dateFrom.toISOString())
    if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString())
    if (filters.minViews) params.set('minViews', filters.minViews.toString())
    if (filters.isEvergreen) params.set('isEvergreen', 'true')
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    if (filters.page) params.set('page', filters.page.toString())
    if (filters.limit) params.set('limit', filters.limit.toString())
    return `/api/posts?${params.toString()}`
  }, [debouncedQuery, filters])

  // Fetch posts
  const {
    data: searchData,
    isLoading,
    isFetching,
  } = useQuery<SearchResponse>({
    queryKey: ['posts', debouncedQuery, filters],
    queryFn: async () => {
      const res = await fetch(buildSearchUrl())
      return res.json()
    },
  })

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    })
    setSearchQuery('')
  }

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption)
  }

  const handleMarkEvergreen = async (postId: string) => {
    try {
      const post = searchData?.data.posts.find((p) => p.id === postId)
      if (!post) return

      await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEvergreen: !post.isEvergreen }),
      })
    } catch (error) {
      console.error('Failed to update post:', error)
    }
  }

  const posts = searchData?.data.posts || []
  const totalPosts = searchData?.data.total || 0
  const totalPages = searchData?.data.totalPages || 1
  const currentPage = filters.page || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Search Content</h1>
        <p className="text-zinc-500">
          Find posts across all brands and platforms
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder='Search posts... (e.g., "Kendrick Lamar" or "#GRAMMYs")'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 text-base"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-zinc-400" />
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64">
          <SearchFilters
            filters={filters}
            onFiltersChange={(newFilters) =>
              setFilters({ ...newFilters, page: 1 })
            }
            brands={brandsData?.data || []}
            onClearAll={handleClearFilters}
          />
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {totalPosts.toLocaleString()} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(viewMode === 'grid' && 'bg-zinc-100 dark:bg-zinc-800')}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(viewMode === 'list' && 'bg-zinc-100 dark:bg-zinc-800')}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div
              className={cn(
                'grid gap-4',
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {[...Array(6)].map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div
              className={cn(
                'grid gap-4',
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onCopyCaption={handleCopyCaption}
                  onMarkEvergreen={handleMarkEvergreen}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-12 dark:border-zinc-800">
              <Search className="mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium">No posts found</h3>
              <p className="text-zinc-500">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() =>
                  setFilters({ ...filters, page: currentPage - 1 })
                }
              >
                Previous
              </Button>
              <span className="px-4 text-sm text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setFilters({ ...filters, page: currentPage + 1 })
                }
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
