import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award, 
  Zap,
  Shield,
  Flame,
  Snowflake
} from 'lucide-react';
import Card from '../ui/Card';
import StatsCard from '../ui/StatsCard';

const TeamComparison = ({ team1, team2, comparison }) => {
  if (!team1 || !team2) {
    return (
      <div className="text-center py-12">
        <div className="text-cs2-gray-light">
          Sélectionnez deux équipes pour commencer la comparaison
        </div>
      </div>
    );
  }

  const getAdvantageIcon = (advantage) => {
    switch (advantage) {
      case 'team1':
        return <Flame className="w-4 h-4 text-cs2-primary" />;
      case 'team2':
        return <Snowflake className="w-4 h-4 text-cs2-info" />;
      default:
        return <Target className="w-4 h-4 text-cs2-gray" />;
    }
  };

  const getAdvantageColor = (advantage) => {
    switch (advantage) {
      case 'team1':
        return 'primary';
      case 'team2':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const compareValue = (value1, value2, higherIsBetter = true) => {
    if (value1 === value2) return 'equal';
    const better = higherIsBetter ? value1 > value2 : value1 < value2;
    return better ? 'team1' : 'team2';
  };

  return (
    <div className="space-y-6">
      {/* En-tête de comparaison */}
      <Card glow>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Comparaison d'équipes
          </h2>
          <p className="text-cs2-gray-light">
            Analyse comparative des performances et statistiques
          </p>
        </div>
      </Card>

      {/* Comparaison des stats principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Équipe 1 */}
        <Card>
          <Card.Header>
            <Card.Title className="text-cs2-primary">Équipe 1</Card.Title>
            <Card.Subtitle>
              {team1.players?.length || 0} joueurs • Niveau {team1.avg_skill_level || 0}
            </Card.Subtitle>
          </Card.Header>
          
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Victoires récentes</span>
                <span className="font-semibold text-white">
                  {team1.recent_performance?.team_win_rate || 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">K/D moyen</span>
                <span className="font-semibold text-white">
                  {team1.recent_performance?.team_kd?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">ADR moyen</span>
                <span className="font-semibold text-white">
                  {team1.recent_performance?.team_adr || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Joueurs en forme</span>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cs2-hot" />
                  <span className="font-semibold text-white">
                    {team1.recent_performance?.hot_players || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Équipe 2 */}
        <Card>
          <Card.Header>
            <Card.Title className="text-cs2-info">Équipe 2</Card.Title>
            <Card.Subtitle>
              {team2.players?.length || 0} joueurs • Niveau {team2.avg_skill_level || 0}
            </Card.Subtitle>
          </Card.Header>
          
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Victoires récentes</span>
                <span className="font-semibold text-white">
                  {team2.recent_performance?.team_win_rate || 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">K/D moyen</span>
                <span className="font-semibold text-white">
                  {team2.recent_performance?.team_kd?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">ADR moyen</span>
                <span className="font-semibold text-white">
                  {team2.recent_performance?.team_adr || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-cs2-gray-light">Joueurs en forme</span>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cs2-hot" />
                  <span className="font-semibold text-white">
                    {team2.recent_performance?.hot_players || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Analyse comparative */}
      <Card>
        <Card.Header>
          <Card.Title>Analyse comparative</Card.Title>
          <Card.Subtitle>
            Comparaison détaillée des forces et faiblesses
          </Card.Subtitle>
        </Card.Header>
        
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-primary to-cs2-primary-dark rounded-full flex items-center justify-center">
                {getAdvantageIcon(compareValue(
                  team1.recent_performance?.team_win_rate || 0,
                  team2.recent_performance?.team_win_rate || 0
                ))}
              </div>
              <h4 className="font-semibold text-white mb-1">Victoires</h4>
              <p className="text-sm text-cs2-gray-light">
                {compareValue(
                  team1.recent_performance?.team_win_rate || 0,
                  team2.recent_performance?.team_win_rate || 0
                ) === 'team1' ? 'Équipe 1' : 
                 compareValue(
                   team1.recent_performance?.team_win_rate || 0,
                   team2.recent_performance?.team_win_rate || 0
                 ) === 'team2' ? 'Équipe 2' : 'Égalité'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-success to-cs2-success-dark rounded-full flex items-center justify-center">
                {getAdvantageIcon(compareValue(
                  team1.recent_performance?.team_kd || 0,
                  team2.recent_performance?.team_kd || 0
                ))}
              </div>
              <h4 className="font-semibold text-white mb-1">K/D Ratio</h4>
              <p className="text-sm text-cs2-gray-light">
                {compareValue(
                  team1.recent_performance?.team_kd || 0,
                  team2.recent_performance?.team_kd || 0
                ) === 'team1' ? 'Équipe 1' : 
                 compareValue(
                   team1.recent_performance?.team_kd || 0,
                   team2.recent_performance?.team_kd || 0
                 ) === 'team2' ? 'Équipe 2' : 'Égalité'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-warning to-cs2-warning-dark rounded-full flex items-center justify-center">
                {getAdvantageIcon(compareValue(
                  team1.recent_performance?.team_adr || 0,
                  team2.recent_performance?.team_adr || 0
                ))}
              </div>
              <h4 className="font-semibold text-white mb-1">ADR</h4>
              <p className="text-sm text-cs2-gray-light">
                {compareValue(
                  team1.recent_performance?.team_adr || 0,
                  team2.recent_performance?.team_adr || 0
                ) === 'team1' ? 'Équipe 1' : 
                 compareValue(
                   team1.recent_performance?.team_adr || 0,
                   team2.recent_performance?.team_adr || 0
                 ) === 'team2' ? 'Équipe 2' : 'Égalité'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cs2-info to-cs2-info-dark rounded-full flex items-center justify-center">
                {getAdvantageIcon(compareValue(
                  team1.recent_performance?.hot_players || 0,
                  team2.recent_performance?.hot_players || 0
                ))}
              </div>
              <h4 className="font-semibold text-white mb-1">Forme</h4>
              <p className="text-sm text-cs2-gray-light">
                {compareValue(
                  team1.recent_performance?.hot_players || 0,
                  team2.recent_performance?.hot_players || 0
                ) === 'team1' ? 'Équipe 1' : 
                 compareValue(
                   team1.recent_performance?.hot_players || 0,
                   team2.recent_performance?.hot_players || 0
                 ) === 'team2' ? 'Équipe 2' : 'Égalité'}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Prédiction et recommandations */}
      {comparison && (
        <Card>
          <Card.Header>
            <Card.Title>Prédiction et recommandations</Card.Title>
            <Card.Subtitle>
              Analyse prédictive basée sur les performances
            </Card.Subtitle>
          </Card.Header>
          
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Prédiction</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cs2-primary to-cs2-primary-dark rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {comparison.prediction || 'Équipe 1'}
                    </div>
                    <div className="text-sm text-cs2-gray-light">
                      Confiance: {comparison.confidence || 65}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3">Recommandations</h4>
                <div className="space-y-2">
                  {comparison.recommendations?.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-cs2-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-cs2-gray-light">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default TeamComparison;
