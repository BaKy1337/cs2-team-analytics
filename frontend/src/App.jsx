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
      {/* Header Premium avec nouveau design system */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cs2-orange/20 to-cs2-accent/20 blur-3xl" />
        <div className="relative navbar glass-effect shadow-2xl border-b border-gray-800">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-cs2-orange to-cs2-accent rounded-lg">
                  <Shield className="text-white" size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gradient">
                  ESEA HELPER BY BAKY
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="badge badge-primary animate-pulse">
                <Zap size={14} className="mr-1" />
                LIVE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Premium avec nouveau design system */}
      <div className="section-sm">
        <div className="container mx-auto">
          <div className="flex justify-center">
            <div className="flex bg-cs2-card rounded-xl p-2 border border-gray-800 shadow-lg">
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
                    btn flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                    ${activeTab === tab.id 
                      ? 'btn-primary shadow-lg' 
                      : 'btn-ghost'
                    }
                    ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover-lift'}
                  `}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content avec nouveau design system */}
      <div className="section">
        <div className="container mx-auto">
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <div className="animate-slide-in">
                <div className="card card-elevated">
                  <div className="card-header">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-cs2-success to-cs2-blue rounded-full" />
                      <h2 className="card-title text-cs2-success">Notre Équipe</h2>
                    </div>
                  </div>
                  <div className="card-body space-y-6">
                    <TeamInput onAnalyze={(ids) => analyzeTeam(ids, true)} loading={loading} isOurTeam={true} onLoadBothTeams={loadBothTeamsFromMatch} />
                    {myTeam && <TeamDashboard team={myTeam} isOurTeam={true} />}
                  </div>
                </div>
              </div>
              
              <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <div className="card card-elevated">
                  <div className="card-header">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-cs2-error to-cs2-warning rounded-full" />
                      <h2 className="card-title text-cs2-error">Équipe Adverse</h2>
                    </div>
                  </div>
                  <div className="card-body space-y-6">
                    <TeamInput onAnalyze={(ids) => analyzeTeam(ids, false)} loading={loading} isOurTeam={false} />
                    {enemyTeam && <TeamDashboard team={enemyTeam} isOurTeam={false} />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && myTeam && enemyTeam && comparison && (
            <div className="animate-fade-in">
              <AdvancedComparison 
                myTeam={myTeam} 
                enemyTeam={enemyTeam} 
                comparison={comparison} 
              />
            </div>
          )}

          {activeTab === 'veto' && myTeam && enemyTeam && comparison && (
            <div className="animate-fade-in">
              <VetoCalculator 
                myTeam={myTeam} 
                enemyTeam={enemyTeam}
                mapRecommendations={comparison.map_recommendations}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;