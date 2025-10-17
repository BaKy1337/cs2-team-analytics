import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Zap, 
  Clock, 
  Database, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const MatchIdInput = ({ onLoadTeams, loading = false }) => {
  const [matchId, setMatchId] = useState('');
  const [loadingMode, setLoadingMode] = useState('optimized');
  const [showModeSelector, setShowModeSelector] = useState(false);

  const loadingModes = [
    {
      id: 'ultrafast',
      name: 'Ultra-rapide',
      description: 'Données minimales, chargement instantané',
      icon: <Zap className="w-4 h-4" />,
      time: '< 500ms',
      color: 'text-cs2-success',
      details: 'Seulement les données du match, stats lifetime chargées plus tard'
    },
    {
      id: 'optimized',
      name: 'Optimisé',
      description: 'Équilibre entre vitesse et données',
      icon: <Clock className="w-4 h-4" />,
      time: '1-2s',
      color: 'text-cs2-primary',
      details: 'Données essentielles + pré-chargement en arrière-plan'
    },
    {
      id: 'full',
      name: 'Complet',
      description: 'Toutes les données, chargement plus long',
      icon: <Database className="w-4 h-4" />,
      time: '5-10s',
      color: 'text-cs2-warning',
      details: 'Toutes les stats récentes et analyses complètes'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matchId.trim()) return;

    try {
      await onLoadTeams(matchId.trim(), loadingMode);
    } catch (error) {
      console.error('Error loading match teams:', error);
    }
  };

  const selectedMode = loadingModes.find(mode => mode.id === loadingMode);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Charger par Match ID</Card.Title>
        <Card.Subtitle>
          Récupérer les équipes d'un match spécifique
        </Card.Subtitle>
      </Card.Header>
      
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Match ID */}
          <div>
            <label className="block text-sm font-medium text-cs2-gray-light mb-2">
              Match ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="1-abc123-def456-ghi789"
                className="input pr-12"
                disabled={loading}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cs2-gray" />
            </div>
          </div>

          {/* Mode de chargement */}
          <div>
            <label className="block text-sm font-medium text-cs2-gray-light mb-2">
              Mode de chargement
            </label>
            
            <div className="space-y-2">
              {loadingModes.map((mode) => (
                <motion.div
                  key={mode.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    loadingMode === mode.id
                      ? 'border-cs2-primary bg-cs2-primary/10'
                      : 'border-cs2-dark-lighter hover:border-cs2-gray'
                  }`}
                  onClick={() => setLoadingMode(mode.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${mode.color}`}>
                        {mode.icon}
                      </div>
                      <div>
                        <div className="font-medium text-white">{mode.name}</div>
                        <div className="text-sm text-cs2-gray-light">
                          {mode.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${mode.color}`}>
                        {mode.time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Détails du mode sélectionné */}
            <AnimatePresence>
              {selectedMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-cs2-dark/50 rounded-lg border border-cs2-dark-lighter"
                >
                  <div className="flex items-start gap-2">
                    <div className={`${selectedMode.color} mt-0.5`}>
                      {selectedMode.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-1">
                        {selectedMode.name} sélectionné
                      </div>
                      <div className="text-xs text-cs2-gray-light">
                        {selectedMode.details}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bouton de chargement */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!matchId.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement en cours...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Charger les équipes
              </>
            )}
          </Button>
        </form>

        {/* Indicateurs de performance */}
        <div className="mt-6 p-4 bg-cs2-dark/30 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-3">
            Indicateurs de performance
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-cs2-success">
                {loadingMode === 'ultrafast' ? '< 0.5s' : 
                 loadingMode === 'optimized' ? '1-2s' : '5-10s'}
              </div>
              <div className="text-xs text-cs2-gray-light">Temps de chargement</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cs2-primary">
                {loadingMode === 'ultrafast' ? '2' : 
                 loadingMode === 'optimized' ? '12' : '600+'}
              </div>
              <div className="text-xs text-cs2-gray-light">Requêtes API</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cs2-info">
                {loadingMode === 'ultrafast' ? 'Minimales' : 
                 loadingMode === 'optimized' ? 'Essentielles' : 'Complètes'}
              </div>
              <div className="text-xs text-cs2-gray-light">Données</div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

export default MatchIdInput;
