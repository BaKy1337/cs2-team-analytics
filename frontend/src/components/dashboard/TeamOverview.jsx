import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Zap, 
  Award, 
  Activity,
  Flame,
  Snowflake,
  Minus
} from 'lucide-react';
import Card from '../ui/Card';
import StatsCard from '../ui/StatsCard';

const TeamOverview = ({ teamData, recentPerformance }) => {
  if (!teamData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="stats-card animate-pulse">
            <div className="h-4 bg-cs2-dark-lighter rounded mb-2"></div>
            <div className="h-8 bg-cs2-dark-lighter rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const getFormIcon = (trend) => {
    switch (trend) {
      case 'hot':
        return <Flame className="w-4 h-4 text-cs2-hot" />;
      case 'cold':
        return <Snowflake className="w-4 h-4 text-cs2-cold" />;
      default:
        return <Minus className="w-4 h-4 text-cs2-neutral" />;
    }
  };

  const getFormColor = (trend) => {
    switch (trend) {
      case 'hot':
        return 'hot';
      case 'cold':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de l'équipe */}
      <Card glow>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Vue d'ensemble de l'équipe
            </h2>
            <p className="text-cs2-gray-light">
              Analyse complète des performances et statistiques
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cs2-primary" />
            <span className="text-lg font-semibold text-white">
              {teamData.players?.length || 0} joueurs
            </span>
          </div>
        </div>
      </Card>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Niveau moyen"
          value={teamData.avg_skill_level || 0}
          icon={<Award className="w-4 h-4" />}
          color="primary"
        />
        
        <StatsCard
          title="Victoires récentes"
          value={`${recentPerformance?.team_win_rate || 0}%`}
          change={recentPerformance?.team_win_rate - (teamData.avg_win_rate || 0)}
          changeType={recentPerformance?.team_win_rate > (teamData.avg_win_rate || 0) ? 'positive' : 'negative'}
          icon={<TrendingUp className="w-4 h-4" />}
          color="success"
        />
        
        <StatsCard
          title="K/D moyen"
          value={recentPerformance?.team_kd?.toFixed(2) || '0.00'}
          icon={<Target className="w-4 h-4" />}
          color="info"
        />
        
        <StatsCard
          title="ADR moyen"
          value={recentPerformance?.team_adr || 0}
          icon={<Activity className="w-4 h-4" />}
          color="warning"
        />
      </div>

      {/* Stats avancées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Forme de l'équipe"
          value={recentPerformance?.team_consistency || 'N/A'}
          icon={getFormIcon(recentPerformance?.team_consistency)}
          color={getFormColor(recentPerformance?.team_consistency)}
        />
        
        <StatsCard
          title="Joueurs en forme"
          value={`${recentPerformance?.hot_players || 0}/5`}
          icon={<Flame className="w-4 h-4" />}
          color="hot"
        />
        
        <StatsCard
          title="Momentum"
          value={recentPerformance?.synergies?.momentum || 'N/A'}
          icon={<Zap className="w-4 h-4" />}
          color="primary"
        />
      </div>

      {/* Analyse des synergies */}
      {recentPerformance?.synergies && (
        <Card>
          <Card.Header>
            <Card.Title>Analyse des synergies d'équipe</Card.Title>
            <Card.Subtitle>
              Évaluation de la cohésion et du potentiel collectif
            </Card.Subtitle>
          </Card.Header>
          
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-primary to-cs2-primary-dark rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">Momentum</h4>
                <p className="text-sm text-cs2-gray-light capitalize">
                  {recentPerformance.synergies.momentum}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-success to-cs2-success-dark rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">Développement</h4>
                <p className="text-sm text-cs2-gray-light capitalize">
                  {recentPerformance.synergies.development}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-info to-cs2-info-dark rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">Équilibre</h4>
                <p className="text-sm text-cs2-gray-light capitalize">
                  {recentPerformance.synergies.balance}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Indicateurs de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Indicateurs de forme</Card.Title>
          </Card.Header>
          
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Joueurs en forme</span>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cs2-hot" />
                  <span className="font-semibold text-white">
                    {recentPerformance?.hot_players || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Joueurs en difficulté</span>
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-cs2-cold" />
                  <span className="font-semibold text-white">
                    {recentPerformance?.cold_players || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Joueurs en progression</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cs2-success" />
                  <span className="font-semibold text-white">
                    {recentPerformance?.improving_players || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header>
            <Card.Title>Métriques avancées</Card.Title>
          </Card.Header>
          
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">KAST moyen</span>
                <span className="font-semibold text-white">
                  {recentPerformance?.team_kast || 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Rating moyen</span>
                <span className="font-semibold text-white">
                  {recentPerformance?.team_rating?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">HS% moyen</span>
                <span className="font-semibold text-white">
                  {recentPerformance?.team_hs_percent || 0}%
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default TeamOverview;
