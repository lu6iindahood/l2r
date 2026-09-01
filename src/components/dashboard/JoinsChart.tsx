import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DailyJoin } from '../../types/index.js';

interface JoinsChartProps {
  data: DailyJoin[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="p-3 bg-[#080808] border border-zinc-800 rounded font-mono text-xs space-y-1.5 shadow-2xl">
        <div className="text-zinc-300 font-bold border-b border-zinc-800 pb-1 flex items-center justify-between gap-4">
          <span>DATE: {dataPoint.date}</span>
          <span className="text-[#00FF41] font-semibold">{dataPoint.joins} Total</span>
        </div>
        <div className="flex items-center justify-between text-[#00FF41] gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]"></span>
            HUMANS:
          </span>
          <span className="font-semibold">{dataPoint.humans}</span>
        </div>
        <div className="flex items-center justify-between text-cyan-400 gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            BOTS:
          </span>
          <span className="font-semibold">{dataPoint.bots}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const JoinsChart: React.FC<JoinsChartProps> = ({ data }) => {
  const total14Days = data.reduce((acc, item) => acc + item.joins, 0);

  return (
    <div className="bg-[#0A0A0A] border border-zinc-800 rounded p-6 flex flex-col font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[#00FF41] tracking-wider uppercase">
              [NETWORK_ACTIVITY_14D]
            </h2>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            CHRONOLOGICAL INGRESS FREQUENCY GROUPED BY SQLITE UNIXEPOCH
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-[#00FF41] rounded-full"></div>
              <div className="w-2 h-2 bg-zinc-800 rounded-full"></div>
            </div>
            <span>VOLUME: <strong className="text-[#00FF41]">{total14Days}</strong></span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="joinsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00FF41" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="botsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#71717a"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }}
            />

            <Area
              type="monotone"
              dataKey="joins"
              name="Total Ingress"
              stroke="#00FF41"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#joinsGradient)"
              activeDot={{ r: 4, fill: '#00FF41', stroke: '#050505', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="bots"
              name="Detected Bots"
              stroke="#22d3ee"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#botsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

