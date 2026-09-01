import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TopBadge } from '../../types/index.js';
import { getBadgeColor } from '../../lib/utils.js';

interface BadgeBreakdownChartProps {
  badges: TopBadge[];
}

const BADGE_COLORS = [
  '#00FF41', // matrix green
  '#22d3ee', // cyan
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f43f5e', // rose
  '#6366f1', // indigo
  '#84cc16', // lime
];

export const BadgeBreakdownChart: React.FC<BadgeBreakdownChartProps> = ({ badges }) => {
  return (
    <div className="bg-[#0A0A0A] border border-zinc-800 rounded p-6 flex flex-col justify-between font-mono">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-xs text-[#00FF41] uppercase tracking-wider">
              [USER_PROFILE_BADGES]
            </h3>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-zinc-800">
            DISCORD_FLAGS
          </span>
        </div>

        {badges.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs font-mono text-zinc-600">
            NO_BADGES_COLLECTED_YET
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={badges}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
              >
                <XAxis type="number" stroke="#71717a" fontSize={9} fontFamily="monospace" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={10}
                  fontFamily="monospace"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-[#080808] border border-zinc-800 rounded font-mono text-xs text-zinc-200 shadow-xl">
                          <span className="text-cyan-400 font-bold">{data.name}</span>: {data.count} users
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                  {badges.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BADGE_COLORS[index % BADGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
        {badges.slice(0, 5).map((badge) => {
          return (
            <span
              key={badge.name}
              className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800"
            >
              {badge.name} ({badge.count})
            </span>
          );
        })}
      </div>
    </div>
  );
};

