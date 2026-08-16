'use client'

import { useTheme } from 'next-themes'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

type ChartType = 'bar' | 'line' | 'pie'

interface ChartWidgetProps {
  type: ChartType
  data: Record<string, any>[]
  title?: string
  xKey?: string
  yKey?: string
  dataKey?: string
  nameKey?: string
  colors?: string[]
  height?: number
  className?: string
}

const defaultColors = ['#003865', '#F7A81B', '#D91B5C', '#0057B8', '#F25F8B', '#A01446']

export function ChartWidget({
  type,
  data,
  title,
  xKey = 'name',
  yKey = 'value',
  dataKey = 'value',
  nameKey = 'name',
  colors = defaultColors,
  height = 300,
  className,
}: ChartWidgetProps) {
  return (
    <div className={cn('rounded-2xl border bg-white p-5 shadow-sm', className)}>
      {title && <h3 className="mb-4 text-base font-semibold text-navy">{title}</h3>}

      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], r: 4 }}
            />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey={dataKey}
              nameKey={nameKey}
              label={(entry: any) => `${entry.name} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
