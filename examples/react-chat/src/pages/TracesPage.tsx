import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Layers,
  Timer,
  AlertTriangle,
  FileText,
  Code,
  Braces,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

// Helper to format duration for display
function formatDuration(duration: string | number | undefined): string {
  if (!duration) return '-'
  if (typeof duration === 'string') return duration
  if (duration < 1000) return `${duration}ms`
  return `${(duration / 1000).toFixed(2)}s`
}

// Helper to calculate span type breakdown
function getSpanTypeBreakdown(tree: TraceNode[]): Record<string, number> {
  const counts: Record<string, number> = {}
  
  function countSpans(spans: TraceNode[]) {
    for (const span of spans) {
      counts[span.type] = (counts[span.type] || 0) + 1
      if (span.spans?.length) {
        countSpans(span.spans)
      }
    }
  }
  
  countSpans(tree)
  return counts
}

// Span type colors for visual distinction
const spanTypeColors: Record<string, string> = {
  llm: 'bg-purple-500',
  tool: 'bg-blue-500',
  agent: 'bg-green-500',
  chain: 'bg-orange-500',
  retriever: 'bg-cyan-500',
  embedding: 'bg-pink-500',
  default: 'bg-gray-500',
}

interface SpanRowProps {
  span: TraceNode
  depth?: number
  maxDuration?: number
  onSelect: (span: TraceNode) => void
  isSelected?: boolean
}

