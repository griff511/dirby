'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { TentpoleCalendar } from '@/components/calendar/tentpole-calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TentpoleCategory } from '@/types'

interface Tentpole {
  id: string
  name: string
  date: Date
  category: TentpoleCategory
  description?: string
  isRecurring: boolean
  relatedTopics: string[]
  relatedArtists: string[]
}

interface TentpolesResponse {
  success: boolean
  data: {
    tentpoles: Tentpole[]
    total: number
  }
}

const CATEGORIES: { value: TentpoleCategory; label: string }[] = [
  { value: 'AWARDS_SHOW', label: 'Awards Show' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'MUSIC_INDUSTRY', label: 'Music Industry' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'CUSTOM', label: 'Custom' },
]

export default function CalendarPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTentpole, setSelectedTentpole] = useState<Tentpole | null>(null)
  const [newTentpole, setNewTentpole] = useState({
    name: '',
    description: '',
    category: 'CUSTOM' as TentpoleCategory,
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    relatedTopics: '',
    relatedArtists: '',
  })

  const queryClient = useQueryClient()

  // Fetch tentpoles
  const { data: tentpolesData, isLoading } = useQuery<TentpolesResponse>({
    queryKey: ['tentpoles'],
    queryFn: async () => {
      const res = await fetch('/api/tentpoles')
      return res.json()
    },
  })

  // Create tentpole mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newTentpole) => {
      const res = await fetch('/api/tentpoles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          relatedTopics: data.relatedTopics
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          relatedArtists: data.relatedArtists
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
        }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tentpoles'] })
      setShowAddModal(false)
      setNewTentpole({
        name: '',
        description: '',
        category: 'CUSTOM',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        relatedTopics: '',
        relatedArtists: '',
      })
    },
  })

  const tentpoles = tentpolesData?.data.tentpoles || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tentpole Calendar</h1>
          <p className="text-zinc-500">
            Plan content around major events and moments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tentpole
        </Button>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
          </div>
        </Card>
      ) : (
        <TentpoleCalendar
          tentpoles={tentpoles}
          onTentpoleClick={setSelectedTentpole}
          onAddTentpole={() => setShowAddModal(true)}
        />
      )}

      {/* Add Tentpole Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Tentpole</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input
                  value={newTentpole.name}
                  onChange={(e) =>
                    setNewTentpole({ ...newTentpole, name: e.target.value })
                  }
                  placeholder="e.g., Grammy Awards 2025"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <Input
                  value={newTentpole.description}
                  onChange={(e) =>
                    setNewTentpole({
                      ...newTentpole,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category
                </label>
                <select
                  value={newTentpole.category}
                  onChange={(e) =>
                    setNewTentpole({
                      ...newTentpole,
                      category: e.target.value as TentpoleCategory,
                    })
                  }
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newTentpole.date}
                  onChange={(e) =>
                    setNewTentpole({ ...newTentpole, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTentpole.isRecurring}
                    onChange={(e) =>
                      setNewTentpole({
                        ...newTentpole,
                        isRecurring: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Recurring annually</span>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Related Topics (comma-separated)
                </label>
                <Input
                  value={newTentpole.relatedTopics}
                  onChange={(e) =>
                    setNewTentpole({
                      ...newTentpole,
                      relatedTopics: e.target.value,
                    })
                  }
                  placeholder="e.g., music, awards, red carpet"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Related Artists (comma-separated)
                </label>
                <Input
                  value={newTentpole.relatedArtists}
                  onChange={(e) =>
                    setNewTentpole({
                      ...newTentpole,
                      relatedArtists: e.target.value,
                    })
                  }
                  placeholder="e.g., Drake, Beyonce, Kendrick Lamar"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => createMutation.mutate(newTentpole)}
                  disabled={!newTentpole.name || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Tentpole'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tentpole Detail Modal */}
      {selectedTentpole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedTentpole.name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTentpole(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedTentpole.category.replace('_', ' ')}</Badge>
                {selectedTentpole.isRecurring && (
                  <Badge variant="outline">Recurring</Badge>
                )}
              </div>

              {selectedTentpole.description && (
                <p className="text-zinc-600 dark:text-zinc-400">
                  {selectedTentpole.description}
                </p>
              )}

              <div>
                <p className="text-sm text-zinc-500">Date</p>
                <p className="font-medium">
                  {new Date(selectedTentpole.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {selectedTentpole.relatedTopics.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Related Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTentpole.relatedTopics.map((topic) => (
                      <Badge key={topic} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTentpole.relatedArtists.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Related Artists</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTentpole.relatedArtists.map((artist) => (
                      <Badge key={artist} variant="outline">
                        {artist}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setSelectedTentpole(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
