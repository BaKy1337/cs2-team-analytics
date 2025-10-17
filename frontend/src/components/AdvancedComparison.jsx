import { TrendingUp, Users, Target, Crosshair, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell } from 'recharts';

export default function AdvancedComparison({ myTeam, enemyTeam, comparison }) {
  // Préparer les données pour le graphique comparatif
  const comparisonData = [
    {
      stat: 'Win Rate',
      nous: myTeam.avg_win_rate,
      eux: enemyTeam.avg_win_rate
    },
    {
      stat: 'K/D',
      nous: myTeam.avg_kd * 50,
      eux: enemyTeam.avg_kd * 50
    },
    {
      stat: 'ADR',
      nous: myTeam.avg_adr * 0.8,
      eux: enemyTeam.avg_adr * 0.8
    },
    {
      stat: 'HS%',
      nous: myTeam.avg_hs,
      eux: enemyTeam.avg_hs
    },
    {
      stat: 'Consistency',
      nous: myTeam.avg_consistency,
      eux: enemyTeam.avg_consistency
    }
  ];

  const radarData = [
    { stat: 'Firepower', nous: myTeam.avg_adr * 0.8, eux: enemyTeam.avg_adr * 0.8 },
    { stat: 'Win Rate', nous: myTeam.avg_win_rate, eux: enemyTeam.avg_win_rate },
    { stat: 'Headshots', nous: myTeam.avg_hs, eux: enemyTeam.avg_hs },
    { stat: 'Consistency', nous: myTeam.avg_consistency, eux: enemyTeam.avg_consistency },
    { stat: 'Form', nous: myTeam.team_form.avg_recent_wr, eux: enemyTeam.team_form.avg_recent_wr }
  ];

  const getAdvantage = (our, their) => {
    const diff = our - their;
    if (Math.abs(diff) < 2) return 'neutral';
    return diff > 0 ? 'us' : 'them';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cs2-success via-cs2-orange to-cs2-error bg-clip-text text-transparent">
          Analyse Comparative Détaillée
        </h2>
        <p className="text-gray-400">Matchup complet • Recommandations tactiques • Prédictions</p>
      </div>

      {/* Prédiction globale */}
      <div className="card-cs2 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cs2-orange/10 to-cs2-accent/10" />
        <div className="relative">
          <div className="text-sm text-gray-400 mb-2">PRÉDICTION MATCHUP</div>
          {(() => {
            const ourScore = myTeam.avg_win_rate + myTeam.avg_kd * 10 + myTeam.team_form.avg_recent_wr * 0.5;
            const theirScore = enemyTeam.avg_win_rate + enemyTeam.avg_kd * 10 + enemyTeam.team_form.avg_recent_wr * 0.5;
            const ourWinProb = (ourScore / (ourScore + theirScore)) * 100;
            
            return (
              <div>
                <div className="text-6xl font-bold mb-4">
                  <span className="text-cs2-success">{ourWinProb.toFixed(0)}%</span>
                  <span className="text-gray-600 mx-4">VS</span>
                  <span className="text-cs2-error">{(100 - ourWinProb).toFixed(0)}%</span>
                </div>
                <div className="flex justify-center gap-4">
                  <div className="badge badge-lg bg-cs2-success text-black font-bold">NOUS</div>
                  <div className="badge badge-lg bg-cs2-error text-white font-bold">EUX</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Graphiques comparatifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card-cs2 p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-cs2-orange" />
            Stats Comparées
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="stat" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Legend />
              <Bar dataKey="nous" fill="#06FFA5" name="Notre Équipe" radius={[8, 8, 0, 0]} />
              <Bar dataKey="eux" fill="#EF476F" name="Leurs Équipe" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="card-cs2 p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="text-cs2-orange" />
            Profils Comparés
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="stat" stroke="#9CA3AF" />
              <Radar dataKey="nous" stroke="#06FFA5" fill="#06FFA5" fillOpacity={0.3} name="Nous" />
              <Radar dataKey="eux" stroke="#EF476F" fill="#EF476F" fillOpacity={0.3} name="Eux" />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Matchups Rôle par Rôle */}
      <div className="card-cs2 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="text-cs2-orange" />
          Matchups par Rôle
        </h3>
        <div className="space-y-4">
          {comparison.role_matchups.map((matchup, idx) => {
            const advantage = getAdvantage(parseFloat(matchup.player1.kd), parseFloat(matchup.player2.kd));
            
            return (
              <div key={idx} className="p-4 bg-cs2-dark rounded-lg border border-gray-800 hover:border-cs2-orange transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="badge badge-lg bg-cs2-accent text-white font-bold">
                    {matchup.role}
                  </div>
                  <div className={`badge badge-lg ${
                    advantage === 'us' ? 'badge-success' : 
                    advantage === 'them' ? 'badge-error' : 
                    'badge-ghost'
                  }`}>
                    {advantage === 'us' ? '✓ Avantage Nous' : 
                     advantage === 'them' ? '✗ Avantage Eux' : 
                     '≈ Équilibré'}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="font-bold text-lg text-cs2-success">{matchup.player1.nickname}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {matchup.player1.kd.toFixed(2)} K/D • {matchup.player1.adr.toFixed(0)} ADR
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Crosshair className="mx-auto text-cs2-orange" size={24} />
                    <div className="text-xs text-gray-500 mt-1">VS</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-lg text-cs2-error">{matchup.player2.nickname}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {matchup.player2.kd.toFixed(2)} K/D • {matchup.player2.adr.toFixed(0)} ADR
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommandations Maps */}
      <div className="card-cs2 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="text-cs2-orange" />
          Stratégie Map Pool
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Maps à Pick */}
          <div>
            <div className="text-sm font-bold text-cs2-success mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cs2-success rounded-full animate-pulse" />
              MAPS À PICK
            </div>
            {comparison.map_recommendations
              .filter(m => m.recommendation === 'strong_pick' || m.recommendation === 'pick')
              .map((map, idx) => (
                <div key={idx} className="p-3 bg-cs2-success/10 border border-cs2-success/30 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{map.map}</span>
                    <span className="text-sm text-cs2-success">+{map.diff.toFixed(0)}% avantage</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Nous: {map.our_wr}% | Eux: {map.their_wr}%
                  </div>
                </div>
              ))}
          </div>

          {/* Maps à Ban */}
          <div>
            <div className="text-sm font-bold text-cs2-error mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cs2-error rounded-full animate-pulse" />
              MAPS À BAN
            </div>
            {comparison.map_recommendations
              .filter(m => m.recommendation === 'ban' || m.recommendation === 'avoid')
              .map((map, idx) => (
                <div key={idx} className="p-3 bg-cs2-error/10 border border-cs2-error/30 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{map.map}</span>
                    <span className="text-sm text-cs2-error">{map.diff.toFixed(0)}% désavantage</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Nous: {map.our_wr}% | Eux: {map.their_wr}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recommandations Tactiques */}
      <div className="card-cs2 p-6 border-l-4 border-cs2-accent">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-cs2-accent" />
          Recommandations Tactiques
        </h3>
        <div className="space-y-3">
          {comparison.tactical_recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-cs2-dark/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-cs2-accent flex items-center justify-center flex-shrink-0 text-sm font-bold text-black">
                {idx + 1}
              </div>
              <p className="text-gray-300">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}