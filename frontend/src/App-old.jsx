import { useState } from 'react';
import { Shield, Users, TrendingUp, Map, Zap } from 'lucide-react';
import { api } from './services/api';
import TeamInput from './components/TeamInput';
import TeamDashboard from './components/TeamDashboard';
import AdvancedComparison from './components/AdvancedComparison';
import VetoCalculator from './components/VetoCalculator';

function App() {
  const [myTeam, setMyTeam] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const analyzeTeam = async (nicknames, isMyTeam) => {
    setLoading(true);
    try {
      const teamData = await api.analyzeTeam(nicknames);
      if (isMyTeam) {
        setMyTeam(teamData);
        if (enemyTeam) {
          const compData = await api.compareTeams(teamData, enemyTeam);
          setComparison(compData);
        }
      } else {
        setEnemyTeam(teamData);
        if (myTeam) {
          const compData = await api.compareTeams(myTeam, teamData);
          setComparison(compData);
        }
      }
    } catch (error) {
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadBothTeamsFromMatch = async (team1Nicknames, team2Nicknames, matchData) => {
    setLoading(true);
    try {
      // Analyser les deux équipes en parallèle
      const [team1Data, team2Data] = await Promise.all([
        api.analyzeTeam(team1Nicknames),
        api.analyzeTeam(team2Nicknames)
      ]);

      setMyTeam(team1Data);
      setEnemyTeam(team2Data);

      // Comparer les équipes
      const compData = await api.compareTeams(team1Data, team2Data);
      setComparison(compData);

      // Rester sur la page initiale pour voir les stats globales
      // setActiveTab('comparison'); // Commenté pour rester sur la page initiale
    } catch (error) {
      alert('Erreur lors du chargement des équipes: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cs2-dark">
      {/* Header Premium */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cs2-orange/20 to-cs2-accent/20 blur-3xl" />
        <div className="relative navbar bg-cs2-card/80 backdrop-blur-xl shadow-2xl border-b border-gray-800">
          <div className="flex-1">
            <a className="btn btn-ghost normal-case text-2xl font-bold">
              <Shield className="mr-2 text-cs2-orange" size={32} />
              <span className="bg-gradient-to-r from-cs2-orange to-cs2-accent bg-clip-text text-transparent">
                CS2 PRO ANALYTICS
              </span>
            </a>
          </div>
          <div className="flex-none">
            <div className="badge badge-lg bg-cs2-orange text-white font-bold animate-pulse">
              <Zap size={14} className="mr-1" />
              LIVE
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Premium */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center gap-2">
          {[
            { id: 'home', icon: Users, label: 'Configuration' },
            { id: 'comparison', icon: TrendingUp, label: 'Analyse', disabled: !myTeam || !enemyTeam },
            { id: 'veto', icon: Map, label: 'Veto Strategy', disabled: !myTeam || !enemyTeam }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`
                px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-cs2-orange to-cs2-accent text-white shadow-lg scale-105' 
                  : 'bg-cs2-card text-gray-400 hover:text-white hover:bg-cs2-card/80'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-cs2-success to-cs2-blue rounded-full" />
                <h2 className="text-3xl font-bold glow-text text-cs2-success">Notre Équipe</h2>
              </div>
              <TeamInput onAnalyze={(ids) => analyzeTeam(ids, true)} loading={loading} isOurTeam={true} onLoadBothTeams={loadBothTeamsFromMatch} />
              {myTeam && <TeamDashboard team={myTeam} isOurTeam={true} />}
            </div>
            
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-cs2-error to-cs2-warning rounded-full" />
                <h2 className="text-3xl font-bold glow-text text-cs2-error">Équipe Adverse</h2>
              </div>
              <TeamInput onAnalyze={(ids) => analyzeTeam(ids, false)} loading={loading} isOurTeam={false} />
              {enemyTeam && <TeamDashboard team={enemyTeam} isOurTeam={false} />}
            </div>
          </div>
        )}

        {activeTab === 'comparison' && myTeam && enemyTeam && comparison && (
          <AdvancedComparison 
            myTeam={myTeam} 
            enemyTeam={enemyTeam} 
            comparison={comparison} 
          />
        )}

        {activeTab === 'veto' && myTeam && enemyTeam && comparison && (
          <VetoCalculator 
            myTeam={myTeam} 
            enemyTeam={enemyTeam}
            mapRecommendations={comparison.map_recommendations}
          />
        )}
      </div>
    </div>
  );
}

export default App;