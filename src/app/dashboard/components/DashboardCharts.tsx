"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from "recharts";

interface Props {
  funnelData:    { name: string; value: number; fill: string }[];
  radarData:     { name: string; value: number }[];
  statutsData:   { statut: string; count: number }[];
  typeClientData: { type: string; count: number }[];
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye:    "Envoyé",
  accepte:   "Accepté",
  refuse:    "Refusé",
};
const STATUT_COLORS: Record<string, string> = {
  brouillon: "#a8a8ba",
  envoye:    "#8d6ee8",
  accepte:   "#c8db1a",
  refuse:    "#e11d48",
};

const tooltipStyle = {
  contentStyle: {
    fontFamily: "Inter, sans-serif",
    fontSize: "13px",
    borderRadius: "10px",
    border: "1px solid #e6e6ee",
    boxShadow: "0 8px 20px -8px rgba(30,30,50,.18)",
  },
  labelStyle: { fontWeight: 600, color: "#1e1e32" },
};

const axisStyle = { fontFamily: "Inter, sans-serif", fontSize: "12px" };

export function DashboardCharts({ funnelData, radarData, statutsData, typeClientData }: Props) {
  const maxStatut = Math.max(...statutsData.map(s => s.count), 1);

  return (
    <div className="space-y-5">

      {/* ── Ligne 1 : Pipeline (2/3) + Type de client (1/3) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Pipeline funnel */}
        <div
          className="lg:col-span-2 bg-white p-6"
          style={{ border: "1px solid #e6e6ee", borderRadius: "22px", boxShadow: "0 18px 40px -18px rgba(30,30,50,.12)" }}
        >
          <p className="text-xs font-semibold uppercase" style={{ color: "#6e6e82", fontFamily: "Inter, sans-serif", letterSpacing: "0.14em" }}>
            Pipeline commercial
          </p>
          <p className="font-bold mt-0.5 mb-5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#1e1e32" }}>
            Funnel de conversion
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6e6ee" />
                <XAxis type="number" stroke="#a8a8ba" tick={axisStyle} />
                <YAxis dataKey="name" type="category" stroke="#a8a8ba" tick={axisStyle} width={75} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32} name="Nb dossiers">
                  {funnelData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Type de client */}
        <div
          className="bg-white p-6"
          style={{ border: "1px solid #e6e6ee", borderRadius: "22px", boxShadow: "0 18px 40px -18px rgba(30,30,50,.12)" }}
        >
          <p className="text-xs font-semibold uppercase" style={{ color: "#6e6e82", fontFamily: "Inter, sans-serif", letterSpacing: "0.14em" }}>
            Typologies clients
          </p>
          <p className="font-bold mt-0.5 mb-5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#1e1e32" }}>
            Par type de client
          </p>
          {typeClientData.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "#a8a8ba", fontFamily: "Inter, sans-serif" }}>Aucune donnée</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeClientData} layout="vertical" margin={{ top: 0, right: 10, left: 55, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6e6ee" />
                  <XAxis type="number" stroke="#a8a8ba" tick={{ ...axisStyle, fontSize: "11px" }} />
                  <YAxis dataKey="type" type="category" stroke="#a8a8ba" tick={{ ...axisStyle, fontSize: "11px" }} width={50} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#5a2bd9" radius={[0, 6, 6, 0]} barSize={22} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Ligne 2 : Statuts (1/2) + Coefficients radar (1/2) ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Statuts */}
        <div
          className="bg-white p-6"
          style={{ border: "1px solid #e6e6ee", borderRadius: "22px", boxShadow: "0 18px 40px -18px rgba(30,30,50,.12)" }}
        >
          <p className="text-xs font-semibold uppercase" style={{ color: "#6e6e82", fontFamily: "Inter, sans-serif", letterSpacing: "0.14em" }}>
            État des devis
          </p>
          <p className="font-bold mt-0.5 mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#1e1e32" }}>
            Répartition par statut
          </p>
          <div className="space-y-4">
            {statutsData.map(({ statut, count }) => (
              <div key={statut}>
                <div className="flex justify-between mb-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
                  <span style={{ color: "#36364f", fontWeight: 500 }}>{STATUT_LABELS[statut] || statut}</span>
                  <span style={{ color: "#6e6e82" }}>{count}</span>
                </div>
                <div className="w-full h-2" style={{ background: "#f8f8fc", borderRadius: "999px" }}>
                  <div
                    style={{
                      height: "8px",
                      width: `${Math.min(100, (count / maxStatut) * 100)}%`,
                      background: STATUT_COLORS[statut] || "#5a2bd9",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coefficients radar */}
        <div
          className="bg-white p-6"
          style={{ border: "1px solid #e6e6ee", borderRadius: "22px", boxShadow: "0 18px 40px -18px rgba(30,30,50,.12)" }}
        >
          <p className="text-xs font-semibold uppercase" style={{ color: "#6e6e82", fontFamily: "Inter, sans-serif", letterSpacing: "0.14em" }}>
            Moteur tarifaire
          </p>
          <p className="font-bold mt-0.5 mb-5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#1e1e32" }}>
            Coefficients moyens
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" data={radarData}>
                <PolarGrid stroke="#e6e6ee" />
                <PolarAngleAxis dataKey="name" stroke="#6e6e82" tick={axisStyle} />
                <PolarRadiusAxis angle={30} domain={[0, "auto"]} stroke="#a8a8ba" tick={{ fontSize: 10 }} />
                <Radar name="Coeff moyen" dataKey="value" stroke="#5a2bd9" fill="#5a2bd9" fillOpacity={0.25} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: "#a8a8ba", fontFamily: "Inter, sans-serif" }}>
            Moyenne des multiplicateurs appliqués sur l'ensemble des devis
          </p>
        </div>
      </div>
    </div>
  );
}
