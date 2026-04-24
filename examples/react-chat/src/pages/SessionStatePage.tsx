import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useAgnoChat,
  useAgnoClient,
  useAgnoSessionState,
} from '@rodrigocoliveira/agno-react'
import { toast } from 'sonner'
import {
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
  Loader2,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  TimerReset,
  User2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'

type CounterState = {
  counter?: number
  marker?: string
  history?: Array<{ action: string; by?: number; result?: number }>
  [key: string]: unknown
}

type ChangeSource = 'in-stream' | 'post-stream' | 'manual' | 'load' | 'unknown'

type ChangeRow = {
  at: number
  source: ChangeSource
  state: CounterState | null
}

type TimelineRow = {
  at: number
  kind: 'stream:start' | 'stream:end' | 'refresh:start' | 'refresh:end'
}

const AGENT_ID = 'state-counter-agent'
const TEAM_ID = 'state-counter-team'
const HISTORY_LIMIT = 12
const TIMELINE_LIMIT = 16

function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function sourceBadgeClass(source: ChangeSource): string {
  switch (source) {
    case 'in-stream':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
    case 'post-stream':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400'
    case 'manual':
      return 'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400'
    case 'load':
      return 'bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-400'
    default:
      return 'bg-muted text-muted-foreground border-muted'
  }
}

export function SessionStatePage() {
  const client = useAgnoClient()
  const { sendMessage, isStreaming } = useAgnoChat()
  const {
    sessionState,
    isRefreshing,
    setSessionState,
    mergeSessionState,
    refreshSessionState,
  } = useAgnoSessionState<CounterState>()

  // Mode + opt-out are stored in React state too so the controls render correctly.
  const [mode, setMode] = useState<'agent' | 'team'>(
    () => (client.getConfig().mode as 'agent' | 'team') ?? 'agent'
  )
  const [extractFromCustomEvent, setExtractFromCustomEvent] = useState<boolean>(
    () => client.getConfig().extractSessionStateFromCustomEvent !== false
  )

  // Apply the demo-required identity on mount AND defend it against drift.
  // `client.initialize()` (called by AppLayout's AutoInitializer) auto-selects
  // the first agent returned by the backend when no agentId is configured —
  // and that first agent is `generative-ui-demo`, not ours. If `initialize()`
  // resolves *after* this effect runs, it overwrites our settings. Listening
  // to `config:change` and re-applying on drift is what keeps the demo on
  // the right agent regardless of order.
  useEffect(() => {
    const wantAgent = mode === 'agent' ? AGENT_ID : undefined
    const wantTeam = mode === 'team' ? TEAM_ID : undefined
    const wantExtract = extractFromCustomEvent

    const enforce = () => {
      const cfg = client.getConfig()
      const currentExtract = cfg.extractSessionStateFromCustomEvent !== false
      const drifted =
        cfg.mode !== mode ||
        cfg.agentId !== wantAgent ||
        cfg.teamId !== wantTeam ||
        currentExtract !== wantExtract
      if (drifted) {
        client.updateConfig({
          mode,
          agentId: wantAgent,
          teamId: wantTeam,
          extractSessionStateFromCustomEvent: wantExtract,
        })
      }
    }

    enforce()
    client.on('config:change', enforce)
    return () => {
      client.off('config:change', enforce)
    }
  }, [client, mode, extractFromCustomEvent])

  // Change history — tagged with the inferred source so the user can see
  // which sync path delivered each update.
  const [changes, setChanges] = useState<ChangeRow[]>([])
  const [timeline, setTimeline] = useState<TimelineRow[]>([])
  const streamingRef = useRef(false)
  const refreshingRef = useRef(false)

  useEffect(() => {
    streamingRef.current = isStreaming
  }, [isStreaming])

  useEffect(() => {
    refreshingRef.current = isRefreshing
  }, [isRefreshing])

  useEffect(() => {
    const onStateChange = (state: CounterState | null) => {
      const source: ChangeSource = refreshingRef.current
        ? 'post-stream'
        : streamingRef.current
          ? 'in-stream'
          : 'manual'
      const row: ChangeRow = { at: Date.now(), source, state }
      setChanges((prev) => [row, ...prev].slice(0, HISTORY_LIMIT))
    }
    const pushTimeline = (kind: TimelineRow['kind']) => {
      setTimeline((prev) => [{ at: Date.now(), kind }, ...prev].slice(0, TIMELINE_LIMIT))
    }
    const onStreamStart = () => pushTimeline('stream:start')
    const onStreamEnd = () => pushTimeline('stream:end')
    const onRefreshStart = () => pushTimeline('refresh:start')
    const onRefreshEnd = () => pushTimeline('refresh:end')
    const onSessionLoaded = () => {
      const row: ChangeRow = {
        at: Date.now(),
        source: 'load',
        state: client.getSessionState<CounterState>(),
      }
      setChanges((prev) => [row, ...prev].slice(0, HISTORY_LIMIT))
    }

    client.on('session-state:change', onStateChange)
    client.on('stream:start', onStreamStart)
    client.on('stream:end', onStreamEnd)
    client.on('session-state:refresh:start', onRefreshStart)
    client.on('session-state:refresh:end', onRefreshEnd)
    client.on('session:loaded', onSessionLoaded)

    return () => {
      client.off('session-state:change', onStateChange)
      client.off('stream:start', onStreamStart)
      client.off('stream:end', onStreamEnd)
      client.off('session-state:refresh:start', onRefreshStart)
      client.off('session-state:refresh:end', onRefreshEnd)
      client.off('session:loaded', onSessionLoaded)
    }
  }, [client])

  // ---------- Actions ----------
  const [draft, setDraft] = useState('Increment the counter by 3.')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorJson, setEditorJson] = useState('')
  const [editorError, setEditorError] = useState<string | null>(null)

  const handleSend = useCallback(async () => {
    const message = draft.trim()
    if (!message || isStreaming) return
    try {
      await sendMessage(message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }, [draft, isStreaming, sendMessage])

  const openEditor = useCallback(() => {
    setEditorJson(JSON.stringify(sessionState ?? { counter: 0 }, null, 2))
    setEditorError(null)
    setEditorOpen(true)
  }, [sessionState])

  const handleSaveEditor = useCallback(async () => {
    let parsed: CounterState
    try {
      parsed = JSON.parse(editorJson) as CounterState
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Top-level value must be a JSON object.')
      }
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : String(err))
      return
    }
    try {
      await setSessionState(parsed)
      setEditorOpen(false)
      toast.success('session_state replaced')
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : String(err))
    }
  }, [editorJson, setSessionState])

  const handleMergeMarker = useCallback(async () => {
    try {
      await mergeSessionState({ marker: `manual-${Date.now()}` })
      toast.success('marker merged into session_state')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }, [mergeSessionState])

  const handleRefresh = useCallback(async () => {
    try {
      const next = await refreshSessionState()
      toast.success(next ? 'session_state refreshed' : 'no active session yet — send a message first')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }, [refreshSessionState])

  // ---------- Derived ----------
  const counterDisplay = useMemo(
    () => (typeof sessionState?.counter === 'number' ? sessionState.counter : '—'),
    [sessionState?.counter]
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 pt-6">
        <PageHeader
          title="Session State"
          description="Watch the backend-managed session_state dict update live as the agent (or team) calls tools — no extra REST calls during agent runs."
          action={
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="h-3 w-3" />
              useAgnoSessionState
            </Badge>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* LEFT COLUMN — controls + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User2 className="h-3.5 w-3.5" />
                  Mode
                </Label>
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v as 'agent' | 'team')}
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <RadioGroupItem value="agent" id="mode-agent" />
                    <span>Agent <span className="text-muted-foreground">({AGENT_ID})</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <RadioGroupItem value="team" id="mode-team" />
                    <span>Team <span className="text-muted-foreground">({TEAM_ID})</span></span>
                  </label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Team runs trigger an extra REST refresh on stream:end (Agno 2.6.0 doesn't carry
                  session_state on TeamRunCompleted).
                </p>
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="opt-out" className="cursor-pointer">
                    Auto-extract from custom events
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When off, mid-run SessionStateUpdatedEvent payloads no longer feed the cache.
                    The RunCompleted chunk path still fires.
                  </p>
                </div>
                <Switch
                  id="opt-out"
                  checked={extractFromCustomEvent}
                  onCheckedChange={setExtractFromCustomEvent}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder='Try: "Increment by 5" or "Reset the counter"'
              />
              <div className="flex gap-2">
                <Button onClick={handleSend} disabled={isStreaming || !draft.trim()} className="flex-1">
                  {isStreaming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Streaming…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Increment by 1', 'Increment by 5', 'Reset the counter'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDraft(preset)}
                    className="px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={openEditor} className="w-full justify-start">
                <PenLine className="h-4 w-4 mr-2" />
                Set session_state…
              </Button>
              <Button variant="outline" onClick={handleMergeMarker} className="w-full justify-start">
                <Boxes className="h-4 w-4 mr-2" />
                Merge {'{ marker: ... }'}
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="w-full justify-start"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh from backend
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN — live state */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Live session_state</CardTitle>
              {isRefreshing && (
                <Badge variant="outline" className="gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  refreshing
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  counter
                </div>
                <div className="text-4xl font-bold tabular-nums">{counterDisplay}</div>
              </div>
              <div className="rounded-lg border bg-muted/30">
                <div className="px-3 py-2 text-xs font-medium border-b text-muted-foreground">
                  raw JSON
                </div>
                <pre className="p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                  {sessionState ? JSON.stringify(sessionState, null, 2) : '// null — send a message or refresh'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — history + timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Change history
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-72">
                {changes.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No state changes yet. Send a message or refresh.
                  </div>
                ) : (
                  <div className="divide-y">
                    {changes.map((row, idx) => (
                      <div key={`${row.at}-${idx}`} className="px-4 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-[10px] gap-1', sourceBadgeClass(row.source))}>
                            {row.source === 'in-stream' && <CheckCircle2 className="h-2.5 w-2.5" />}
                            {row.source === 'post-stream' && <RefreshCw className="h-2.5 w-2.5" />}
                            {row.source}
                          </Badge>
                          <span className="text-muted-foreground tabular-nums">{fmtTime(row.at)}</span>
                        </div>
                        <code className="text-muted-foreground break-all">
                          {row.state ? JSON.stringify(row.state) : 'null'}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TimerReset className="h-4 w-4" />
                Stream timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-44">
                {timeline.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No events yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {timeline.map((row, idx) => (
                      <div
                        key={`${row.at}-${idx}`}
                        className="px-4 py-1.5 text-xs flex items-center justify-between gap-2"
                      >
                        <code
                          className={cn(
                            'font-mono',
                            row.kind.startsWith('refresh') && 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {row.kind}
                        </code>
                        <span className="text-muted-foreground tabular-nums">{fmtTime(row.at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Set session_state</DialogTitle>
            <DialogDescription>
              Replaces the entire session_state via PATCH /sessions/&#123;id&#125;.
              Top-level value must be a JSON object.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editorJson}
            onChange={(e) => setEditorJson(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          {editorError && (
            <p className="text-xs text-destructive">{editorError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditor}>
              <Input className="hidden" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
