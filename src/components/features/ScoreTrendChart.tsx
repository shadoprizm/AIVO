import { TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ScoreTrendChartProps {
  scans: Array<{ id: string; overall_score: number; created_at: string }>;
}

interface ChartPoint {
  id: string;
  score: number;
  iso: string;
  date: string;
  fullDate: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#ca8a04';
  return '#dc2626';
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ScoreTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}

function ScoreTooltip({ active, payload }: ScoreTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="text-gray-600 mb-1">{point.fullDate}</p>
      <p className="font-semibold" style={{ color: scoreColor(point.score) }}>
        Score: {point.score}
      </p>
    </div>
  );
}

export default function ScoreTrendChart({ scans }: ScoreTrendChartProps) {
  if (scans.length < 2) return null;

  const data: ChartPoint[] = [...scans]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((scan) => ({
      id: scan.id,
      score: scan.overall_score,
      iso: scan.created_at,
      date: formatShortDate(scan.created_at),
      fullDate: formatFullDate(scan.created_at),
    }));

  const latest = data[data.length - 1].score;
  const previous = data[data.length - 2].score;
  const delta = latest - previous;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;
  const deltaColor =
    delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-medium text-gray-700">
            Score Trend ({data.length} scan{data.length === 1 ? '' : 's'})
          </p>
        </div>
        <p className="text-sm">
          <span className="text-gray-600">Latest: </span>
          <span className="font-semibold" style={{ color: scoreColor(latest) }}>{latest}</span>
          <span className={`ml-2 font-medium ${deltaColor}`}>({deltaLabel} vs previous)</span>
        </p>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickMargin={6}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<ScoreTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
