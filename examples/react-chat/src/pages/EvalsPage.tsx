import { useState, useEffect, useCallback } from 'react'
import { useAgnoEvals, useAgnoClient } from '@rodrigocoliveira/agno-react'
import { EvalSchema, EvalType } from '@rodrigocoliveira/agno-types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  FlaskConical,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  Edit2,
  Eye,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { cn } from '@/lib/utils'

function EvalTypeBadge({ type }: { type: EvalType }) {
  const colors: Record<EvalType, string> = {
    accuracy: 'bg-blue-100 text-blue-700 border-blue-200',
    agent_as_judge: 'bg-purple-100 text-purple-700 border-purple-200',
    performance: 'bg-orange-100 text-orange-700 border-orange-200',
    reliability: 'bg-green-100 text-green-700 border-green-200',
  }
  return (
    <Badge variant="outline" className={cn("capitalize", colors[type])}>
      {type.replace('_', ' ')}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isPassed = status === 'PASSED'
  return (
    <Badge variant={isPassed ? 'default' : 'destructive'} className="gap-1">
      {isPassed ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {status}
    </Badge>
  )
}

export function EvalsPage() {
  const client = useAgnoClient()
  const { evalRuns, isLoading, listEvalRuns, executeEval, updateEvalRun, deleteEvalRuns } = useAgnoEvals()

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [evalDetail, setEvalDetail] = useState<EvalSchema | null>(null)

  // Execute dialog state
  const [showExecuteDialog, setShowExecuteDialog] = useState(false)
  const [evalInput, setEvalInput] = useState('')
  const [evalType, setEvalType] = useState<EvalType>('accuracy')
  const [expectedOutput, setExpectedOutput] = useState('')
  const [evalName, setEvalName] = useState('')
  const [numIterations, setNumIterations] = useState(1)
  const [threshold, setThreshold] = useState(7)
  const [expectedToolCalls, setExpectedToolCalls] = useState('')
  const [additionalGuidelines, setAdditionalGuidelines] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  // Rename dialog state
  const [evalToRename, setEvalToRename] = useState<EvalSchema | null>(null)
  const [newName, setNewName] = useState('')

  // Get agents/teams for selection
  const [agents, setAgents] = useState<Array<{ id: string; name?: string }>>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  // Fetch eval runs on mount
  useEffect(() => {
    listEvalRuns()
  }, [listEvalRuns])

  // Get available agents
  useEffect(() => {
    const state = client.getState()
    setAgents(state.agents)
    if (state.agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(state.agents[0].id)
    }
  }, [client, selectedAgentId])

  const handleRefresh = useCallback(() => {
    listEvalRuns()
    toast.success('Evaluations refreshed')
  }, [listEvalRuns])

  const handleViewDetails = useCallback((evalRun: EvalSchema) => {
    setEvalDetail(evalRun)
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedKeys.size === 0) return
    setIsDeleting(true)
    try {
      await deleteEvalRuns(Array.from(selectedKeys))
      toast.success(`Deleted ${selectedKeys.size} evaluations`)
      setSelectedKeys(new Set())
      setShowBulkDelete(false)
    } catch (error) {
      toast.error('Failed to delete evaluations')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedKeys, deleteEvalRuns])

  const handleRename = useCallback(async () => {
    if (!evalToRename || !newName.trim()) return
    try {
      await updateEvalRun(evalToRename.id, { name: newName.trim() })
      toast.success('Evaluation renamed')
      setEvalToRename(null)
      setNewName('')
      listEvalRuns()
    } catch (error) {
      toast.error('Failed to rename evaluation')
      console.error(error)
    }
  }, [evalToRename, newName, updateEvalRun, listEvalRuns])

  const handleExecute = useCallback(async () => {
    if (!evalInput.trim()) {
      toast.error('Input is required')
      return
    }
    if (!selectedAgentId) {
      toast.error('Please select an agent')
      return
    }

    setIsExecuting(true)
    try {
      const toolCalls = expectedToolCalls
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const result = await executeEval({
        agent_id: selectedAgentId,
        eval_type: evalType,
        input: evalInput.trim(),
        expected_output: expectedOutput || undefined,
        name: evalName || undefined,
        num_iterations: numIterations,
        threshold: threshold,
        expected_tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        additional_guidelines: additionalGuidelines || undefined,
      })

      toast.success('Evaluation completed')
      setShowExecuteDialog(false)
      setEvalDetail(result)

      // Reset form
      setEvalInput('')
      setExpectedOutput('')
      setEvalName('')
      setExpectedToolCalls('')
      setAdditionalGuidelines('')

      // Refresh list
      listEvalRuns()
    } catch (error) {
      toast.error('Evaluation failed')
      console.error(error)
    } finally {
      setIsExecuting(false)
    }
  }, [
    evalInput,
    evalType,
    expectedOutput,
    evalName,
    numIterations,
    threshold,
    expectedToolCalls,
    additionalGuidelines,
    selectedAgentId,
    executeEval,
    listEvalRuns,
  ])

  const columns: Column<EvalSchema>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (evalRun) => (
        <span className="font-medium truncate max-w-[200px]">
          {evalRun.name || evalRun.evaluated_component_name || 'Unnamed'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (evalRun) => <EvalTypeBadge type={evalRun.eval_type} />,
      className: 'w-[140px]',
    },
    {
      key: 'component',
      header: 'Component',
      cell: (evalRun) => (
        <span className="text-sm text-muted-foreground">
          {evalRun.agent_id || evalRun.team_id || evalRun.workflow_id || '-'}
        </span>
      ),
      className: 'w-[150px]',
    },
    {
      key: 'model',
      header: 'Model',
      cell: (evalRun) => (
        <span className="text-sm text-muted-foreground">
          {evalRun.model_id || '-'}
        </span>
      ),
      className: 'w-[150px]',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (evalRun) => {
        const status = (evalRun.eval_data as any)?.eval_status
        return status ? <StatusBadge status={status} /> : '-'
      },
      className: 'w-[100px]',
    },
    {
      key: 'created',
      header: 'Created',
      cell: (evalRun) => (
        <span className="text-sm text-muted-foreground">
          {evalRun.created_at ? format(new Date(evalRun.created_at), 'MMM d, yyyy') : '-'}
        </span>
      ),
      className: 'w-[120px]',
    },
    {
      key: 'actions',
      header: '',
      cell: (evalRun) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(evalRun)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setEvalToRename(evalRun)
              setNewName(evalRun.name || '')
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedKeys(new Set([evalRun.id]))
                setShowBulkDelete(true)
              }}
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
          title="Evaluations"
          description="Run and manage evaluations - test accuracy, reliability, and agent performance."
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
              <Button size="sm" onClick={() => setShowExecuteDialog(true)}>
                <Play className="h-4 w-4 mr-2" />
                Run Evaluation
              </Button>
            </div>
          }
        />

        {isLoading && evalRuns.length === 0 ? (
          <LoadingState message="Loading evaluations..." />
        ) : evalRuns.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-6 w-6 text-muted-foreground" />}
            title="No evaluations yet"
            description="Run your first evaluation to test agent accuracy and reliability."
            action={
              <Button onClick={() => setShowExecuteDialog(true)}>
                <Play className="h-4 w-4 mr-2" />
                Run Evaluation
              </Button>
            }
          />
        ) : (
          <DataTable
            data={evalRuns}
            columns={columns}
            keyExtractor={(evalRun) => evalRun.id}
            selectable
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            onRowClick={handleViewDetails}
          />
        )}
      </div>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedKeys.size} Evaluation{selectedKeys.size > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected evaluations? This action cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!evalToRename} onOpenChange={() => setEvalToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Evaluation</DialogTitle>
            <DialogDescription>
              Enter a new name for this evaluation.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Evaluation name"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvalToRename(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Evaluation Dialog */}
      <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Run Evaluation</DialogTitle>
            <DialogDescription>
              Execute an evaluation against an agent to test its performance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name || agent.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Evaluation Type</Label>
                <Select value={evalType} onValueChange={(v) => setEvalType(v as EvalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="agent_as_judge">Agent as Judge</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="reliability">Reliability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Input *</Label>
              <Textarea
                value={evalInput}
                onChange={(e) => setEvalInput(e.target.value)}
                placeholder="Enter the test input..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Output (for accuracy evaluation)</Label>
              <Textarea
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                placeholder="Expected response..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Evaluation Name (optional)</Label>
              <Input
                value={evalName}
                onChange={(e) => setEvalName(e.target.value)}
                placeholder="Test name"
              />
            </div>

            {evalType === 'reliability' && (
              <div className="space-y-2">
                <Label>Expected Tool Calls (comma-separated)</Label>
                <Input
                  value={expectedToolCalls}
                  onChange={(e) => setExpectedToolCalls(e.target.value)}
                  placeholder="e.g., search, calculate"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Iterations: {numIterations}</Label>
                <Slider
                  value={[numIterations]}
                  onValueChange={([value]) => setNumIterations(value)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Threshold: {threshold}</Label>
                <Slider
                  value={[threshold]}
                  onValueChange={([value]) => setThreshold(value)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Guidelines (optional)</Label>
              <Textarea
                value={additionalGuidelines}
                onChange={(e) => setAdditionalGuidelines(e.target.value)}
                placeholder="Additional instructions for the evaluator..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExecute} disabled={isExecuting || !evalInput.trim()}>
              {isExecuting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eval Detail Sheet */}
      <Sheet open={!!evalDetail} onOpenChange={() => setEvalDetail(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-auto">
          <SheetHeader>
            <SheetTitle>Evaluation Details</SheetTitle>
            <SheetDescription>
              View evaluation results and metrics.
            </SheetDescription>
          </SheetHeader>

          {evalDetail && (
            <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Basic Info */}
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{evalDetail.name || 'Unnamed Evaluation'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {evalDetail.created_at
                        ? format(new Date(evalDetail.created_at), 'MMM d, yyyy HH:mm')
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <EvalTypeBadge type={evalDetail.eval_type} />
                  {(evalDetail.eval_data as any)?.eval_status && (
                    <StatusBadge status={(evalDetail.eval_data as any).eval_status} />
                  )}
                </div>

                <Separator />

                {/* Component Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Component</h4>
                  <div className="grid gap-2 text-sm">
                    {evalDetail.agent_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Agent ID</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {evalDetail.agent_id}
                        </code>
                      </div>
                    )}
                    {evalDetail.model_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span>{evalDetail.model_id}</span>
                      </div>
                    )}
                    {evalDetail.model_provider && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider</span>
                        <span>{evalDetail.model_provider}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Eval Input */}
                {evalDetail.eval_input && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Evaluation Input</h4>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(evalDetail.eval_input, null, 2)}
                      </pre>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Eval Data */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Evaluation Results</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(evalDetail.eval_data, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
