'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
}

interface WeightChartProps {
  data: DataPoint[];
  accentColor: string;
  unit?: string;
}

export function WeightChart({ data, accentColor, unit = 'kg' }: WeightChartProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const yMin = Math.floor(minVal - range * 0.15);
  const yMax = Math.ceil(maxVal + range * 0.15);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={`gradient-${accentColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          unit={` ${unit}`}
          width={55}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: 13,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value} ${unit}`, 'Best Weight']}
          labelStyle={{ color: '#6B7280', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={accentColor}
          strokeWidth={2.5}
          fill={`url(#gradient-${accentColor.replace('#', '')})`}
          dot={{ r: 4, fill: '#fff', stroke: accentColor, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: accentColor, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
