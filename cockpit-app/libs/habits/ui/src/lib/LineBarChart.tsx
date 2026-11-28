import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface ChartEntry {
  date: string;
  value: number | null;
  avg: number | null;
}

interface LineBarChartProps {
  data: ChartEntry[];
  targetValue?: number;
  color?: string;
}

export function LineBarChart({ data, targetValue, color = '#3b82f6' }: LineBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="value" fill={color} opacity={0.7} radius={[2, 2, 0, 0]} />
        <Line
          type="monotone"
          dataKey="avg"
          stroke={color}
          dot={false}
          strokeWidth={2}
        />
        {targetValue !== undefined && (
          <ReferenceLine
            y={targetValue}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: `Target: ${targetValue}`, fontSize: 10 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
