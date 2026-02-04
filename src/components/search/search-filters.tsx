'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Platform, ContentType, SearchFilters as SearchFiltersType } from '@/types'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  brands: { id: string; name: string; slug: string }[]
  onClearAll: () => void
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'X / Twitter' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'SNAPCHAT', label: 'Snapchat' },
]

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'REEL', label: 'Reel' },
  { value: 'STORY', label: 'Story' },
  { value: 'SHORT', label: 'Short' },
]

const ENGAGEMENT_THRESHOLDS = [
  { value: 100000, label: '100K+' },
  { value: 500000, label: '500K+' },
  { value: 1000000, label: '1M+' },
  { value: 5000000, label: '5M+' },
  { value: 10000000, label: '10M+' },
]

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'views', label: 'Views' },
  { value: 'engagementRate', label: 'Engagement Rate' },
  { value: 'viralScore', label: 'Viral Score' },
]

export function SearchFilters({
  filters,
  onFiltersChange,
  brands,
  onClearAll,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const activeFilterCount =
    (filters.brands?.length || 0) +
    (filters.platforms?.length || 0) +
    (filters.contentTypes?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.minViews ? 1 : 0) +
    (filters.isEvergreen ? 1 : 0)

  const toggleBrand = (slug: string) => {
    const current = filters.brands || []
    const updated = current.includes(slug)
      ? current.filter((b) => b !== slug)
      : [...current, slug]
    onFiltersChange({ ...filters, brands: updated })
  }

  const togglePlatform = (platform: Platform) => {
    const current = filters.platforms || []
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform]
    onFiltersChange({ ...filters, platforms: updated })
  }

  const toggleContentType = (type: ContentType) => {
    const current = filters.contentTypes || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    onFiltersChange({ ...filters, contentTypes: updated })
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brands */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Brand</h4>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <Badge
              key={brand.slug}
              variant={
                filters.brands?.includes(brand.slug) ? 'default' : 'outline'
              }
              className="cursor-pointer"
              onClick={() => toggleBrand(brand.slug)}
            >
              {brand.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Platform</h4>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <Badge
              key={platform.value}
              variant={
                filters.platforms?.includes(platform.value)
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer"
              onClick={() => togglePlatform(platform.value)}
            >
              {platform.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content Types */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Content Type</h4>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((type) => (
            <Badge
              key={type.value}
              variant={
                filters.contentTypes?.includes(type.value)
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer"
              onClick={() => toggleContentType(type.value)}
            >
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Date Range</h4>
        <div className="flex gap-2">
          <Input
            type="date"
            value={
              filters.dateFrom
                ? new Date(filters.dateFrom).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateFrom: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="flex-1"
          />
          <span className="flex items-center text-zinc-400">to</span>
          <Input
            type="date"
            value={
              filters.dateTo
                ? new Date(filters.dateTo).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateTo: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="flex-1"
          />
        </div>
      </div>

      {/* Minimum Views */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Minimum Views</h4>
        <div className="flex flex-wrap gap-2">
          {ENGAGEMENT_THRESHOLDS.map((threshold) => (
            <Badge
              key={threshold.value}
              variant={
                filters.minViews === threshold.value ? 'default' : 'outline'
              }
              className="cursor-pointer"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  minViews:
                    filters.minViews === threshold.value
                      ? undefined
                      : threshold.value,
                })
              }
            >
              {threshold.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Evergreen Only */}
      <div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.isEvergreen || false}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                isEvergreen: e.target.checked || undefined,
              })
            }
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm">Evergreen content only</span>
        </label>
      </div>

      {/* Sort */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Sort By</h4>
        <div className="flex gap-2">
          <select
            value={filters.sortBy || 'date'}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                sortBy: e.target.value as SearchFiltersType['sortBy'],
              })
            }
            className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onFiltersChange({
                ...filters,
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
          >
            {filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </div>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" className="w-full" onClick={onClearAll}>
          <X className="mr-2 h-4 w-4" />
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isExpanded && <FilterContent />}
      </div>

      {/* Mobile Filters Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2">{activeFilterCount}</Badge>
          )}
        </Button>

        {showMobileFilters && (
          <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <FilterContent />
          </div>
        )}
      </div>
    </>
  )
}
