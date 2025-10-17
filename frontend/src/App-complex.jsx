import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Dashboard components
import DashboardOverview from './components/dashboard/DashboardOverview';
import TeamInput from './components/TeamInput';
import TeamDashboard from './components/TeamDashboard';
import AdvancedComparison from './components/AdvancedComparison';
import VetoCalculator from './components/VetoCalculator';

// UI components
import { LoadingSpinner, EmptyState } from './components/ui/LoadingStates';
import { Users, BarChart3, Swords, Target, Map, Settings } from 'lucide-react';

// Services
import { api } from './services/api';

// Styles
import './styles/design-system-v2.css';

const App = () => {
  // État principal
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Données des équipes
  const [myTeam, setMyTeam] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState(null);
  const [comparison, setComparison] = useState(null);

  // État de l'application
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(new Date());

  // Gestion de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Analyse d'une équipe
  const handleAnalyzeTeam = async (nicknames, isOurTeam = true) => {
    setLoading(true);
    setError(null);

    try {
      const teamData = await api.analyzeTeam(nicknames);
      
      if (isOurTeam) {
        setMyTeam(teamData);
      } else {
        setEnemyTeam(teamData);
      }
      
      setLastSync(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'analyse de l\'équipe');
      console.error('Error analyzing team:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chargement des deux équipes depuis un match
  const handleLoadBothTeams = async (ourTeamNicknames, enemyTeamNicknames) => {
    setLoading(true);
    setError(null);

    try {
      const [ourTeamData, enemyTeamData] = await Promise.all([
        api.analyzeTeam(ourTeamNicknames),
        api.analyzeTeam(enemyTeamNicknames)
      ]);

      setMyTeam(ourTeamData);
      setEnemyTeam(enemyTeamData);

      // Générer la comparaison automatiquement
      const comparisonData = await api.compareTeams(ourTeamData, enemyTeamData);
      setComparison(comparisonData);

      setLastSync(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des équipes');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Comparaison d'équipes
  const handleCompareTeams = async () => {
    if (!myTeam || !enemyTeam) {
      setError('Veuillez charger les deux équipes avant de les comparer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const comparisonData = await api.compareTeams(myTeam, enemyTeam);
      setComparison(comparisonData);
      setActiveTab('comparison');
      setLastSync(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la comparaison');
      console.error('Error comparing teams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rendu du contenu principal
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Analyse en cours..." />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            myTeam={myTeam}
            enemyTeam={enemyTeam}
            onAnalyzeTeam={handleAnalyzeTeam}
            onCompareTeams={handleCompareTeams}
          />
        );

      case 'teams':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Notre équipe</h2>
                <TeamInput
                  onAnalyze={(nicknames) => handleAnalyzeTeam(nicknames, true)}
                  loading={loading}
                  isOurTeam={true}
                  onLoadBothTeams={handleLoadBothTeams}
                />
                {myTeam && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <TeamDashboard team={myTeam} />
                  </motion.div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Équipe adverse</h2>
                <TeamInput
                  onAnalyze={(nicknames) => handleAnalyzeTeam(nicknames, false)}
                  loading={loading}
                  isOurTeam={false}
                />
                {enemyTeam && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <TeamDashboard team={enemyTeam} />
                  </motion.div>
                )}
              </div>
            </div>

            {myTeam && enemyTeam && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <button
                  onClick={handleCompareTeams}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Comparer les équipes
                </button>
              </motion.div>
            )}
          </div>
        );

      case 'comparison':
        if (!myTeam || !enemyTeam) {
          return (
            <EmptyState
              icon={Swords}
              title="Aucune comparaison disponible"
              description="Veuillez charger les deux équipes pour pouvoir les comparer."
              action={() => setActiveTab('teams')}
              actionText="Charger les équipes"
            />
          );
        }

        return (
          <AdvancedComparison
            myTeam={myTeam}
            enemyTeam={enemyTeam}
            comparison={comparison}
          />
        );

      case 'analysis':
        return (
          <EmptyState
            icon={Target}
            title="Analyse tactique"
            description="Cette section contiendra des analyses tactiques avancées et des recommandations stratégiques."
            action={() => setActiveTab('teams')}
            actionText="Commencer l'analyse"
          />
        );

      case 'maps':
        return (
          <EmptyState
            icon={Map}
            title="Map Pool"
            description="Analysez les performances de votre équipe sur différentes cartes et optimisez votre stratégie de veto."
            action={() => setActiveTab('teams')}
            actionText="Analyser les maps"
          />
        );

      case 'performance':
        return (
          <EmptyState
            icon={BarChart3}
            title="Performance"
            description="Visualisez les métriques détaillées et l'évolution des performances de votre équipe."
            action={() => setActiveTab('teams')}
            actionText="Voir les performances"
          />
        );

      case 'settings':
        return (
          <EmptyState
            icon={Settings}
            title="Paramètres"
            description="Configurez vos préférences et personnalisez l'expérience d'analyse."
            actionText="Configurer"
          />
        );

      default:
        return (
          <EmptyState
            icon={Users}
            title="Page non trouvée"
            description="La page que vous recherchez n'existe pas."
            action={() => setActiveTab('dashboard')}
            actionText="Retour au dashboard"
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Contenu principal */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
          {/* Header */}
          <Header
            isOnline={isOnline}
            lastSync={lastSync}
            onRefresh={() => setLastSync(new Date())}
          />

          {/* Contenu */}
          <main className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151'
          }
        }}
      />

      {/* Gestion des erreurs */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default App;
