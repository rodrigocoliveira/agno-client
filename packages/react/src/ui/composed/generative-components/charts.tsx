import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { ChartComponentSpec, ChartSeries } from '@rodrigocoliveira/agno-types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';

const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function generateChartConfig(series: ChartSeries[] = []): ChartConfig {
  const config: ChartConfig = {};
  series.forEach((item, index) => {
    config[item.key] = {
      label: item.label || item.key,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
  });
  return config;
}

function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-[350px] border rounded-md bg-muted/10">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export type ChartProps = ChartComponentSpec['props'];

export function BarChart(props: ChartProps) {
  const { data, xKey, bars = [], showLegend = true, showGrid = true, height = 350 } = props;
  if (!data || data.length === 0) return <EmptyState />;
  const config = generateChartConfig(bars);
  return (
    <ChartContainer config={config} className="h-[350px]">
      <RechartsBarChart data={data} height={height as number}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xKey} />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color || `var(--color-${bar.key})`}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}

export function LineChart(props: ChartProps) {
  const { data, xKey, lines = [], showLegend = true, showGrid = true, height = 350 } = props;
  if (!data || data.length === 0) return <EmptyState />;
  const config = generateChartConfig(lines);
  return (
    <ChartContainer config={config} className="h-[350px]">
      <RechartsLineChart data={data} height={height as number}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xKey} />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color || `var(--color-${line.key})`}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}

export function AreaChart(props: ChartProps) {
  const { data, xKey, areas = [], showLegend = true, showGrid = true, height = 350 } = props;
  if (!data || data.length === 0) return <EmptyState />;
  const config = generateChartConfig(areas);
  return (
    <ChartContainer config={config} className="h-[350px]">
      <RechartsAreaChart data={data} height={height as number}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xKey} />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            stroke={area.color || `var(--color-${area.key})`}
            fill={area.color || `var(--color-${area.key})`}
            fillOpacity={0.6}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
}

export function PieChart(props: ChartProps) {
  const { data, pie, showLegend = true, height = 350 } = props;
  if (!data || data.length === 0 || !pie) return <EmptyState />;
  const nameKey = pie.nameKey || 'name';
  const config = generateChartConfig(
    data.map((item: any) => ({
      key: item[nameKey],
      label: item[nameKey],
    }))
  );
  return (
    <ChartContainer config={config} className="h-[350px]">
      <RechartsPieChart height={height as number}>
        <Pie
          data={data}
          dataKey={pie.dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={pie.label}
        >
          {data.map((_entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
      </RechartsPieChart>
    </ChartContainer>
  );
}
