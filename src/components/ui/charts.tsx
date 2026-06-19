"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const BRAND = "#1e5b46";
const AMBER = "#b47c3e";
const INK_4 = "#7a817d";

const axisStyle = { fontSize: 11, fill: INK_4, fontFamily: "var(--font-sans)" };

type TrendAreaProps = {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  showAxes?: boolean;
  forecastAfter?: string;
  color?: string;
};

export function TrendArea({
  data,
  xKey,
  yKey,
  height = 180,
  showAxes = true,
  forecastAfter,
  color = BRAND,
}: TrendAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxes && (
          <>
            <CartesianGrid strokeDasharray="2 4" stroke="#e4e2d9" vertical={false} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
            <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={40} />
          </>
        )}
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#c9c5b8", strokeDasharray: "2 2" }} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill="url(#areaFill)"
          isAnimationActive
          animationDuration={800}
        />
        {forecastAfter && (
          <ReferenceLine
            x={forecastAfter}
            stroke="#c9c5b8"
            strokeDasharray="3 3"
            label={{ value: "forecast →", position: "insideTopRight", fontSize: 10, fill: INK_4 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({
  data,
  xKey,
  yKey,
  height = 120,
  color = BRAND,
  secondaryKey,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  secondaryKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#e4e2d9" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={36} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive
        />
        {secondaryKey && (
          <Line
            type="monotone"
            dataKey={secondaryKey}
            stroke={AMBER}
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBar({
  data,
  xKey,
  yKey,
  height = 140,
  color = BRAND,
  highlight,
  highlightColor = AMBER,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  highlight?: string;
  highlightColor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#e4e2d9" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={36} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(15,21,17,0.04)" }} />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={500}>
          {data.map((entry, i) => {
            const key = entry[xKey] as string;
            const isHighlight = highlight && key === highlight;
            return <Cell key={i} fill={isHighlight ? highlightColor : color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  backgroundColor: "#0f1511",
  color: "#fafaf7",
  border: "none",
  borderRadius: 8,
  fontSize: 12,
  padding: "8px 12px",
  fontFamily: "var(--font-sans)",
};

// Mini sparkline for KPI tiles
export function Spark({
  data,
  dataKey,
  color = BRAND,
  height = 36,
}: {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${dataKey})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
