import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  unit = '', 
  trend = 'neutral',
  description = '',
  compact = false,
  className = ''
}) => {
  const trendIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />
  };

  const trendColor = {
    up: 'text-success-500',
    down: 'text-error-500', 
    neutral: 'text-text-muted'
  };

  return (
    <motion.div
      className={`stat-card ${compact ? 'p-3' : ''} ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="stat-value">
        {value}
        {unit && <span className="text-sm font-normal text-text-tertiary ml-1">{unit}</span>}
      </div>
      <div className="stat-label">{title}</div>
      
      {trend !== 'neutral' && (
        <div className={`stat-trend ${trend}`}>
          {trendIcon[trend]}
          <span className="text-xs">
            {trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable'}
          </span>
        </div>
      )}
      
      {description && (
        <div className="text-xs text-text-tertiary mt-2">{description}</div>
      )}
    </motion.div>
  );
};

export default StatsCard;