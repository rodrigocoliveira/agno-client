import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAgnoSession, useAgnoClient } from '@rodrigocoliveira/agno-react'
import { SessionEntry, AgentSessionDetailSchema, TeamSessionDetailSchema } from '@rodrigocoliveira/agno-types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  History,
  Plus,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  Edit2,
  Eye,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'

export function SessionsPage() {
  const navigate = useNavigate()
  const client = useAgnoClient()
  const { sessions, isLoading, fetchSessions, deleteSession, deleteMultipleSessions, renameSession, createSession } = useAgnoSession()

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [sessionToRename, setSessionToRename] = useState<SessionEntry | null>(null)
  const [newName, setNewName] = useState('')
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sessionDetail, setSessionDetail] = useState<AgentSessionDetailSchema | TeamSessionDetailSchema | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRefresh = useCallback(() => {
    fetchSessions()
    toast.success('Sessions refreshed')
  }, [fetchSessions])

  const handleOpenInChat = useCallback((session: SessionEntry) => {
    client.loadSession(session.session_id)
    navigate('/chat')
  }, [client, navigate])

  const handleViewDetails = useCallback(async (session: SessionEntry) => {
    setIsLoadingDetail(true)
    setSessionDetail(null)
    try {
      const detail = await client.getSessionById(session.session_id)
      setSessionDetail(detail)
    } catch (error) {
      toast.error('Failed to load session details')
      console.error(error)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [client])

  const handleDelete = useCallback(async () => {
    if (!sessionToDelete) return
    setIsDeleting(true)
    try {
      await deleteSession(sessionToDelete)
      toast.success('Session deleted')
      setSessionToDelete(null)
    } catch (error) {
      toast.error('Failed to delete session')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [sessionToDelete, deleteSession])

  const handleBulkDelete = useCallback(async () => {
    if (selectedKeys.size === 0) return
    setIsDeleting(true)
    try {
      await deleteMultipleSessions(Array.from(selectedKeys))
      toast.success(`Deleted ${selectedKeys.size} sessions`)
      setSelectedKeys(new Set())
      setShowBulkDelete(false)
    } catch (error) {
      toast.error('Failed to delete sessions')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedKeys, deleteMultipleSessions])

  const handleRename = useCallback(async () => {
    if (!sessionToRename || !newName.trim()) return
    try {
      await renameSession(sessionToRename.session_id, newName.trim())
      toast.success('Session renamed')
      setSessionToRename(null)
      setNewName('')
    } catch (error) {
      toast.error('Failed to rename session')
      console.error(error)
    }
  }, [sessionToRename, newName, renameSession])

  const handleCreate = useCallback(async () => {
    setIsCreating(true)
    try {
      const session = await createSession({
        session_name: newSessionName.trim() || undefined,
      })
      toast.success('Session created')
      setShowCreateDialog(false)
      setNewSessionName('')
      // Optionally open the new session
      client.loadSession(session.session_id)
      navigate('/chat')
    } catch (error) {
      toast.error('Failed to create session')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }, [newSessionName, createSession, client, navigate])

  const columns: Column<SessionEntry>[] = [
    {
      key: 'name',
      header: 'Session Name',
      cell: (session) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[300px]">
            {session.session_name || 'Unnamed session'}
          </span>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (session) => (
        <span className="text-sm text-muted-foreground">
          {session.created_at ? format(new Date(session.created_at), 'MMM d, yyyy HH:mm') : '-'}
        </span>
      ),
      className: 'w-[180px]',
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (session) => (
        <span className="text-sm text-muted-foreground">
          {session.updated_at ? format(new Date(session.updated_at), 'MMM d, yyyy HH:mm') : '-'}
        </span>
      ),
      className: 'w-[180px]',
    },
    {
      key: 'actions',
      header: '',
      cell: (session) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenInChat(session) }}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Open in Chat
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleViewDetails(session) }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => {
              e.preventDefault()
              setSessionToRename(session)
              setNewName(session.session_name || '')
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setSessionToDelete(session.session_id) }}
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
          title="Sessions"
          description="Manage conversation sessions - create, load, rename, and delete."
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
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>
          }
        />

        {isLoading && sessions.length === 0 ? (
          <LoadingState message="Loading sessions..." />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<History className="h-6 w-6 text-muted-foreground" />}
            title="No sessions yet"
            description="Create a new session or start chatting to create one automatically."
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            }
          />
        ) : (
          <DataTable
            data={sessions}
            columns={columns}
            keyExtractor={(session) => session.session_id}
            selectable
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            onRowClick={handleViewDetails}
          />
        )}
      </div>

      {/* Delete Single Session Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
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
            <AlertDialogTitle>Delete {selectedKeys.size} Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedKeys.size} sessions? This action cannot be undone.
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

      {/* Rename Dialog */}
      <Dialog open={!!sessionToRename} onOpenChange={() => setSessionToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>
              Enter a new name for this session.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Session name"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToRename(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Create a new conversation session. You can optionally provide a name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Session name (optional)"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Detail Sheet */}
      <Sheet open={!!sessionDetail || isLoadingDetail} onOpenChange={() => setSessionDetail(null)}>
        <SheetContent className="w-[500px] sm:w-[540px] overflow-auto">
          <SheetHeader>
            <SheetTitle>Session Details</SheetTitle>
            <SheetDescription>
              View session information and metadata.
            </SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <LoadingState message="Loading session details..." className="mt-8" />
          ) : sessionDetail ? (
            <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Basic Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session ID</span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {sessionDetail.session_id}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span>{sessionDetail.session_name || '-'}</span>
                    </div>
                    {'agent_id' in sessionDetail && sessionDetail.agent_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Agent ID</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {sessionDetail.agent_id}
                        </code>
                      </div>
                    )}
                    {'team_id' in sessionDetail && sessionDetail.team_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Team ID</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {sessionDetail.team_id}
                        </code>
                      </div>
                    )}
                    {sessionDetail.user_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {sessionDetail.user_id}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Metrics */}
                {sessionDetail.metrics && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {sessionDetail.total_tokens !== undefined && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-semibold">{sessionDetail.total_tokens?.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total Tokens</div>
                          </div>
                        )}
                        {typeof sessionDetail.metrics === 'object' && sessionDetail.metrics && (
                          <>
                            {'input_tokens' in sessionDetail.metrics && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-semibold">
                                  {(sessionDetail.metrics.input_tokens as number)?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Input Tokens</div>
                              </div>
                            )}
                            {'output_tokens' in sessionDetail.metrics && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-semibold">
                                  {(sessionDetail.metrics.output_tokens as number)?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Output Tokens</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Summary */}
                {sessionDetail.session_summary && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {typeof sessionDetail.session_summary === 'object' && 'summary' in sessionDetail.session_summary
                          ? (sessionDetail.session_summary.summary as string)
                          : JSON.stringify(sessionDetail.session_summary)}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Timestamps */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Timestamps</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {sessionDetail.created_at
                          ? format(new Date(sessionDetail.created_at), 'MMM d, yyyy HH:mm:ss')
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span>
                        {sessionDetail.updated_at
                          ? format(new Date(sessionDetail.updated_at), 'MMM d, yyyy HH:mm:ss')
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Open in Chat Button */}
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      client.loadSession(sessionDetail.session_id)
                      setSessionDetail(null)
                      navigate('/chat')
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open in Chat
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
