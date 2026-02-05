import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAgnoMetrics } from '@rodrigocoliveira/agno-react'
import { ModelMetrics } from '@rodrigocoliveira/agno-types'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'
import {
  BarChart3,
  RefreshCw,
  Calendar,
  Loader2,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
}

function MetricCard({ title, value, subtitle, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs mt-1",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <TrendingUp className={cn("h-3 w-3 mr-1", !trend.isPositive && "rotate-180")} />
            {trend.value}% from previous period
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const chartConfig = {
  input_tokens: {
    label: "Input Tokens",
    color: "hsl(var(--chart-1))",
  },
  output_tokens: {
    label: "Output Tokens",
    color: "hsl(var(--chart-2))",
  },
  agent_runs: {
    label: "Agent Runs",
    color: "hsl(var(--chart-3))",
  },
  team_runs: {
    label: "Team Runs",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function MetricsPage() {
  const { metrics, isLoading, isRefreshing, fetchMetrics, refreshMetrics } = useAgnoMetrics()

  // Date range state
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Fetch metrics on mount and when dates change
  useEffect(() => {
    fetchMetrics({ startingDate: startDate, endingDate: endDate })
  }, [fetchMetrics, startDate, endDate])

  const handleRefresh = useCallback(async () => {
    try {
      await refreshMetrics()
      toast.success('Metrics refreshed')
      // Refetch after refresh
      fetchMetrics({ startingDate: startDate, endingDate: endDate })
    } catch (error) {
      toast.error('Failed to refresh metrics')
      console.error(error)
    }
  }, [refreshMetrics, fetchMetrics, startDate, endDate])

  // Aggregate metrics across all days
  const aggregatedMetrics = useMemo(() => {
    if (!metrics?.metrics?.length) return null

    return metrics.metrics.reduce(
      (acc, day) => ({
        totalRuns: acc.totalRuns + day.agent_runs_count + day.team_runs_count + day.workflow_runs_count,
        totalSessions: acc.totalSessions + day.agent_sessions_count + day.team_sessions_count + day.workflow_sessions_count,
        totalUsers: acc.totalUsers + day.users_count,
        inputTokens: acc.inputTokens + (day.token_metrics?.input_tokens || 0),
        outputTokens: acc.outputTokens + (day.token_metrics?.output_tokens || 0),
        totalTokens: acc.totalTokens + (day.token_metrics?.total_tokens || 0),
        agentRuns: acc.agentRuns + day.agent_runs_count,
        teamRuns: acc.teamRuns + day.team_runs_count,
        workflowRuns: acc.workflowRuns + day.workflow_runs_count,
      }),
      {
        totalRuns: 0,
        totalSessions: 0,
        totalUsers: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        agentRuns: 0,
        teamRuns: 0,
        workflowRuns: 0,
      }
    )
  }, [metrics])

  // Aggregate model metrics across all days
  const aggregatedModelMetrics = useMemo(() => {
    if (!metrics?.metrics?.length) return []

    const modelMap = new Map<string, ModelMetrics>()

    metrics.metrics.forEach((day) => {
      day.model_metrics?.forEach((model) => {
        const key = `${model.model_name}-${model.model_provider}`
        const existing = modelMap.get(key)
        if (existing) {
          modelMap.set(key, {
            ...existing,
            input_tokens: existing.input_tokens + model.input_tokens,
            output_tokens: existing.output_tokens + model.output_tokens,
            total_tokens: existing.total_tokens + model.total_tokens,
            runs_count: existing.runs_count + model.runs_count,
          })
        } else {
          modelMap.set(key, { ...model })
        }
      })
    })

    return Array.from(modelMap.values()).sort((a, b) => b.runs_count - a.runs_count)
  }, [metrics])

  // Chart data for token usage over time
  const tokenChartData = useMemo(() => {
    if (!metrics?.metrics?.length) return []

    return metrics.metrics
      .map((day) => ({
        date: format(new Date(day.date), 'MMM d'),
        input_tokens: day.token_metrics?.input_tokens || 0,
        output_tokens: day.token_metrics?.output_tokens || 0,
      }))
      .reverse()
  }, [metrics])

  // Chart data for runs over time
  const runsChartData = useMemo(() => {
    if (!metrics?.metrics?.length) return []

    return metrics.metrics
      .map((day) => ({
        date: format(new Date(day.date), 'MMM d'),
        agent_runs: day.agent_runs_count,
        team_runs: day.team_runs_count,
      }))
      .reverse()
  }, [metrics])

  const formatNumber = (num: number | undefined | null) => {
    if (num == null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <PageHeader
          title="Metrics"
          description="View aggregated metrics for runs, sessions, and token usage."
          action={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date" className="text-sm">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-sm">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          }
        />

        {isLoading && !metrics ? (
          <LoadingState message="Loading metrics..." />
        ) : !aggregatedMetrics ? (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
            title="No metrics available"
            description="Metrics will appear here once you start running agents."
            action={
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Runs"
                value={formatNumber(aggregatedMetrics.totalRuns)}
                subtitle={`${aggregatedMetrics.agentRuns} agent, ${aggregatedMetrics.teamRuns} team`}
                icon={MessageSquare}
              />
              <MetricCard
                title="Total Sessions"
                value={formatNumber(aggregatedMetrics.totalSessions)}
                icon={Calendar}
              />
              <MetricCard
                title="Total Users"
                value={formatNumber(aggregatedMetrics.totalUsers)}
                icon={Users}
              />
              <MetricCard
                title="Total Tokens"
                value={formatNumber(aggregatedMetrics.totalTokens)}
                subtitle={`${formatNumber(aggregatedMetrics.inputTokens)} in / ${formatNumber(aggregatedMetrics.outputTokens)} out`}
                icon={Zap}
              />
            </div>

            <Tabs defaultValue="tokens" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tokens">Token Usage</TabsTrigger>
                <TabsTrigger value="runs">Runs</TabsTrigger>
                <TabsTrigger value="models">Models</TabsTrigger>
              </TabsList>

              <TabsContent value="tokens" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Usage Over Time</CardTitle>
                    <CardDescription>
                      Daily input and output token consumption
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tokenChartData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={tokenChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="input_tokens" stackId="a" fill="var(--color-input_tokens)" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="output_tokens" stackId="a" fill="var(--color-output_tokens)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available for selected period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="runs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Runs Over Time</CardTitle>
                    <CardDescription>
                      Daily agent and team run counts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {runsChartData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={runsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="agent_runs" stroke="var(--color-agent_runs)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="team_runs" stroke="var(--color-team_runs)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available for selected period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="models" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Model Usage Breakdown</CardTitle>
                    <CardDescription>
                      Token and run counts per model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aggregatedModelMetrics.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead className="text-right">Runs</TableHead>
                            <TableHead className="text-right">Input Tokens</TableHead>
                            <TableHead className="text-right">Output Tokens</TableHead>
                            <TableHead className="text-right">Total Tokens</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aggregatedModelMetrics.map((model) => (
                            <TableRow key={`${model.model_name}-${model.model_provider}`}>
                              <TableCell className="font-medium">{model.model_name}</TableCell>
                              <TableCell>{model.model_provider}</TableCell>
                              <TableCell className="text-right">{formatNumber(model.runs_count)}</TableCell>
                              <TableCell className="text-right">{formatNumber(model.input_tokens)}</TableCell>
                              <TableCell className="text-right">{formatNumber(model.output_tokens)}</TableCell>
                              <TableCell className="text-right">{formatNumber(model.total_tokens)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        No model data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Last Updated */}
            {metrics?.updated_at && (
              <p className="text-xs text-muted-foreground text-center">
                Last updated: {format(new Date(metrics.updated_at), 'MMM d, yyyy HH:mm:ss')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
