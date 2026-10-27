import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800">
        <p className="font-semibold text-slate-300">{label}</p>
        <p className="text-emerald-400 font-bold mt-1">
          {Number(payload[0].value).toFixed(2)} kWh
        </p>
      </div>
    );
  }
  return null;
};

const ConsumptionChart = ({ data = [], height = 300, xKey = 'month', yKey = 'consumption' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
        No consumption data recorded for this time range.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            stroke="#94a3b8"
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            stroke="#94a3b8"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke="#059669"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#consumptionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConsumptionChart;
