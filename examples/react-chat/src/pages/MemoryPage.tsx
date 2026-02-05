import { useState, useEffect, useCallback } from 'react'
import { useAgnoMemory } from '@rodrigocoliveira/agno-react'
import { UserMemory, UserMemoryStats } from '@rodrigocoliveira/agno-types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Brain,
  Plus,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  Edit2,
  Tag,
  User,
  Search,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'

export function MemoryPage() {
  const {
    memories,
    topics,
    isLoading,
    fetchMemories,
    getMemoryTopics,
    getUserMemoryStats,
    createMemory,
    updateMemory,
    deleteMemory,
    deleteMultipleMemories,
  } = useAgnoMemory()

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [userIdFilter, setUserIdFilter] = useState('')

  // Create/Edit dialog state
  const [showMemoryDialog, setShowMemoryDialog] = useState(false)
  const [memoryToEdit, setMemoryToEdit] = useState<UserMemory | null>(null)
  const [memoryContent, setMemoryContent] = useState('')
  const [memoryTopics, setMemoryTopics] = useState('')
  const [memoryUserId, setMemoryUserId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Stats state
  const [memoryStats, setMemoryStats] = useState<UserMemoryStats[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Fetch memories and topics on mount
  useEffect(() => {
    fetchMemories()
    getMemoryTopics()
  }, [fetchMemories, getMemoryTopics])

  const handleRefresh = useCallback(() => {
    fetchMemories({
      search_content: searchQuery || undefined,
      topics: selectedTopics.length > 0 ? selectedTopics : undefined,
      user_id: userIdFilter || undefined,
    })
    getMemoryTopics()
    toast.success('Memories refreshed')
  }, [fetchMemories, getMemoryTopics, searchQuery, selectedTopics, userIdFilter])

  const handleSearch = useCallback(() => {
    fetchMemories({
      search_content: searchQuery || undefined,
      topics: selectedTopics.length > 0 ? selectedTopics : undefined,
      user_id: userIdFilter || undefined,
    })
  }, [fetchMemories, searchQuery, selectedTopics, userIdFilter])

  const handleDelete = useCallback(async () => {
    if (!memoryToDelete) return
    setIsDeleting(true)
    try {
      await deleteMemory(memoryToDelete)
      toast.success('Memory deleted')
      setMemoryToDelete(null)
    } catch (error) {
      toast.error('Failed to delete memory')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [memoryToDelete, deleteMemory])

  const handleBulkDelete = useCallback(async () => {
    if (selectedKeys.size === 0) return
    setIsDeleting(true)
    try {
      await deleteMultipleMemories(Array.from(selectedKeys))
      toast.success(`Deleted ${selectedKeys.size} memories`)
      setSelectedKeys(new Set())
      setShowBulkDelete(false)
    } catch (error) {
      toast.error('Failed to delete memories')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedKeys, deleteMultipleMemories])

  const openCreateDialog = useCallback(() => {
    setMemoryToEdit(null)
    setMemoryContent('')
    setMemoryTopics('')
    setMemoryUserId('')
    setShowMemoryDialog(true)
  }, [])

  const openEditDialog = useCallback((memory: UserMemory) => {
    setMemoryToEdit(memory)
    setMemoryContent(memory.memory)
    setMemoryTopics(memory.topics?.join(', ') || '')
    setMemoryUserId(memory.user_id || '')
    setShowMemoryDialog(true)
  }, [])

  const handleSaveMemory = useCallback(async () => {
    if (!memoryContent.trim()) {
      toast.error('Memory content is required')
      return
    }

    setIsSaving(true)
    try {
      const topicsArray = memoryTopics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      if (memoryToEdit) {
        await updateMemory(memoryToEdit.memory_id, {
          memory: memoryContent.trim(),
          topics: topicsArray.length > 0 ? topicsArray : undefined,
          user_id: memoryUserId || undefined,
        })
        toast.success('Memory updated')
      } else {
        await createMemory({
          memory: memoryContent.trim(),
          topics: topicsArray.length > 0 ? topicsArray : undefined,
          user_id: memoryUserId || undefined,
        })
        toast.success('Memory created')
      }
      setShowMemoryDialog(false)
    } catch (error) {
      toast.error(memoryToEdit ? 'Failed to update memory' : 'Failed to create memory')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }, [memoryContent, memoryTopics, memoryUserId, memoryToEdit, createMemory, updateMemory])

  const handleLoadStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const response = await getUserMemoryStats({ limit: 50 })
      setMemoryStats(response.data)
    } catch (error) {
      toast.error('Failed to load memory stats')
      console.error(error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [getUserMemoryStats])

  const toggleTopicFilter = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }, [])

  const columns: Column<UserMemory>[] = [
    {
      key: 'memory',
      header: 'Memory',
      cell: (memory) => (
        <div className="max-w-[400px]">
          <p className="truncate text-sm">{memory.memory}</p>
        </div>
      ),
    },
    {
      key: 'topics',
      header: 'Topics',
      cell: (memory) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {memory.topics?.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
          {(memory.topics?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(memory.topics?.length || 0) - 3}
            </Badge>
          )}
        </div>
      ),
      className: 'w-[200px]',
    },
    {
      key: 'user',
      header: 'User',
      cell: (memory) => (
        <span className="text-sm text-muted-foreground">
          {memory.user_id || '-'}
        </span>
      ),
      className: 'w-[120px]',
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (memory) => (
        <span className="text-sm text-muted-foreground">
          {memory.updated_at ? format(new Date(memory.updated_at), 'MMM d, yyyy') : '-'}
        </span>
      ),
      className: 'w-[120px]',
    },
    {
      key: 'actions',
      header: '',
      cell: (memory) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(memory)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setMemoryToDelete(memory.memory_id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-[50px]',
    },
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <PageHeader
          title="Memory"
          description="Manage user memories - create, update, and organize with topics."
          action={
            <div className="flex items-center gap-2">
              {selectedKeys.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedKeys.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Memory
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="memories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="stats" onClick={handleLoadStats}>
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memories" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search memories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-[200px]">
                <Input
                  placeholder="Filter by user ID"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                Apply Filters
              </Button>
              {(searchQuery || userIdFilter || selectedTopics.length > 0) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('')
                    setUserIdFilter('')
                    setSelectedTopics([])
                    fetchMemories()
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Topic Filter Badges */}
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground py-1">Topics:</span>
                {topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant={selectedTopics.includes(topic) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTopicFilter(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            {/* Memories Table */}
            {isLoading && memories.length === 0 ? (
              <LoadingState message="Loading memories..." />
            ) : memories.length === 0 ? (
              <EmptyState
                icon={<Brain className="h-6 w-6 text-muted-foreground" />}
                title="No memories yet"
                description="Create your first memory to help the agent remember important information."
                action={
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Memory
                  </Button>
                }
              />
            ) : (
              <DataTable
                data={memories}
                columns={columns}
                keyExtractor={(memory) => memory.memory_id}
                selectable
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                onRowClick={openEditDialog}
              />
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            {topics.length === 0 ? (
              <EmptyState
                icon={<Tag className="h-6 w-6 text-muted-foreground" />}
                title="No topics yet"
                description="Topics are created automatically when you add memories with topics."
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {topics.map((topic) => (
                  <Card
                    key={topic}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setSelectedTopics([topic])
                      fetchMemories({ topics: [topic] })
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        {topic}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Click to filter memories by this topic
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {isLoadingStats ? (
              <LoadingState message="Loading statistics..." />
            ) : memoryStats.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
                title="No statistics available"
                description="Memory statistics will appear here once you have memories."
                action={
                  <Button variant="outline" onClick={handleLoadStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memoryStats.map((stat) => (
                  <Card key={stat.user_id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {stat.user_id}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.total_memories}</div>
                      <p className="text-xs text-muted-foreground">memories</p>
                      {stat.last_memory_updated_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last updated: {format(new Date(stat.last_memory_updated_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Single Memory Dialog */}
      <AlertDialog open={!!memoryToDelete} onOpenChange={() => setMemoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this memory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedKeys.size} Memories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedKeys.size} memories? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Memory Dialog */}
      <Dialog open={showMemoryDialog} onOpenChange={setShowMemoryDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{memoryToEdit ? 'Edit Memory' : 'Create Memory'}</DialogTitle>
            <DialogDescription>
              {memoryToEdit
                ? 'Update the memory content and metadata.'
                : 'Create a new memory to help the agent remember important information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memory-content">Memory Content *</Label>
              <Textarea
                id="memory-content"
                value={memoryContent}
                onChange={(e) => setMemoryContent(e.target.value)}
                placeholder="Enter the memory content..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-topics">Topics (comma-separated)</Label>
              <Input
                id="memory-topics"
                value={memoryTopics}
                onChange={(e) => setMemoryTopics(e.target.value)}
                placeholder="e.g., preferences, personal, work"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-user">User ID (optional)</Label>
              <Input
                id="memory-user"
                value={memoryUserId}
                onChange={(e) => setMemoryUserId(e.target.value)}
                placeholder="User ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMemory} disabled={isSaving || !memoryContent.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {memoryToEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
