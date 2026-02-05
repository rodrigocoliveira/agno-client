import { useState, useEffect, useCallback } from 'react'
import { useAgnoTraces } from '@rodrigocoliveira/agno-react'
import { TraceSummary, TraceDetail, TraceNode, TraceStatus } from '@rodrigocoliveira/agno-types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Activity,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: TraceStatus }) {
  const config = {
    OK: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
    ERROR: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
    UNSET: { icon: Clock, color: 'text-gray-600 bg-gray-50 border-gray-200' },
  }
  const { icon: Icon, color } = config[status] || config.UNSET
  return (
    <Badge variant="outline" className={cn("gap-1", color)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  )
}

interface SpanRowProps {
  span: TraceNode
  depth?: number
  onSelect: (span: TraceNode) => void
}

function SpanRow({ span, depth = 0, onSelect }: SpanRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = span.spans && span.spans.length > 0

  return (
    <div className="border-b border-border last:border-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 cursor-pointer transition-colors",
            span.status === 'ERROR' && "bg-red-50/50 dark:bg-red-950/20"
          )}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => onSelect(span)}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5" />
          )}
          <div className="flex-1 flex items-center gap-3">
            <span className="font-medium text-sm">{span.name}</span>
            <Badge variant="outline" className="text-xs">
              {span.type}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{span.duration}</span>
            <StatusBadge status={span.status} />
          </div>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {span.spans?.map((child, index) => (
              <SpanRow
                key={child.id || index}
                span={child}
                depth={depth + 1}
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

export function TracesPage() {
  const { traces, traceSessionStats, isLoading, fetchTraces, getTraceDetail, fetchTraceSessionStats } = useAgnoTraces()

  // Filter state
  const [statusFilter, setStatusFilter] = useState<TraceStatus | 'all'>('all')
  const [sessionIdFilter, setSessionIdFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [agentIdFilter, setAgentIdFilter] = useState('')

  // Detail state
  const [traceDetail, setTraceDetail] = useState<TraceDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [selectedSpan, setSelectedSpan] = useState<TraceNode | null>(null)

  // Fetch traces on mount
  useEffect(() => {
    fetchTraces()
  }, [fetchTraces])

  const handleRefresh = useCallback(() => {
    fetchTraces({
      status: statusFilter === 'all' ? undefined : statusFilter,
      session_id: sessionIdFilter || undefined,
      user_id: userIdFilter || undefined,
      agent_id: agentIdFilter || undefined,
    })
    toast.success('Traces refreshed')
  }, [fetchTraces, statusFilter, sessionIdFilter, userIdFilter, agentIdFilter])

  const handleApplyFilters = useCallback(() => {
    fetchTraces({
      status: statusFilter === 'all' ? undefined : statusFilter,
      session_id: sessionIdFilter || undefined,
      user_id: userIdFilter || undefined,
      agent_id: agentIdFilter || undefined,
    })
  }, [fetchTraces, statusFilter, sessionIdFilter, userIdFilter, agentIdFilter])

  const handleViewDetails = useCallback(async (trace: TraceSummary) => {
    setIsLoadingDetail(true)
    setTraceDetail(null)
    setSelectedSpan(null)
    try {
      const detail = await getTraceDetail(trace.trace_id)
      // Type guard - if it has tree property, it's a TraceDetail
      if ('tree' in detail) {
        setTraceDetail(detail as TraceDetail)
      }
    } catch (error) {
      toast.error('Failed to load trace details')
      console.error(error)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [getTraceDetail])

  const handleLoadStats = useCallback(() => {
    fetchTraceSessionStats()
  }, [fetchTraceSessionStats])

  const columns: Column<TraceSummary>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (trace) => (
        <span className="font-medium truncate max-w-[200px]">
          {trace.name || 'Unnamed'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (trace) => <StatusBadge status={trace.status} />,
      className: 'w-[100px]',
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (trace) => (
        <span className="text-sm text-muted-foreground font-mono">
          {trace.duration}
        </span>
      ),
      className: 'w-[100px]',
    },
    {
      key: 'spans',
      header: 'Spans',
      cell: (trace) => (
        <span className="text-sm text-muted-foreground">
          {trace.total_spans}
        </span>
      ),
      className: 'w-[80px]',
    },
    {
      key: 'errors',
      header: 'Errors',
      cell: (trace) => (
        <span className={cn(
          "text-sm",
          trace.error_count > 0 ? "text-red-600 font-medium" : "text-muted-foreground"
        )}>
          {trace.error_count}
        </span>
      ),
      className: 'w-[80px]',
    },
    {
      key: 'created',
      header: 'Created',
      cell: (trace) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(trace.created_at), 'MMM d, HH:mm')}
        </span>
      ),
      className: 'w-[120px]',
    },
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <PageHeader
          title="Traces"
          description="View execution traces with span-level detail for debugging and monitoring."
          action={
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />

        <Tabs defaultValue="traces" className="space-y-4">
          <TabsList>
            <TabsTrigger value="traces">Traces</TabsTrigger>
            <TabsTrigger value="stats" onClick={handleLoadStats}>
              Session Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traces" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="w-[150px]">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as TraceStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OK">OK</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="UNSET">UNSET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Session ID"
                value={sessionIdFilter}
                onChange={(e) => setSessionIdFilter(e.target.value)}
                className="w-[200px]"
              />
              <Input
                placeholder="User ID"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="w-[150px]"
              />
              <Input
                placeholder="Agent ID"
                value={agentIdFilter}
                onChange={(e) => setAgentIdFilter(e.target.value)}
                className="w-[150px]"
              />
              <Button variant="outline" onClick={handleApplyFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
              {(statusFilter !== 'all' || sessionIdFilter || userIdFilter || agentIdFilter) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter('all')
                    setSessionIdFilter('')
                    setUserIdFilter('')
                    setAgentIdFilter('')
                    fetchTraces()
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Traces Table */}
            {isLoading && traces.length === 0 ? (
              <LoadingState message="Loading traces..." />
            ) : traces.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6 text-muted-foreground" />}
                title="No traces yet"
                description="Traces will appear here once you start running agents."
                action={
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                }
              />
            ) : (
              <DataTable
                data={traces}
                columns={columns}
                keyExtractor={(trace) => trace.trace_id}
                onRowClick={handleViewDetails}
              />
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {traceSessionStats.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
                title="No session statistics"
                description="Session statistics will appear here once you have traces."
                action={
                  <Button variant="outline" onClick={handleLoadStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Stats
                  </Button>
                }
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Session Statistics</CardTitle>
                  <CardDescription>
                    Trace statistics grouped by session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Agent/Team</TableHead>
                        <TableHead className="text-right">Traces</TableHead>
                        <TableHead>First Trace</TableHead>
                        <TableHead>Last Trace</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {traceSessionStats.map((stat) => (
                        <TableRow
                          key={stat.session_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSessionIdFilter(stat.session_id)
                            handleApplyFilters()
                          }}
                        >
                          <TableCell className="font-mono text-xs">
                            {stat.session_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{stat.user_id || '-'}</TableCell>
                          <TableCell>{stat.agent_id || stat.team_id || stat.workflow_id || '-'}</TableCell>
                          <TableCell className="text-right font-medium">{stat.total_traces}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(stat.first_trace_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(stat.last_trace_at), 'MMM d, HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Trace Detail Sheet */}
      <Sheet open={!!traceDetail || isLoadingDetail} onOpenChange={() => {
        setTraceDetail(null)
        setSelectedSpan(null)
      }}>
        <SheetContent className="w-[700px] sm:w-[800px] p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Trace Details</SheetTitle>
            <SheetDescription>
              View the execution tree and span details.
            </SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <LoadingState message="Loading trace details..." className="mt-8" />
          ) : traceDetail ? (
            <div className="flex h-[calc(100vh-120px)]">
              {/* Span Tree */}
              <div className="flex-1 border-r border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{traceDetail.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {traceDetail.total_spans} spans, {traceDetail.duration}
                      </p>
                    </div>
                    <StatusBadge status={traceDetail.status} />
                  </div>
                </div>
                <ScrollArea className="h-[calc(100%-80px)]">
                  <div className="divide-y divide-border">
                    {traceDetail.tree.map((span, index) => (
                      <SpanRow
                        key={span.id || index}
                        span={span}
                        onSelect={setSelectedSpan}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Span Detail Panel */}
              <div className="w-[350px] overflow-auto">
                {selectedSpan ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedSpan.name}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedSpan.type}</Badge>
                        <StatusBadge status={selectedSpan.status} />
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-mono">{selectedSpan.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start</span>
                        <span className="font-mono text-xs">
                          {format(new Date(selectedSpan.start_time), 'HH:mm:ss.SSS')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End</span>
                        <span className="font-mono text-xs">
                          {format(new Date(selectedSpan.end_time), 'HH:mm:ss.SSS')}
                        </span>
                      </div>
                    </div>

                    {selectedSpan.input && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-xs">Input</Label>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-h-[150px]">
                            {typeof selectedSpan.input === 'string'
                              ? selectedSpan.input
                              : JSON.stringify(selectedSpan.input, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}

                    {selectedSpan.output && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-xs">Output</Label>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-h-[150px]">
                            {typeof selectedSpan.output === 'string'
                              ? selectedSpan.output
                              : JSON.stringify(selectedSpan.output, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}

                    {selectedSpan.error && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-xs text-red-600">Error</Label>
                          <pre className="mt-1 p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs overflow-x-auto text-red-700 dark:text-red-400">
                            {selectedSpan.error}
                          </pre>
                        </div>
                      </>
                    )}

                    {selectedSpan.metadata && Object.keys(selectedSpan.metadata).length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-xs">Metadata</Label>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-h-[100px]">
                            {JSON.stringify(selectedSpan.metadata, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Click a span to view details
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
