import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Zap, 
  Shield, 
  Trophy,
  Award,
  Activity
} from 'lucide-react';
import ModernCard from '../ui/ModernCard';
import StatsCard from '../ui/StatsCard';
import PlayerCard from '../ui/PlayerCard';

const ModernTeamDashboard = ({ team }) => {
  if (!team || !team.players || team.players.length === 0) {
    return (
      <ModernCard className="text-center py-12">
        <div className="text-text-tertiary">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune donnée d'équipe à afficher</p>
        </div>
      </ModernCard>
    );
  }

  const { 
    team_name, 
    avg_elo, 
    avg_skill_level, 
    avg_kd, 
    avg_adr, 
    avg_hs_percent, 
    avg_win_rate,
    recent_stats,
    players 
  } = team;

  // Calculer les tendances
  const getTrend = (recent, lifetime) => {
    if (recent > lifetime + 5) return 'up';
    if (recent < lifetime - 5) return 'down';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header de l'équipe */}
      <ModernCard variant="elevated" className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-primary-500" />
          <h1 className="text-2xl font-bold text-gradient">
            {team_name || 'Notre Équipe'}
          </h1>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-text-primary">{avg_elo}</div>
            <div className="text-xs text-text-tertiary">ELO Moyen</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-500">{avg_skill_level}</div>
            <div className="text-xs text-text-tertiary">Niveau Moyen</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-success-500">{avg_win_rate}%</div>
            <div className="text-xs text-text-tertiary">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-warning-500">{avg_kd}</div>
            <div className="text-xs text-text-tertiary">K/D Moyen</div>
          </div>
        </div>
      </ModernCard>

      {/* Stats principales */}
      <div className="stats-grid">
        <StatsCard
          title="K/D Ratio"
          value={avg_kd}
          trend={getTrend(recent_stats?.avg_recent_kd, avg_kd)}
          description="Ratio éliminations/morts"
        />
        <StatsCard
          title="ADR"
          value={avg_adr}
          unit=""
          trend={getTrend(recent_stats?.avg_recent_adr, avg_adr)}
          description="Dégâts moyens par round"
        />
        <StatsCard
          title="Headshots"
          value={avg_hs_percent}
          unit="%"
          trend={getTrend(recent_stats?.avg_recent_hs_percent, avg_hs_percent)}
          description="Pourcentage de headshots"
        />
        <StatsCard
          title="Win Rate"
          value={avg_win_rate}
          unit="%"
          trend={getTrend(recent_stats?.avg_recent_win_rate, avg_win_rate)}
          description="Pourcentage de victoires"
        />
      </div>

      {/* Forme récente */}
      {recent_stats && (
        <ModernCard>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-success-500" />
              <h2 className="card-title">Forme Récente</h2>
            </div>
            <div className="badge badge-success">
              {recent_stats.total_recent_matches} matchs
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {recent_stats.avg_recent_win_rate}%
              </div>
              <div className="text-xs text-text-tertiary">Win Rate (30j)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {recent_stats.avg_recent_kd}
              </div>
              <div className="text-xs text-text-tertiary">K/D (30j)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {recent_stats.avg_recent_adr}
              </div>
              <div className="text-xs text-text-tertiary">ADR (30j)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {recent_stats.avg_recent_hs_percent}%
              </div>
              <div className="text-xs text-text-tertiary">HS% (30j)</div>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Joueurs */}
      <ModernCard>
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            <h2 className="card-title">Composition de l'Équipe</h2>
          </div>
          <div className="badge badge-gray">
            {players.length} joueurs
          </div>
        </div>
        
        <div className="player-grid">
          {players.map((player) => (
            <PlayerCard
              key={player.player_id}
              player={player}
              compact={true}
              showStats={true}
            />
          ))}
        </div>
      </ModernCard>

      {/* Analyse détaillée */}
      {team.analysis && (
        <ModernCard>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-warning-500" />
              <h2 className="card-title">Analyse Tactique</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {team.analysis.summary && (
              <div>
                <h3 className="font-semibold text-text-primary mb-2">Résumé</h3>
                <p className="text-text-secondary text-sm">{team.analysis.summary}</p>
              </div>
            )}
            
            {team.analysis.strengths && team.analysis.strengths.length > 0 && (
              <div>
                <h3 className="font-semibold text-success-500 mb-2">Forces</h3>
                <ul className="space-y-1">
                  {team.analysis.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">{strength.title}:</span> {strength.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {team.analysis.weaknesses && team.analysis.weaknesses.length > 0 && (
              <div>
                <h3 className="font-semibold text-error-500 mb-2">Faiblesses</h3>
                <ul className="space-y-1">
                  {team.analysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">{weakness.title}:</span> {weakness.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default ModernTeamDashboard;
