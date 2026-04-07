'use client';

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

  const width = 320;
  const height = 140;
  const paddingTop = 20;
  const paddingBottom = 24;
  const paddingLeft = 40;
  const paddingRight = 16;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Add 10% padding to Y axis
  const yMin = minVal - range * 0.1;
  const yMax = maxVal + range * 0.1;
  const yRange = yMax - yMin;

  const getX = (i: number) =>
    paddingLeft + (i / (data.length - 1)) * chartW;

  const getY = (val: number) =>
    paddingTop + chartH - ((val - yMin) / yRange) * chartH;

  // Build polyline path
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Build gradient fill path
  const fillPath = [
    `M ${getX(0)},${getY(data[0].value)}`,
    ...data.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.value)}`),
    `L ${getX(data.length - 1)},${paddingTop + chartH}`,
    `L ${getX(0)},${paddingTop + chartH}`,
    'Z',
  ].join(' ');

  // Y axis labels (3 ticks)
  const yTicks = [yMin, yMin + yRange / 2, yMax].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`grad-${accentColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={paddingLeft}
            y1={getY(tick)}
            x2={width - paddingRight}
            y2={getY(tick)}
            stroke="#E5E7EB"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          <text
            x={paddingLeft - 6}
            y={getY(tick) + 4}
            textAnchor="end"
            className="fill-gray-400"
            fontSize={10}
          >
            {tick}
          </text>
        </g>
      ))}

      {/* Unit label */}
      <text
        x={paddingLeft - 6}
        y={paddingTop - 6}
        textAnchor="end"
        className="fill-gray-400"
        fontSize={9}
      >
        {unit}
      </text>

      {/* Filled area */}
      <path d={fillPath} fill={`url(#grad-${accentColor.replace('#', '')})`} />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={getX(i)}
          cy={getY(d.value)}
          r={3.5}
          fill="white"
          stroke={accentColor}
          strokeWidth={2}
        />
      ))}

      {/* X axis labels (first, middle, last) */}
      {data.length >= 3
        ? [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 4}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={9}
            >
              {data[i].label}
            </text>
          ))
        : data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 4}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={9}
            >
              {d.label}
            </text>
          ))}
    </svg>
  );
}
