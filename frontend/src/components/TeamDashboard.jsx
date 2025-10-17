import { Trophy, Target, TrendingUp, Award, Flame, Snowflake, Shield } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const ROLES_CONFIG = {
  'AWPer': { color: '#FF6B35', icon: '🎯' },
  'Entry Fragger': { color: '#EF476F', icon: '⚡' },
  'Support': { color: '#06FFA5', icon: '🛡️' },
  'Clutcher': { color: '#FFD23F', icon: '👑' },
  'Rifler': { color: '#1A659E', icon: '🎮' }
};

export default function TeamDashboard({ team, isOurTeam }) {
  const radarData = [
    { stat: 'K/D', value: Math.min(team.avg_kd * 50, 100) },
    { stat: 'ADR', value: Math.min((team.avg_adr / 100) * 100, 100) },
    { stat: 'HS%', value: team.avg_hs },
    { stat: 'WR%', value: team.avg_win_rate },
    { stat: 'Consistency', value: team.avg_consistency }
  ];

  const recentRadarData = team.recent_stats ? [
    { stat: 'K/D', value: Math.min(team.recent_stats.avg_recent_kd * 50, 100) },
    { stat: 'ADR', value: Math.min((team.recent_stats.avg_recent_adr / 100) * 100, 100) },
    { stat: 'HS%', value: team.recent_stats.avg_recent_hs },
    { stat: 'WR%', value: team.recent_stats.avg_recent_win_rate },
    { stat: 'Matches', value: Math.min((team.recent_stats.total_recent_matches / 150) * 100, 100) }
  ] : [];

  const getFormIndicator = (form) => {
    if (form.trend === 'hot') return { icon: Flame, color: 'text-cs2-error', bg: 'bg-cs2-error/20', label: 'EN FEU' };
    if (form.trend === 'cold') return { icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'FROID' };
    return { icon: TrendingUp, color: 'text-gray-400', bg: 'bg-gray-400/20', label: 'STABLE' };
  };

  const teamColor = isOurTeam ? 'cs2-success' : 'cs2-error';

  return (
    <div className="mt-6 space-y-6 animate-slide-up">
      {/* En-tête avec Elo et Skill */}
      <div className="card-cs2 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-${teamColor} to-${teamColor}/50 flex items-center justify-center`}>
              <Trophy className={`text-white`} size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{team.avg_elo} ELO</div>
              <div className="text-sm text-gray-400">Level {team.avg_skill_level} moyen</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Forme Équipe</div>
            <div className="flex items-center gap-2 mt-1">
              <Flame className={team.team_form.hot_players >= 3 ? 'text-cs2-error' : 'text-gray-600'} size={16} />
              <span className="font-bold">{team.team_form.hot_players}</span>
              <span className="text-gray-400">hot</span>
              <span className="mx-2">|</span>
              <Snowflake className={team.team_form.cold_players >= 2 ? 'text-blue-400' : 'text-gray-600'} size={16} />
              <span className="font-bold">{team.team_form.cold_players}</span>
              <span className="text-gray-400">cold</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
            <div className={`text-2xl font-bold text-${teamColor}`}>{team.avg_win_rate.toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-gray-400 mb-1">K/D Ratio</div>
            <div className="text-2xl font-bold text-cs2-accent">{team.avg_kd.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-gray-400 mb-1">ADR</div>
            <div className="text-2xl font-bold text-cs2-warning">{team.avg_adr.toFixed(0)}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-gray-400 mb-1">HS%</div>
            <div className="text-2xl font-bold text-purple-400">{team.avg_hs.toFixed(0)}%</div>
          </div>
        </div>

        {/* Stats Récentes (30 derniers jours) */}
        {team.recent_stats && team.recent_stats.total_recent_matches > 0 && (
          <div className="mt-6 p-4 bg-cs2-dark/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-cs2-blue" size={16} />
              <span className="text-sm font-bold text-cs2-blue">Forme Récente (30 derniers jours)</span>
              <span className="text-xs text-gray-400">({team.recent_stats.total_recent_matches} matchs)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="text-xs text-gray-400 mb-1">Win Rate Récent</div>
                <div className={`text-lg font-bold ${team.recent_stats.avg_recent_win_rate > team.avg_win_rate ? 'text-cs2-success' : team.recent_stats.avg_recent_win_rate < team.avg_win_rate ? 'text-cs2-error' : 'text-gray-400'}`}>
                  {team.recent_stats.avg_recent_win_rate.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">
                  {team.recent_stats.avg_recent_win_rate > team.avg_win_rate ? '↗' : team.recent_stats.avg_recent_win_rate < team.avg_win_rate ? '↘' : '→'} 
                  {Math.abs(team.recent_stats.avg_recent_win_rate - team.avg_win_rate).toFixed(1)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-gray-400 mb-1">K/D Récent</div>
                <div className={`text-lg font-bold ${team.recent_stats.avg_recent_kd > team.avg_kd ? 'text-cs2-success' : team.recent_stats.avg_recent_kd < team.avg_kd ? 'text-cs2-error' : 'text-gray-400'}`}>
                  {team.recent_stats.avg_recent_kd.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {team.recent_stats.avg_recent_kd > team.avg_kd ? '↗' : team.recent_stats.avg_recent_kd < team.avg_kd ? '↘' : '→'} 
                  {Math.abs(team.recent_stats.avg_recent_kd - team.avg_kd).toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-gray-400 mb-1">ADR Récent</div>
                <div className={`text-lg font-bold ${team.recent_stats.avg_recent_adr > team.avg_adr ? 'text-cs2-success' : team.recent_stats.avg_recent_adr < team.avg_adr ? 'text-cs2-error' : 'text-gray-400'}`}>
                  {team.recent_stats.avg_recent_adr.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  {team.recent_stats.avg_recent_adr > team.avg_adr ? '↗' : team.recent_stats.avg_recent_adr < team.avg_adr ? '↘' : '→'} 
                  {Math.abs(team.recent_stats.avg_recent_adr - team.avg_adr).toFixed(0)}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-gray-400 mb-1">Forme Récente</div>
                <div className="flex items-center gap-2">
                  <Flame className={team.recent_stats.hot_players_recent >= 3 ? 'text-cs2-error' : 'text-gray-600'} size={14} />
                  <span className="text-sm font-bold text-cs2-error">{team.recent_stats.hot_players_recent}</span>
                  <Snowflake className={team.recent_stats.cold_players_recent >= 2 ? 'text-blue-400' : 'text-gray-600'} size={14} />
                  <span className="text-sm font-bold text-blue-400">{team.recent_stats.cold_players_recent}</span>
                </div>
                <div className="text-xs text-gray-500">hot/cold</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Radar Chart */}
      <div className="card-cs2 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="text-cs2-orange" />
          Profil de l'Équipe (Lifetime)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="stat" stroke="#9CA3AF" />
            <Radar 
              dataKey="value" 
              stroke={isOurTeam ? '#06FFA5' : '#EF476F'} 
              fill={isOurTeam ? '#06FFA5' : '#EF476F'} 
              fillOpacity={0.3} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart Récent */}
      {team.recent_stats && team.recent_stats.total_recent_matches > 0 && (
        <div className="card-cs2 p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-cs2-blue" />
            Profil Récent (30 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={recentRadarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="stat" stroke="#9CA3AF" />
              <Radar 
                dataKey="value" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Joueurs */}
      <div className="card-cs2 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="text-cs2-orange" />
          Composition
        </h3>
        <div className="space-y-3">
          {team.players.map((player, idx) => {
            const formInfo = getFormIndicator(player.recent_form);
            const FormIcon = formInfo.icon;

            return (
              <div key={idx} className="group hover:bg-cs2-dark/50 p-4 rounded-lg transition-all duration-300 border border-gray-800 hover:border-cs2-orange">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={player.avatar} 
                      alt={player.nickname} 
                      className="w-12 h-12 rounded-full ring-2 ring-cs2-orange/50" 
                    />
                    <div>
                      <div className="font-bold text-lg">{player.nickname}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">{player.country}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-cs2-accent">Level {player.skill_level}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}
                         style={{ backgroundColor: ROLES_CONFIG[player.role].color + '30', color: ROLES_CONFIG[player.role].color }}>
                      <span>{ROLES_CONFIG[player.role].icon}</span>
                      {player.role}
                    </div>
                    <div className={`${formInfo.bg} ${formInfo.color} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                      <FormIcon size={14} />
                      {formInfo.label}
                    </div>
                  </div>
                </div>

                {/* Stats du joueur */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-400">WR</div>
                    <div className="font-bold text-sm">{player.stats.win_rate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">K/D</div>
                    <div className="font-bold text-sm">{player.stats.kd.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">ADR</div>
                    <div className="font-bold text-sm">{player.stats.adr.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">HS%</div>
                    <div className="font-bold text-sm">{player.stats.hs_percent}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Entry</div>
                    <div className="font-bold text-sm">{(player.stats.entry_rate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Clutch</div>
                    <div className="font-bold text-sm">{(player.stats.clutch_rate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Streak</div>
                    <div className={`font-bold text-sm ${player.recent_form.streak > 0 ? 'text-cs2-success' : 'text-cs2-error'}`}>
                      {player.recent_form.streak > 0 ? '+' : ''}{player.recent_form.streak}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Consistency</div>
                    <div className="font-bold text-sm">{player.consistency}%</div>
                  </div>
                </div>

                {/* Stats récentes du joueur */}
                {player.recent_stats && player.recent_stats.recent_matches > 0 && (
                  <div className="mt-3 p-3 bg-cs2-dark/30 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-cs2-blue" size={12} />
                      <span className="text-xs font-bold text-cs2-blue">Forme Récente ({player.recent_stats.recent_matches} matchs)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-xs text-gray-400">WR</div>
                        <div className={`font-bold text-xs ${player.recent_stats.recent_win_rate > player.stats.win_rate ? 'text-cs2-success' : player.recent_stats.recent_win_rate < player.stats.win_rate ? 'text-cs2-error' : 'text-gray-400'}`}>
                          {player.recent_stats.recent_win_rate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">K/D</div>
                        <div className={`font-bold text-xs ${player.recent_stats.recent_kd > player.stats.kd ? 'text-cs2-success' : player.recent_stats.recent_kd < player.stats.kd ? 'text-cs2-error' : 'text-gray-400'}`}>
                          {player.recent_stats.recent_kd.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">ADR</div>
                        <div className={`font-bold text-xs ${player.recent_stats.recent_adr > player.stats.adr ? 'text-cs2-success' : player.recent_stats.recent_adr < player.stats.adr ? 'text-cs2-error' : 'text-gray-400'}`}>
                          {player.recent_stats.recent_adr}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Forme</div>
                        <div className={`font-bold text-xs ${player.recent_stats.recent_form_trend === 'hot' ? 'text-cs2-error' : player.recent_stats.recent_form_trend === 'cold' ? 'text-blue-400' : 'text-gray-400'}`}>
                          {player.recent_stats.recent_form_trend === 'hot' ? '🔥' : player.recent_stats.recent_form_trend === 'cold' ? '❄️' : '➡️'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Map Pool */}
      <div className="card-cs2 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="text-cs2-orange" />
          Map Pool Performance
        </h3>
        <div className="space-y-3">
          {team.map_strengths.map((map, idx) => {
            const isStrong = map.avg_win_rate > 55;
            const isWeak = map.avg_win_rate < 45;
            
            return (
              <div key={map.map} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${isStrong ? 'bg-cs2-success text-black' : isWeak ? 'bg-cs2-error text-white' : 'bg-gray-700 text-white'}`}>
                      {idx + 1}
                    </div>
                    <span className="font-bold text-lg">{map.map}</span>
                    <span className={`badge badge-sm ${map.confidence === 'high' ? 'badge-success' : map.confidence === 'medium' ? 'badge-warning' : 'badge-ghost'}`}>
                      {map.matches} matchs
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isStrong ? 'text-cs2-success' : isWeak ? 'text-cs2-error' : 'text-gray-400'}`}>
                      {map.avg_win_rate}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {map.avg_kd} K/D • {map.avg_adr} ADR
                    </div>
                  </div>
                </div>
                <div className="relative h-3 bg-cs2-dark rounded-full overflow-hidden">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      isStrong ? 'bg-gradient-to-r from-cs2-success to-cs2-accent' : 
                      isWeak ? 'bg-gradient-to-r from-cs2-error to-cs2-warning' : 
                      'bg-gradient-to-r from-gray-600 to-gray-500'
                    }`}
                    style={{ width: `${map.avg_win_rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Analyse Détaillée */}
      <div className="space-y-6">
        {/* Résumé de l'analyse */}
        {team.analysis.summary && (
          <div className="card-cs2 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="text-cs2-orange" />
              Résumé de l'Analyse
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-cs2-success/20 rounded-lg">
                <div className="text-2xl font-bold text-cs2-success">{team.analysis.summary.total_strengths}</div>
                <div className="text-sm text-gray-400">Forces</div>
              </div>
              <div className="text-center p-3 bg-cs2-error/20 rounded-lg">
                <div className="text-2xl font-bold text-cs2-error">{team.analysis.summary.total_weaknesses}</div>
                <div className="text-sm text-gray-400">Faiblesses</div>
              </div>
              <div className="text-center p-3 bg-cs2-accent/20 rounded-lg">
                <div className="text-2xl font-bold text-cs2-accent">{team.analysis.summary.high_impact_strengths}</div>
                <div className="text-sm text-gray-400">Forces Majeures</div>
              </div>
              <div className="text-center p-3 bg-cs2-warning/20 rounded-lg">
                <div className="text-2xl font-bold text-cs2-warning">{team.analysis.summary.high_impact_weaknesses}</div>
                <div className="text-sm text-gray-400">Faiblesses Majeures</div>
              </div>
            </div>
          </div>
        )}

        {/* Forces Détaillées */}
        <div className="card-cs2 p-6 border-l-4 border-cs2-success">
          <h3 className="text-lg font-bold mb-4 text-cs2-success flex items-center gap-2">
            <TrendingUp size={20} />
            Forces ({team.analysis.strengths?.length || 0})
          </h3>
          {team.analysis.strengths && team.analysis.strengths.length > 0 ? (
            <div className="space-y-3">
              {team.analysis.strengths.map((strength, idx) => (
                <div key={idx} className="p-3 bg-cs2-dark/50 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        strength.impact === 'high' ? 'bg-cs2-success text-black' : 'bg-cs2-accent text-white'
                      }`}>
                        {strength.impact === 'high' ? 'MAJEUR' : 'MOYEN'}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {strength.category}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-cs2-success">{strength.value}</span>
                  </div>
                  <h4 className="font-bold text-cs2-success mb-1">{strength.title}</h4>
                  <p className="text-sm text-gray-300">{strength.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune force identifiée</p>
          )}
        </div>

        {/* Faiblesses Détaillées */}
        <div className="card-cs2 p-6 border-l-4 border-cs2-error">
          <h3 className="text-lg font-bold mb-4 text-cs2-error flex items-center gap-2">
            <Target size={20} />
            Faiblesses ({team.analysis.weaknesses?.length || 0})
          </h3>
          {team.analysis.weaknesses && team.analysis.weaknesses.length > 0 ? (
            <div className="space-y-3">
              {team.analysis.weaknesses.map((weakness, idx) => (
                <div key={idx} className="p-3 bg-cs2-dark/50 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        weakness.impact === 'high' ? 'bg-cs2-error text-white' : 'bg-cs2-warning text-black'
                      }`}>
                        {weakness.impact === 'high' ? 'MAJEUR' : 'MOYEN'}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {weakness.category}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-cs2-error">{weakness.value}</span>
                  </div>
                  <h4 className="font-bold text-cs2-error mb-1">{weakness.title}</h4>
                  <p className="text-sm text-gray-300">{weakness.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune faiblesse identifiée</p>
          )}
        </div>

        {/* Insights */}
        {team.analysis.insights && team.analysis.insights.length > 0 && (
          <div className="card-cs2 p-6 border-l-4 border-cs2-blue">
            <h3 className="text-lg font-bold mb-4 text-cs2-blue flex items-center gap-2">
              <Award size={20} />
              Insights ({team.analysis.insights.length})
            </h3>
            <div className="space-y-3">
              {team.analysis.insights.map((insight, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${
                  insight.type === 'positive' 
                    ? 'bg-cs2-success/20 border-cs2-success' 
                    : 'bg-cs2-error/20 border-cs2-error'
                }`}>
                  <h4 className={`font-bold mb-1 ${
                    insight.type === 'positive' ? 'text-cs2-success' : 'text-cs2-error'
                  }`}>
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-300">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {team.analysis.recommendations && team.analysis.recommendations.length > 0 && (
          <div className="card-cs2 p-6 border-l-4 border-cs2-warning">
            <h3 className="text-lg font-bold mb-4 text-cs2-warning flex items-center gap-2">
              <Target size={20} />
              Recommandations ({team.analysis.recommendations.length})
            </h3>
            <div className="space-y-3">
              {team.analysis.recommendations.map((rec, idx) => {
                const getTypeColor = (type) => {
                  switch (type) {
                    case 'tactical': return 'bg-cs2-blue text-white';
                    case 'mental': return 'bg-purple-600 text-white';
                    case 'training': return 'bg-cs2-orange text-white';
                    case 'composition': return 'bg-red-600 text-white';
                    case 'performance': return 'bg-yellow-600 text-black';
                    case 'cohesion': return 'bg-indigo-600 text-white';
                    case 'momentum': return 'bg-pink-600 text-white';
                    case 'strategy': return 'bg-teal-600 text-white';
                    case 'preparation': return 'bg-amber-600 text-black';
                    case 'map_strategy': return 'bg-cyan-600 text-white';
                    default: return 'bg-gray-600 text-white';
                  }
                };

                const getTypeLabel = (type) => {
                  switch (type) {
                    case 'tactical': return 'TACTIQUE';
                    case 'mental': return 'MENTAL';
                    case 'training': return 'ENTRAÎNEMENT';
                    case 'composition': return 'COMPOSITION';
                    case 'performance': return 'PERFORMANCE';
                    case 'cohesion': return 'COHÉSION';
                    case 'momentum': return 'MOMENTUM';
                    case 'strategy': return 'STRATÉGIE';
                    case 'preparation': return 'PRÉPARATION';
                    case 'map_strategy': return 'MAP STRATÉGIE';
                    default: return 'GÉNÉRAL';
                  }
                };

                const getPriorityColor = (priority) => {
                  switch (priority) {
                    case 'high': return 'bg-cs2-error text-white';
                    case 'medium': return 'bg-cs2-warning text-black';
                    case 'low': return 'bg-gray-600 text-white';
                    default: return 'bg-gray-600 text-white';
                  }
                };

                const getPriorityLabel = (priority) => {
                  switch (priority) {
                    case 'high': return 'PRIORITÉ HAUTE';
                    case 'medium': return 'PRIORITÉ MOYENNE';
                    case 'low': return 'PRIORITÉ BASSE';
                    default: return 'PRIORITÉ';
                  }
                };

                return (
                  <div key={idx} className={`p-4 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-cs2-error/10 border-cs2-error' :
                    rec.priority === 'medium' ? 'bg-cs2-warning/10 border-cs2-warning' :
                    'bg-gray-600/10 border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${getTypeColor(rec.type)}`}>
                          {getTypeLabel(rec.type)}
                        </span>
                        {rec.priority && (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(rec.priority)}`}>
                            {getPriorityLabel(rec.priority)}
                          </span>
                        )}
                        {rec.impact && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            rec.impact === 'high' ? 'bg-cs2-success text-black' :
                            rec.impact === 'medium' ? 'bg-cs2-accent text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {rec.impact === 'high' ? 'IMPACT ÉLEVÉ' :
                             rec.impact === 'medium' ? 'IMPACT MOYEN' : 'IMPACT FAIBLE'}
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className={`font-bold mb-2 ${
                      rec.priority === 'high' ? 'text-cs2-error' :
                      rec.priority === 'medium' ? 'text-cs2-warning' : 'text-gray-400'
                    }`}>
                      {rec.title}
                    </h4>
                    <p className="text-sm text-gray-300">{rec.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analyse Étendue (1-2 mois) */}
        {team.extended_analysis && team.extended_analysis.total_matches > 0 && (
          <div className="space-y-6">
            {/* Résumé de l'analyse étendue */}
            <div className="card-cs2 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-cs2-blue" />
                Analyse Étendue (1-2 mois)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-cs2-blue/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-blue">{team.extended_analysis.total_matches}</div>
                  <div className="text-sm text-gray-400">Matchs Analysés</div>
                </div>
                <div className="text-center p-3 bg-cs2-accent/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-accent">{team.extended_analysis.overall_win_rate}%</div>
                  <div className="text-sm text-gray-400">Win Rate Global</div>
                </div>
                <div className="text-center p-3 bg-cs2-success/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-success">{team.extended_analysis.summary.maps_analyzed}</div>
                  <div className="text-sm text-gray-400">Maps Analysées</div>
                </div>
                <div className="text-center p-3 bg-cs2-warning/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-warning">{team.extended_analysis.summary.high_confidence_maps}</div>
                  <div className="text-sm text-gray-400">Haute Confiance</div>
                </div>
              </div>
            </div>

            {/* Recommandations Stratégiques */}
            {team.extended_analysis.recommendations && team.extended_analysis.recommendations.length > 0 && (
              <div className="card-cs2 p-6 border-l-4 border-cs2-orange">
                <h3 className="text-lg font-bold mb-4 text-cs2-orange flex items-center gap-2">
                  <Target size={20} />
                  Recommandations Stratégiques ({team.extended_analysis.recommendations.length})
                </h3>
                <div className="space-y-3">
                  {team.extended_analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      rec.type === 'pick' 
                        ? 'bg-cs2-success/20 border-cs2-success' 
                        : 'bg-cs2-error/20 border-cs2-error'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded text-sm font-bold ${
                            rec.priority === 'high' 
                              ? rec.type === 'pick' ? 'bg-cs2-success text-black' : 'bg-cs2-error text-white'
                              : rec.type === 'pick' ? 'bg-cs2-accent text-white' : 'bg-cs2-warning text-black'
                          }`}>
                            {rec.type === 'pick' ? 'PICK' : 'BAN'} - {rec.priority === 'high' ? 'PRIORITÉ HAUTE' : 'PRIORITÉ MOYENNE'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rec.confidence === 'high' ? 'bg-cs2-blue text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {rec.confidence === 'high' ? 'HAUTE CONFIANCE' : 'CONFIANCE MOYENNE'}
                          </span>
                        </div>
                      </div>
                      <h4 className={`font-bold mb-2 ${
                        rec.type === 'pick' ? 'text-cs2-success' : 'text-cs2-error'
                      }`}>
                        {rec.maps.join(', ')}
                      </h4>
                      <p className="text-sm text-gray-300">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance par Map Étendue */}
            {team.extended_analysis.map_performance && Object.keys(team.extended_analysis.map_performance).length > 0 && (
              <div className="card-cs2 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="text-cs2-orange" />
                  Performance Étendue par Map (1-2 mois)
                </h3>
                <div className="space-y-3">
                  {Object.entries(team.extended_analysis.map_performance)
                    .filter(([map, stats]) => stats.players_with_data > 0)
                    .sort((a, b) => b[1].avg_win_rate - a[1].avg_win_rate)
                    .map(([mapName, stats], idx) => {
                      const isStrong = stats.avg_win_rate >= 60;
                      const isWeak = stats.avg_win_rate <= 40;
                      const trend = team.extended_analysis.form_trends[mapName];
                      
                      return (
                        <div key={mapName} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${isStrong ? 'bg-cs2-success text-black' : isWeak ? 'bg-cs2-error text-white' : 'bg-gray-700 text-white'}`}>
                                {idx + 1}
                              </div>
                              <span className="font-bold text-lg">{mapName}</span>
                              <span className={`badge badge-sm ${
                                stats.confidence === 'high' ? 'badge-success' : 
                                stats.confidence === 'medium' ? 'badge-warning' : 'badge-ghost'
                              }`}>
                                {stats.total_matches} matchs
                              </span>
                              <span className="text-xs text-gray-400">
                                ({stats.players_with_data}/5 joueurs)
                              </span>
                              {trend && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  trend.improving_count > trend.declining_count ? 'bg-cs2-success text-black' :
                                  trend.declining_count > trend.improving_count ? 'bg-cs2-error text-white' :
                                  'bg-gray-600 text-white'
                                }`}>
                                  {trend.improving_count > trend.declining_count ? '↗ Amélioration' :
                                   trend.declining_count > trend.improving_count ? '↘ Déclin' : '→ Stable'}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${isStrong ? 'text-cs2-success' : isWeak ? 'text-cs2-error' : 'text-gray-400'}`}>
                                {stats.avg_win_rate}%
                              </div>
                              <div className="text-xs text-gray-400">
                                {stats.avg_kd} K/D • {stats.avg_adr} ADR
                              </div>
                            </div>
                          </div>
                          <div className="relative h-3 bg-cs2-dark rounded-full overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                isStrong ? 'bg-gradient-to-r from-cs2-success to-cs2-accent' : 
                                isWeak ? 'bg-gradient-to-r from-cs2-error to-cs2-warning' : 
                                'bg-gradient-to-r from-gray-600 to-gray-500'
                              }`}
                              style={{ width: `${stats.avg_win_rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-4 p-3 bg-cs2-dark/30 rounded-lg">
                  <p className="text-xs text-gray-400">
                    💡 <strong>Note:</strong> Analyse basée sur 1-2 mois de données avec tendances mensuelles
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stratégie de Veto Avancée */}
        {team.veto_strategy && (
          <div className="space-y-6">
            {/* Résumé de la stratégie de veto */}
            <div className="card-cs2 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="text-cs2-orange" />
                Stratégie de Veto Avancée
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-cs2-success/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-success">{team.veto_strategy.pick_priority.length}</div>
                  <div className="text-sm text-gray-400">Maps à Pick</div>
                </div>
                <div className="text-center p-3 bg-cs2-error/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-error">{team.veto_strategy.ban_priority.length}</div>
                  <div className="text-sm text-gray-400">Maps à Ban</div>
                </div>
                <div className="text-center p-3 bg-cs2-accent/20 rounded-lg">
                  <div className="text-2xl font-bold text-cs2-accent">{team.veto_strategy.neutral_maps.length}</div>
                  <div className="text-sm text-gray-400">Maps Neutres</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-cs2-dark/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    team.veto_strategy.confidence_level === 'high' ? 'bg-cs2-success text-black' :
                    team.veto_strategy.confidence_level === 'medium' ? 'bg-cs2-warning text-black' :
                    'bg-cs2-error text-white'
                  }`}>
                    {team.veto_strategy.confidence_level === 'high' ? 'HAUTE CONFIANCE' :
                     team.veto_strategy.confidence_level === 'medium' ? 'CONFIANCE MOYENNE' : 'CONFIANCE FAIBLE'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Stratégie basée sur l'analyse composite des performances lifetime, récentes (30j) et étendues (60j)
                </p>
              </div>
            </div>

            {/* Maps à Pick */}
            {team.veto_strategy.pick_priority.length > 0 && (
              <div className="card-cs2 p-6 border-l-4 border-cs2-success">
                <h3 className="text-lg font-bold mb-4 text-cs2-success flex items-center gap-2">
                  <TrendingUp size={20} />
                  Maps à Pick ({team.veto_strategy.pick_priority.length})
                </h3>
                <div className="space-y-3">
                  {team.veto_strategy.pick_priority.map((map, idx) => (
                    <div key={map.map} className="p-4 bg-cs2-success/20 rounded-lg border border-cs2-success">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cs2-success text-black flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-lg text-cs2-success">{map.map}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            map.confidence >= 0.7 ? 'bg-cs2-success text-black' :
                            map.confidence >= 0.5 ? 'bg-cs2-warning text-black' : 'bg-gray-600 text-white'
                          }`}>
                            {Math.round(map.confidence * 100)}% confiance
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cs2-success">{map.score}%</div>
                          <div className="text-xs text-gray-400">Score composite</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{map.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maps à Ban */}
            {team.veto_strategy.ban_priority.length > 0 && (
              <div className="card-cs2 p-6 border-l-4 border-cs2-error">
                <h3 className="text-lg font-bold mb-4 text-cs2-error flex items-center gap-2">
                  <Target size={20} />
                  Maps à Ban ({team.veto_strategy.ban_priority.length})
                </h3>
                <div className="space-y-3">
                  {team.veto_strategy.ban_priority.map((map, idx) => (
                    <div key={map.map} className="p-4 bg-cs2-error/20 rounded-lg border border-cs2-error">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cs2-error text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-lg text-cs2-error">{map.map}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            map.confidence >= 0.7 ? 'bg-cs2-success text-black' :
                            map.confidence >= 0.5 ? 'bg-cs2-warning text-black' : 'bg-gray-600 text-white'
                          }`}>
                            {Math.round(map.confidence * 100)}% confiance
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cs2-error">{map.score}%</div>
                          <div className="text-xs text-gray-400">Score composite</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{map.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maps Neutres */}
            {team.veto_strategy.neutral_maps.length > 0 && (
              <div className="card-cs2 p-6 border-l-4 border-gray-500">
                <h3 className="text-lg font-bold mb-4 text-gray-400 flex items-center gap-2">
                  <Award size={20} />
                  Maps Neutres ({team.veto_strategy.neutral_maps.length})
                </h3>
                <div className="space-y-3">
                  {team.veto_strategy.neutral_maps.map((map, idx) => (
                    <div key={map.map} className="p-4 bg-gray-600/20 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-lg text-gray-400">{map.map}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            map.confidence >= 0.7 ? 'bg-cs2-success text-black' :
                            map.confidence >= 0.5 ? 'bg-cs2-warning text-black' : 'bg-gray-600 text-white'
                          }`}>
                            {Math.round(map.confidence * 100)}% confiance
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-400">{map.score}%</div>
                          <div className="text-xs text-gray-400">Score composite</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{map.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Stratégiques */}
            {team.veto_strategy.strategy_notes.length > 0 && (
              <div className="card-cs2 p-6 border-l-4 border-cs2-blue">
                <h3 className="text-lg font-bold mb-4 text-cs2-blue flex items-center gap-2">
                  <Award size={20} />
                  Notes Stratégiques ({team.veto_strategy.strategy_notes.length})
                </h3>
                <div className="space-y-3">
                  {team.veto_strategy.strategy_notes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-cs2-blue/20 rounded-lg border border-cs2-blue">
                      <p className="text-sm text-gray-300">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}