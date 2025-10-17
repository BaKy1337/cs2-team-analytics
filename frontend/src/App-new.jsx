import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/layout/Navigation';
import TeamOverview from './components/dashboard/TeamOverview';
import TeamComparison from './components/comparison/TeamComparison';
import PerformanceRadar from './components/charts/PerformanceRadar';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Settings,
  Zap,
  Loader2
} from 'lucide-react';
import './styles/design-system.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myTeam, setMyTeam] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simuler des données pour la démonstration
  useEffect(() => {
    // Simuler le chargement de données
    const loadDemoData = async () => {
      setLoading(true);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Données de démonstration
      const demoTeam = {
        players: [
          { nickname: 'FARIDZ', skill_level: 10, role: 'AWPer' },
          { nickname: 'Cugiiii', skill_level: 10, role: 'Entry Fragger' },
          { nickname: 'MelMA', skill_level: 10, role: 'Support' },
          { nickname: 'Tomassenz', skill_level: 10, role: 'Clutcher' },
          { nickname: 'deratisatioN', skill_level: 10, role: 'Rifler' }
        ],
        avg_skill_level: 10,
        avg_win_rate: 65,
        recent_performance: {
          team_win_rate: 70,
          team_kd: 1.15,
          team_adr: 85,
          team_hs_percent: 45,
          team_kast: 75,
          team_rating: 1.2,
          team_consistency: 'consistent',
          hot_players: 3,
          cold_players: 1,
          improving_players: 2,
          synergies: {
            momentum: 'high',
            development: 'medium',
            balance: 'balanced'
          }
        }
      };
      
      setMyTeam(demoTeam);
      setLoading(false);
    };
    
    loadDemoData();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setError(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <TeamOverview 
              teamData={myTeam} 
              recentPerformance={myTeam?.recent_performance} 
            />
            
            {myTeam?.recent_performance && (
              <PerformanceRadar 
                data={myTeam.recent_performance}
                title="Profil de performance de l'équipe"
              />
            )}
          </div>
        );
        
      case 'analysis':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Analyse détaillée</Card.Title>
                <Card.Subtitle>
                  Analyse approfondie des performances et tendances
                </Card.Subtitle>
              </Card.Header>
              
              <Card.Content>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-cs2-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Analyse en cours de développement
                  </h3>
                  <p className="text-cs2-gray-light">
                    Cette section contiendra une analyse détaillée des performances
                  </p>
                </div>
              </Card.Content>
            </Card>
          </div>
        );
        
      case 'comparison':
        return (
          <TeamComparison 
            team1={myTeam}
            team2={enemyTeam}
            comparison={comparison}
          />
        );
        
      case 'strategy':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Stratégies de veto</Card.Title>
                <Card.Subtitle>
                  Recommandations tactiques et stratégies de map
                </Card.Subtitle>
              </Card.Header>
              
              <Card.Content>
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-cs2-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Stratégies en cours de développement
                  </h3>
                  <p className="text-cs2-gray-light">
                    Cette section contiendra les stratégies de veto et recommandations tactiques
                  </p>
                </div>
              </Card.Content>
            </Card>
          </div>
        );
        
      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Paramètres</Card.Title>
                <Card.Subtitle>
                  Configuration de l'application et préférences
                </Card.Subtitle>
              </Card.Header>
              
              <Card.Content>
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-cs2-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Paramètres en cours de développement
                  </h3>
                  <p className="text-cs2-gray-light">
                    Cette section contiendra les paramètres et la configuration
                  </p>
                </div>
              </Card.Content>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cs2-dark via-cs2-dark-light to-cs2-dark">
      <div className="flex h-screen">
        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Contenu principal */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'analysis' && 'Analyse'}
                  {activeTab === 'comparison' && 'Comparaison'}
                  {activeTab === 'strategy' && 'Stratégie'}
                  {activeTab === 'settings' && 'Paramètres'}
                </h1>
                <p className="text-cs2-gray-light">
                  {activeTab === 'dashboard' && 'Vue d\'ensemble de votre équipe'}
                  {activeTab === 'analysis' && 'Analyse détaillée des performances'}
                  {activeTab === 'comparison' && 'Comparaison entre équipes'}
                  {activeTab === 'strategy' && 'Stratégies et recommandations'}
                  {activeTab === 'settings' && 'Configuration de l\'application'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4" />
                  Charger équipe
                </Button>
                <Button variant="primary" size="sm">
                  <Zap className="w-4 h-4" />
                  Analyser
                </Button>
              </div>
            </div>
            
            {/* Contenu avec animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-cs2-primary animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Chargement des données...
                      </h3>
                      <p className="text-cs2-gray-light">
                        Analyse des performances en cours
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <Card>
                    <Card.Content>
                      <div className="text-center py-12">
                        <div className="text-cs2-error text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Erreur de chargement
                        </h3>
                        <p className="text-cs2-gray-light mb-4">
                          {error}
                        </p>
                        <Button 
                          variant="primary" 
                          onClick={() => window.location.reload()}
                        >
                          Recharger la page
                        </Button>
                      </div>
                    </Card.Content>
                  </Card>
                ) : (
                  renderContent()
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
