import { useState } from 'react';
import { Search, User, AlertCircle, Loader } from 'lucide-react';
import { api } from '../services/api';
import SimpleTeamSelector from './SimpleTeamSelector';

export default function TeamInput({ onAnalyze, loading, isOurTeam = true, onLoadBothTeams }) {
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

  const loadOpponentTeam = async () => {
    if (!matchId.trim()) {
      setError('Veuillez entrer un match_id valide');
      return;
    }

    setLoadingMatch(true);
    setError('');

    try {
      const matchData = await api.getMatchData(matchId.trim());
      
      // Trouver l'équipe adverse (celle qui ne contient pas nos joueurs)
      const ourNicknames = defaultTeam.map(n => n.toLowerCase());
      let opponentTeam = null;
      
      for (const [factionKey, faction] of Object.entries(matchData.teams)) {
        const factionNicknames = faction.roster.map(player => player.nickname.toLowerCase());
        const hasOurPlayers = ourNicknames.some(ourNick => 
          factionNicknames.includes(ourNick)
        );
        
        if (!hasOurPlayers) {
          opponentTeam = faction.roster.map(player => player.nickname);
          break;
        }
      }
      
      if (opponentTeam && opponentTeam.length >= 5) {
        setNicknames(opponentTeam.slice(0, 5));
        setShowMatchIdInput(false);
        setMatchId('');
      } else {
        setError('Impossible de trouver l\'équipe adverse dans ce match');
      }
    } catch (error) {
      setError('Erreur lors de la récupération du match: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingMatch(false);
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
    <div className="card card-compact animate-fade-in">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <User className="text-cs2-orange" size={20} />
          Nicknames Faceit
        </h3>
        <div className="flex gap-2">
          {isOurTeam ? (
            <div className="flex gap-2">
              <button 
                onClick={loadDefaultTeam}
                className="btn btn-sm btn-ghost"
              >
                Charger notre équipe
              </button>
              <button 
                onClick={() => setShowMatchIdInput(!showMatchIdInput)}
                className="btn btn-sm btn-primary"
              >
                Charger par Match ID
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowMatchIdInput(!showMatchIdInput)}
                className="btn btn-sm btn-primary"
              >
                Charger l'équipe adverse
              </button>
              <button 
                onClick={() => {
                  setShowMatchIdInput(false);
                  setError('');
                }}
                className="btn btn-sm btn-ghost"
              >
                Saisie manuelle
              </button>
            </div>
          )}
          {nicknames.some(n => n.trim()) && (
            <button 
              onClick={clearAll}
              className="btn btn-sm btn-error"
            >
              Effacer tout
            </button>
          )}
        </div>
      </div>
      <div className="card-body">

        {showMatchIdInput && (
          <div className="mb-4 p-4 bg-cs2-card/50 rounded-lg border border-gray-700 animate-slide-up">
            <div className="input-group">
              <input
                type="text"
                placeholder="Entrez le match_id (ex: 1-850813c3-21db-4045-be6d-ba8ecf557f44)"
                className="input flex-1"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (isOurTeam ? loadBothTeamsFromMatch() : loadOpponentTeam())}
              />
              <div className="flex gap-2">
                {isOurTeam && onLoadBothTeams ? (
                  <button
                    onClick={loadBothTeamsFromMatch}
                    disabled={loadingMatch || !matchId.trim()}
                    className="btn btn-primary"
                  >
                    {loadingMatch ? (
                      <Loader className="animate-spin" size={16} />
                    ) : (
                      <Search size={16} />
                    )}
                    {loadingMatch ? 'Chargement...' : 'Charger les 2 équipes'}
                  </button>
                ) : (
                  <button
                    onClick={loadOpponentTeam}
                    disabled={loadingMatch || !matchId.trim()}
                    className="btn btn-primary"
                  >
                    {loadingMatch ? (
                      <Loader className="animate-spin" size={16} />
                    ) : (
                      <Search size={16} />
                    )}
                    {loadingMatch ? 'Chargement...' : 'Récupérer'}
                  </button>
                )}
              </div>
            </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 Le match_id se trouve dans l'URL du match Faceit<br/>
            {isOurTeam && onLoadBothTeams ? (
              <>🚀 <strong>Charger les 2 équipes</strong> : Remplit automatiquement les deux équipes<br/></>
            ) : null}
            🔧 Les données sont récupérées via notre backend
          </p>
        </div>
      )}

        <div className="space-y-3" onPaste={handlePaste}>
          {nicknames.map((nickname, index) => (
            <div key={index} className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${nickname ? 'bg-cs2-orange text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {index + 1}
                </div>
              </div>
              <input
                type="text"
                placeholder={`Joueur ${index + 1} (ex: s1mple)`}
                className="input w-full pl-14"
                value={nickname}
                onChange={(e) => handleChange(index, e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData('text').trim();
                  handleChange(index, pastedText);
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="alert alert-error mt-4 animate-slide-up">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <button 
          className={`btn btn-primary w-full mt-6 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              Analyse en cours...
            </>
          ) : (
            <>
              <Search size={20} />
              Analyser l'Équipe
            </>
          )}
        </button>
      </div>

        <div className="mt-4 p-3 bg-cs2-dark/50 rounded-lg border border-gray-800">
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <span className="text-cs2-accent">💡</span>
            Tu peux coller 5 nicknames d'un coup (séparés par des espaces ou lignes)
          </p>
        </div>

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
    </div>
  );
}