// app/dashboard/components/DashboardCharts.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface DashboardChartsProps {
  funnelData: { name: string; value: number; fill: string }[];
  radarData: { name: string; value: number }[];
}

export function DashboardCharts({
  funnelData,
  radarData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-8">
      <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Pipeline Commercial
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#E2E8F0"
              />
              <XAxis type="number" stroke="#4A5568" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#4A5568"
                style={{ fontSize: "12px" }}
              />
              <Tooltip cursor={{ fill: "#F7FAFC" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Structure Tarifaire (Coeffs)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis
                dataKey="name"
                stroke="#4A5568"
                style={{ fontSize: "12px" }}
              />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
              <Radar
                name="Valeur Moyenne"
                dataKey="value"
                stroke="#00B4A0"
                fill="#00B4A0"
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
