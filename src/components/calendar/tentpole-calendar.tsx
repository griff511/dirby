'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TentpoleCategory } from '@/types'

interface Tentpole {
  id: string
  name: string
  date: Date
  category: TentpoleCategory
  description?: string
  isRecurring?: boolean
  relatedTopics?: string[]
  relatedArtists?: string[]
}

interface TentpoleCalendarProps {
  tentpoles: Tentpole[]
  onDateClick?: (date: Date) => void
  onTentpoleClick?: (tentpole: Tentpole) => void
  onAddTentpole?: () => void
}

const categoryColors: Record<TentpoleCategory, string> = {
  AWARDS_SHOW: 'bg-purple-500',
  SPORTS: 'bg-green-500',
  CULTURAL: 'bg-orange-500',
  MUSIC_INDUSTRY: 'bg-blue-500',
  HOLIDAY: 'bg-red-500',
  CUSTOM: 'bg-zinc-500',
}

const categoryLabels: Record<TentpoleCategory, string> = {
  AWARDS_SHOW: 'Awards',
  SPORTS: 'Sports',
  CULTURAL: 'Cultural',
  MUSIC_INDUSTRY: 'Music',
  HOLIDAY: 'Holiday',
  CUSTOM: 'Custom',
}

export function TentpoleCalendar({
  tentpoles,
  onDateClick,
  onTentpoleClick,
  onAddTentpole,
}: TentpoleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const daysArray = eachDayOfInterval({ start, end })

    // Pad the beginning with days from the previous month
    const startDay = start.getDay()
    for (let i = 0; i < startDay; i++) {
      const prevDay = new Date(start)
      prevDay.setDate(prevDay.getDate() - (startDay - i))
      daysArray.unshift(prevDay)
    }

    // Pad the end to make it a complete grid (6 rows x 7 days)
    while (daysArray.length < 42) {
      const nextDay = new Date(daysArray[daysArray.length - 1])
      nextDay.setDate(nextDay.getDate() + 1)
      daysArray.push(nextDay)
    }

    return daysArray
  }, [currentMonth])

  const getTentpolesForDay = (date: Date) => {
    return tentpoles.filter((t) => isSameDay(new Date(t.date), date))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const selectedDayTentpoles = selectedDate
    ? getTentpolesForDay(selectedDate)
    : []

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Calendar Grid */}
      <Card className="flex-1 p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayTentpoles = getTentpolesForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isDayToday = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'relative aspect-square rounded-lg p-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  !isCurrentMonth && 'text-zinc-400 dark:text-zinc-600',
                  isDayToday && 'font-bold',
                  isSelected &&
                    'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900'
                )}
              >
                <span className="block">{format(day, 'd')}</span>
                {dayTentpoles.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                    {dayTentpoles.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          categoryColors[t.category]
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1.5 text-xs">
              <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
              <span className="text-zinc-600 dark:text-zinc-400">
                {categoryLabels[category as TentpoleCategory]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Day Details */}
      <Card className="w-full p-4 lg:w-80">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">
            {selectedDate
              ? format(selectedDate, 'MMMM d, yyyy')
              : 'Select a date'}
          </h3>
          {onAddTentpole && (
            <Button variant="ghost" size="icon" onClick={onAddTentpole}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedDate ? (
          selectedDayTentpoles.length > 0 ? (
            <div className="space-y-3">
              {selectedDayTentpoles.map((tentpole) => (
                <button
                  key={tentpole.id}
                  onClick={() => onTentpoleClick?.(tentpole)}
                  className="w-full rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        categoryColors[tentpole.category]
                      )}
                    />
                    <span className="font-medium">{tentpole.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[tentpole.category]}
                  </Badge>
                  {tentpole.description && (
                    <p className="mt-2 text-xs text-zinc-500">
                      {tentpole.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              No tentpoles scheduled for this date.
            </p>
          )
        ) : (
          <p className="text-sm text-zinc-500">
            Click on a date to see scheduled tentpoles.
          </p>
        )}

        {/* Upcoming tentpoles */}
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <h4 className="mb-3 text-sm font-medium">Upcoming Tentpoles</h4>
          <div className="space-y-2">
            {tentpoles
              .filter((t) => new Date(t.date) >= new Date())
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              )
              .slice(0, 5)
              .map((tentpole) => (
                <button
                  key={tentpole.id}
                  onClick={() => onTentpoleClick?.(tentpole)}
                  className="flex w-full items-center gap-2 rounded p-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div
                    className={cn(
                      'h-2 w-2 flex-shrink-0 rounded-full',
                      categoryColors[tentpole.category]
                    )}
                  />
                  <span className="flex-1 truncate">{tentpole.name}</span>
                  <span className="text-xs text-zinc-500">
                    {format(new Date(tentpole.date), 'MMM d')}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
