import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  User, 
  AlertCircle, 
  Loader2, 
  Users,
  Zap,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import ModernCard from '../ui/ModernCard';
import ModernButton from '../ui/ModernButton';
import SimpleTeamSelector from '../TeamSelector';

export default function ModernTeamInput({ onAnalyze, loading, isOurTeam = true, onLoadBothTeams }) {
  const [nicknames, setNicknames] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [showMatchIdInput, setShowMatchIdInput] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [matchData, setMatchData] = useState(null);
  
  // Nicknames de notre équipe par défaut
  const defaultTeam = ['Tomassenz', 'BaKySaiyajiN', 'MelMA', 'DARTS', 'Cugiiii'];

  const handleChange = (index, value) => {
    const newNicknames = [...nicknames];
    newNicknames[index] = value;
    setNicknames(newNicknames);
    setError('');
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const names = pastedText.split(/[\n,\s]+/).filter(n => n.trim());
    
    if (names.length === 5) {
      setNicknames(names.slice(0, 5));
      setError('');
    }
  };

  const handleSubmit = () => {
    const validNicknames = nicknames.filter(n => n.trim() !== '');
    if (validNicknames.length === 0) {
      setError('Tu dois entrer au moins un nickname Faceit');
      return;
    }
    if (validNicknames.length > 5) {
      setError('Maximum 5 joueurs autorisés (les 5 premiers seront analysés)');
      return;
    }
    onAnalyze(validNicknames);
  };

  const clearAll = () => {
    setNicknames(['', '', '', '', '']);
    setError('');
  };

  const loadDefaultTeam = () => {
    setNicknames([...defaultTeam]);
    setError('');
  };

  const handleTeamSelection = (ourTeam, enemyTeam) => {
    if (onLoadBothTeams) {
      const ourTeamNicknames = ourTeam.roster.map(player => player.nickname).slice(0, 5);
      const enemyTeamNicknames = enemyTeam.roster.map(player => player.nickname).slice(0, 5);
      
      onLoadBothTeams(ourTeamNicknames, enemyTeamNicknames, matchData);
      setShowMatchIdInput(false);
      setMatchId('');
    }
  };

  const loadBothTeamsFromMatch = async (mode = 'optimized') => {
    if (!matchId.trim()) {
      setError('Veuillez entrer un match_id valide');
      return;
    }

    setLoadingMatch(true);
    setError('');

    try {
      const matchData = await api.loadMatchTeams(matchId.trim(), mode);
      
      // Extraire les deux équipes
      const teams = Object.values(matchData.teams);
      if (teams.length !== 2) {
        setError('Le match doit contenir exactement 2 équipes');
        return;
      }

      const [team1, team2] = teams;
      
      // Stocker les données du match et ouvrir le modal de sélection
      setMatchData({
        team1,
        team2,
        matchInfo: matchData.match_info,
        loadingTime: matchData.loading_time,
        optimization: matchData.optimization
      });
      setShowTeamSelector(true);
    } catch (error) {
      setError('Erreur lors de la récupération du match: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <ModernCard variant="elevated">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          <h2 className="card-title">
            {isOurTeam ? 'Notre Équipe' : 'Équipe Adverse'}
          </h2>
        </div>
        <div className="flex gap-2">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={loadDefaultTeam}
          >
            <Zap className="w-4 h-4" />
            Équipe par défaut
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={clearAll}
          >
            Effacer
          </ModernButton>
        </div>
      </div>

      {/* Inputs des nicknames */}
      <div className="space-y-3">
        {nicknames.map((nickname, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleChange(index, e.target.value)}
                onPaste={handlePaste}
                placeholder={`Joueur ${index + 1}`}
                className="input pr-10"
                disabled={loading}
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-500 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <ModernButton
          variant="secondary"
          onClick={() => setShowMatchIdInput(!showMatchIdInput)}
          className="flex-1"
        >
          <Clock className="w-4 h-4" />
          Charger par Match ID
        </ModernButton>
        
        <ModernButton
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading || nicknames.every(n => n.trim() === '')}
          className="flex-1"
        >
          <Search className="w-4 h-4" />
          Analyser l'Équipe
        </ModernButton>
      </div>

      {/* Input Match ID */}
      {showMatchIdInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border-primary"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Match ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="1-abc123-def456-ghi789"
                  className="input pr-12"
                  disabled={loadingMatch}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              </div>
            </div>

            <div className="flex gap-2">
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => loadBothTeamsFromMatch('ultrafast')}
                loading={loadingMatch}
                className="flex-1"
              >
                <Zap className="w-4 h-4" />
                Ultra-rapide
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={() => loadBothTeamsFromMatch('optimized')}
                loading={loadingMatch}
                className="flex-1"
              >
                <Clock className="w-4 h-4" />
                Optimisé
              </ModernButton>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de sélection d'équipe simple */}
      {matchData && (
        <SimpleTeamSelector
          isOpen={showTeamSelector}
          onClose={() => setShowTeamSelector(false)}
          team1={matchData.team1}
          team2={matchData.team2}
          onSelectTeam={handleTeamSelection}
        />
      )}
    </ModernCard>
  );
}
