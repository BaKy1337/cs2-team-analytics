import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const PerformanceRadar = ({ data, title = "Profil de performance", className = "" }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="text-cs2-gray-light">Aucune donnée disponible</div>
        </div>
      </div>
    );
  }

  // Préparer les données pour le radar chart
  const radarData = [
    {
      subject: 'K/D',
      A: Math.min((data.kd || 0) * 50, 100), // Normaliser sur 100
      fullMark: 100
    },
    {
      subject: 'ADR',
      A: Math.min((data.adr || 0) * 0.8, 100), // Normaliser sur 100
      fullMark: 100
    },
    {
      subject: 'HS%',
      A: data.hs_percent || 0,
      fullMark: 100
    },
    {
      subject: 'KAST',
      A: data.kast || 0,
      fullMark: 100
    },
    {
      subject: 'Rating',
      A: Math.min((data.rating || 0) * 50, 100), // Normaliser sur 100
      fullMark: 100
    },
    {
      subject: 'Win Rate',
      A: data.win_rate || 0,
      fullMark: 100
    }
  ];

  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle">Analyse multidimensionnelle des performances</p>
      </div>
      
      <div className="card-content">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid 
                stroke="#334155" 
                strokeWidth={1}
                fill="rgba(15, 23, 42, 0.1)"
              />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ 
                  fill: '#cbd5e1', 
                  fontSize: 12, 
                  fontWeight: 500 
                }}
                axisLine={{ stroke: '#334155' }}
              />
              <PolarRadiusAxis 
                angle={0} 
                domain={[0, 100]}
                tick={{ 
                  fill: '#64748b', 
                  fontSize: 10 
                }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#ff6b35"
                fill="rgba(255, 107, 53, 0.3)"
                strokeWidth={2}
                fillOpacity={0.6}
                dot={{ 
                  fill: '#ff6b35', 
                  strokeWidth: 2, 
                  r: 4 
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Légende des valeurs */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {radarData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-cs2-gray-light">{item.subject}</span>
              <span className="text-sm font-semibold text-white">
                {item.A.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceRadar;