function SpanRow({ span, depth = 0, maxDuration = 1, onSelect, isSelected }: SpanRowProps) {
  const [isOpen, setIsOpen] = useState(depth < 2) // Auto-expand first 2 levels
  const hasChildren = span.spans && span.spans.length > 0
  
  // Calculate duration percentage for timeline bar
  const durationMs = typeof span.duration === 'number' ? span.duration : 
    (span.duration ? parseFloat(span.duration) * 1000 : 0)
  const durationPercent = maxDuration > 0 ? Math.min((durationMs / maxDuration) * 100, 100) : 0
  
  const typeColor = spanTypeColors[span.type] || spanTypeColors.default

  return (
    <div className="border-b border-border/50 last:border-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 cursor-pointer transition-colors group",
            span.status === 'ERROR' && "bg-red-50/50 dark:bg-red-950/20",
            isSelected && "bg-primary/10 border-l-2 border-l-primary"
          )}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => onSelect(span)}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5 shrink-0" />
          )}
          
          {/* Type indicator dot */}
          <div className={cn("w-2 h-2 rounded-full shrink-0", typeColor)} />
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-medium text-sm truncate">{span.name}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {span.type}
            </Badge>
          </div>
          
          {/* Duration bar + time */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full", typeColor, "opacity-60")}
                style={{ width: `${durationPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono w-16 text-right">
              {formatDuration(span.duration)}
            </span>
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
                maxDuration={maxDuration}
                onSelect={onSelect}
                isSelected={isSelected && span === child}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

// Trace Overview Panel (shown when no span selected)
function TraceOverviewPanel({ trace }: { trace: TraceDetail }) {
  const spanBreakdown = useMemo(() => getSpanTypeBreakdown(trace.tree), [trace.tree])
  
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold break-words">{trace.name || 'Unnamed Trace'}</h3>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={trace.status} />
          {trace.error_count > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {trace.error_count} error{trace.error_count > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-xs">Duration</span>
            </div>
            <p className="text-xl font-semibold font-mono">{formatDuration(trace.duration)}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Layers className="h-4 w-4" />
              <span className="text-xs">Spans</span>
            </div>
            <p className="text-xl font-semibold">{trace.total_spans}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Span Type Breakdown */}
      {Object.keys(spanBreakdown).length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Span Breakdown
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(spanBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                <div className={cn("w-2 h-2 rounded-full", spanTypeColors[type] || spanTypeColors.default)} />
                <span className="text-xs">{type}</span>
                <span className="text-xs font-semibold text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Output Preview */}
      {trace.output && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Output
          </h4>
          <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-[200px] whitespace-pre-wrap break-words">
            {typeof trace.output === 'string' ? trace.output : JSON.stringify(trace.output, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Error */}
      {trace.error && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            Error
          </h4>
          <pre className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-xs overflow-x-auto text-red-700 dark:text-red-400 whitespace-pre-wrap break-words">
            {trace.error}
          </pre>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center pt-4 border-t">
        Select a span from the tree to view its details
      </p>
    </div>
  )
}

// Span Detail Panel (shown when a span is selected)
function SpanDetailPanel({ span, onClose }: { span: TraceNode; onClose: () => void }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold break-words">{span.name}</h4>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className={cn("w-2 h-2 rounded-full shrink-0", spanTypeColors[span.type] || spanTypeColors.default)} />
            <Badge variant="secondary" className="text-xs">{span.type}</Badge>
            <StatusBadge status={span.status} />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content with Tabs */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4">
            Details
          </TabsTrigger>
          {span.input && (
            <TabsTrigger value="input" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4">
              Input
            </TabsTrigger>
          )}
          {span.output && (
            <TabsTrigger value="output" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4">
              Output
            </TabsTrigger>
          )}
          {(span.metadata || span.extra_data) && (
            <TabsTrigger value="metadata" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4">
              Meta
            </TabsTrigger>
          )}
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="details" className="p-4 mt-0 space-y-4">
            {/* Timing */}
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timing</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground">Duration</span>
                  <p className="font-mono font-medium">{formatDuration(span.duration)}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-medium">{span.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground">Start</span>
                  <p className="font-mono text-xs">{format(new Date(span.start_time), 'HH:mm:ss.SSS')}</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground">End</span>
                  <p className="font-mono text-xs">{format(new Date(span.end_time), 'HH:mm:ss.SSS')}</p>
                </div>
              </div>
            </div>
            
            {/* Error */}
            {span.error && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Error
                </h5>
                <pre className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-xs overflow-x-auto text-red-700 dark:text-red-400 whitespace-pre-wrap break-words max-h-[200px]">
                  {span.error}
                </pre>
              </div>
            )}
            
            {/* Step Type */}
            {span.step_type && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Step Type</h5>
                <Badge variant="outline">{span.step_type}</Badge>
              </div>
            )}
            
            {/* Children count */}
            {span.spans && span.spans.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Children</h5>
                <p className="text-sm">{span.spans.length} child span{span.spans.length > 1 ? 's' : ''}</p>
              </div>
            )}
          </TabsContent>
          
          {span.input && (
            <TabsContent value="input" className="p-4 mt-0">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input Data</h5>
              </div>
              <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words">
                {typeof span.input === 'string' ? span.input : JSON.stringify(span.input, null, 2)}
              </pre>
            </TabsContent>
          )}
          
          {span.output && (
            <TabsContent value="output" className="p-4 mt-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output Data</h5>
              </div>
              <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words">
                {typeof span.output === 'string' ? span.output : JSON.stringify(span.output, null, 2)}
              </pre>
            </TabsContent>
          )}
          
          {(span.metadata || span.extra_data) && (
            <TabsContent value="metadata" className="p-4 mt-0 space-y-4">
              {span.metadata && Object.keys(span.metadata).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Braces className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata</h5>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(span.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {span.extra_data && Object.keys(span.extra_data).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Braces className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extra Data</h5>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(span.extra_data, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
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

  // Calculate max duration for timeline bars
  const maxSpanDuration = useMemo(() => {
    if (!traceDetail?.tree) return 1
    let max = 0
    function findMax(spans: TraceNode[]) {
      for (const span of spans) {
        const d = typeof span.duration === 'number' ? span.duration : 
          (span.duration ? parseFloat(span.duration) * 1000 : 0)
        if (d > max) max = d
        if (span.spans?.length) findMax(span.spans)
      }
    }
    findMax(traceDetail.tree)
    return max || 1
  }, [traceDetail?.tree])

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

      {/* Trace Detail Sheet - Improved */}
      <Sheet open={!!traceDetail || isLoadingDetail} onOpenChange={() => {
        setTraceDetail(null)
        setSelectedSpan(null)
      }}>
        <SheetContent className="w-[90vw] max-w-[1100px] sm:max-w-[1100px] p-0">
          <SheetHeader className="p-4 pb-0 sr-only">
            <SheetTitle>Trace Details</SheetTitle>
            <SheetDescription>
              View the execution tree and span details.
            </SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <LoadingState message="Loading trace details..." className="mt-8" />
          ) : traceDetail ? (
            <div className="flex h-[calc(100vh-32px)]">
              {/* Span Tree - Left Panel */}
              <div className="flex-1 border-r border-border overflow-hidden flex flex-col min-w-0">
                <div className="p-4 border-b border-border bg-muted/30 shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold truncate" title={traceDetail.name}>
                        {traceDetail.name || 'Unnamed Trace'}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {traceDetail.total_spans} spans
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          {formatDuration(traceDetail.duration)}
                        </span>
                        {traceDetail.error_count > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {traceDetail.error_count} error{traceDetail.error_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={traceDetail.status} />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div>
                    {traceDetail.tree.map((span, index) => (
                      <SpanRow
                        key={span.id || index}
                        span={span}
                        maxDuration={maxSpanDuration}
                        onSelect={setSelectedSpan}
                        isSelected={selectedSpan?.id === span.id}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Detail Panel - Right Side */}
              <div className="w-[380px] overflow-hidden bg-background shrink-0">
                {selectedSpan ? (
                  <SpanDetailPanel span={selectedSpan} onClose={() => setSelectedSpan(null)} />
                ) : (
                  <TraceOverviewPanel trace={traceDetail} />
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
