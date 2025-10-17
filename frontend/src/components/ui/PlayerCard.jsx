import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Zap } from 'lucide-react';

const PlayerCard = ({ 
  player, 
  compact = false,
  showStats = true,
  className = ''
}) => {
  const getSkillColor = (level) => {
    if (level >= 8) return 'text-primary-500';
    if (level >= 6) return 'text-success-500';
    if (level >= 4) return 'text-warning-500';
    return 'text-text-tertiary';
  };

  const getSkillIcon = (level) => {
    if (level >= 8) return <Crown className="w-3 h-3" />;
    if (level >= 6) return <Shield className="w-3 h-3" />;
    return <Zap className="w-3 h-3" />;
  };

  return (
    <motion.div
      className={`player-card ${compact ? 'p-3' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <img 
        src={player.avatar} 
        alt={player.nickname}
        className="player-avatar"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/48x48/374151/ffffff?text=?';
        }}
      />
      
      <div className="player-name">{player.nickname}</div>
      
      <div className="flex items-center justify-center gap-1 mb-2">
        {getSkillIcon(player.skill_level)}
        <span className={`player-level ${getSkillColor(player.skill_level)}`}>
          Niveau {player.skill_level}
        </span>
      </div>

      {player.membership === 'premium' && (
        <div className="badge badge-primary text-xs mb-2">Premium</div>
      )}

      {showStats && player.lifetime_stats && (
        <div className="player-stats">
          <div className="player-stat">
            <span>K/D</span>
            <span className="player-stat-value">
              {player.lifetime_stats['Average K/D Ratio'] || 'N/A'}
            </span>
          </div>
          <div className="player-stat">
            <span>ADR</span>
            <span className="player-stat-value">
              {player.lifetime_stats.ADR || 'N/A'}
            </span>
          </div>
          <div className="player-stat">
            <span>HS%</span>
            <span className="player-stat-value">
              {player.lifetime_stats['Average Headshots %'] || 'N/A'}%
            </span>
          </div>
          <div className="player-stat">
            <span>WR</span>
            <span className="player-stat-value">
              {player.lifetime_stats['Win Rate %'] || 'N/A'}%
            </span>
          </div>
        </div>
      )}

      {showStats && player.recent_stats && (
        <div className="mt-2 pt-2 border-t border-border-primary">
          <div className="text-xs text-text-tertiary mb-1">Forme récente</div>
          <div className="player-stats">
            <div className="player-stat">
              <span>K/D</span>
              <span className={`player-stat-value ${
                player.recent_stats.recent_kd > (player.lifetime_stats?.['Average K/D Ratio'] || 0) 
                  ? 'text-success-500' 
                  : 'text-error-500'
              }`}>
                {player.recent_stats.recent_kd || 'N/A'}
              </span>
            </div>
            <div className="player-stat">
              <span>WR</span>
              <span className={`player-stat-value ${
                player.recent_stats.recent_win_rate > (player.lifetime_stats?.['Win Rate %'] || 0) 
                  ? 'text-success-500' 
                  : 'text-error-500'
              }`}>
                {player.recent_stats.recent_win_rate || 'N/A'}%
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlayerCard;
