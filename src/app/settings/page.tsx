'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Users,
  Plug,
  Database,
  Bell,
  Shield,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Brand {
  id: string
  name: string
  slug: string
  color: string | null
  socialAccounts: {
    id: string
    platform: string
    username: string
    followerCount: number
  }[]
  _count: {
    posts: number
    socialAccounts: number
  }
}

interface BrandsResponse {
  success: boolean
  data: Brand[]
}

const TABS = [
  { id: 'brands', label: 'Brands', icon: Database },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('brands')
  const [showAddBrand, setShowAddBrand] = useState(false)
  const [newBrand, setNewBrand] = useState({
    name: '',
    slug: '',
    color: '#18181b',
  })

  const queryClient = useQueryClient()

  const { data: brandsData, isLoading } = useQuery<BrandsResponse>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands')
      return res.json()
    },
  })

  const createBrandMutation = useMutation({
    mutationFn: async (brand: typeof newBrand) => {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      setShowAddBrand(false)
      setNewBrand({ name: '', slug: '', color: '#18181b' })
    },
  })

  const brands = brandsData?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-zinc-500">
          Manage your brands, integrations, and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-48">
          <nav className="flex flex-row gap-1 lg:flex-col">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'brands' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Brands</h2>
                <Button onClick={() => setShowAddBrand(!showAddBrand)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Brand
                </Button>
              </div>

              {showAddBrand && (
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Name
                        </label>
                        <Input
                          value={newBrand.name}
                          onChange={(e) =>
                            setNewBrand({
                              ...newBrand,
                              name: e.target.value,
                              slug: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, '-'),
                            })
                          }
                          placeholder="RapTV"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Slug
                        </label>
                        <Input
                          value={newBrand.slug}
                          onChange={(e) =>
                            setNewBrand({ ...newBrand, slug: e.target.value })
                          }
                          placeholder="raptv"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Color
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={newBrand.color}
                            onChange={(e) =>
                              setNewBrand({ ...newBrand, color: e.target.value })
                            }
                            className="h-10 w-14 p-1"
                          />
                          <Input
                            value={newBrand.color}
                            onChange={(e) =>
                              setNewBrand({ ...newBrand, color: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddBrand(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => createBrandMutation.mutate(newBrand)}
                        disabled={
                          !newBrand.name ||
                          !newBrand.slug ||
                          createBrandMutation.isPending
                        }
                      >
                        {createBrandMutation.isPending
                          ? 'Creating...'
                          : 'Create Brand'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="h-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : brands.length > 0 ? (
                <div className="space-y-4">
                  {brands.map((brand) => (
                    <Card key={brand.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-lg"
                              style={{
                                backgroundColor: brand.color || '#18181b',
                              }}
                            />
                            <div>
                              <h3 className="font-medium">{brand.name}</h3>
                              <p className="text-sm text-zinc-500">
                                {brand._count.posts.toLocaleString()} posts
                                across {brand._count.socialAccounts} accounts
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {brand.socialAccounts.map((account) => (
                              <Badge key={account.id} variant="outline">
                                {account.platform}: @{account.username}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Database className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                  <h3 className="mb-2 text-lg font-medium">No brands yet</h3>
                  <p className="text-zinc-500">
                    Add your first brand to get started
                  </p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Platform Integrations</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    name: 'Instagram',
                    description: 'Connect Instagram Business accounts',
                    status: 'available',
                  },
                  {
                    name: 'TikTok',
                    description: 'Connect TikTok creator accounts',
                    status: 'available',
                  },
                  {
                    name: 'X / Twitter',
                    description: 'Connect X/Twitter accounts',
                    status: 'coming_soon',
                  },
                  {
                    name: 'YouTube',
                    description: 'Connect YouTube channels',
                    status: 'coming_soon',
                  },
                  {
                    name: 'Facebook',
                    description: 'Connect Facebook pages',
                    status: 'coming_soon',
                  },
                  {
                    name: 'Snapchat',
                    description: 'Connect Snapchat accounts',
                    status: 'coming_soon',
                  },
                ].map((platform) => (
                  <Card key={platform.name}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        <p className="text-sm text-zinc-500">
                          {platform.description}
                        </p>
                      </div>
                      {platform.status === 'available' ? (
                        <Button variant="outline">Connect</Button>
                      ) : (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Slack Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-zinc-500">
                    Connect Slack to receive daily &quot;On This Day&quot;
                    digests and viral post alerts.
                  </p>
                  <Button variant="outline">
                    <Plug className="mr-2 h-4 w-4" />
                    Connect Slack
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">User Management</h2>
              <Card className="p-8 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                <h3 className="mb-2 text-lg font-medium">
                  User management coming soon
                </h3>
                <p className="text-zinc-500">
                  Manage team members and their permissions
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <Card>
                <CardContent className="space-y-4 p-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily On This Day digest</p>
                      <p className="text-sm text-zinc-500">
                        Get a daily summary of posts from this day in previous
                        years
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Viral post alerts</p>
                      <p className="text-sm text-zinc-500">
                        Get notified when a post exceeds viral thresholds
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tentpole reminders</p>
                      <p className="text-sm text-zinc-500">
                        Get reminders before upcoming tentpoles
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded"
                    />
                  </label>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Security Settings</h2>
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <h3 className="font-medium">Single Sign-On (SSO)</h3>
                    <p className="mb-2 text-sm text-zinc-500">
                      Sign in with your Google Workspace account
                    </p>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div>
                    <h3 className="font-medium">Audit Logs</h3>
                    <p className="mb-2 text-sm text-zinc-500">
                      Track all user actions and data access
                    </p>
                    <Button variant="outline" size="sm">
                      View Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
