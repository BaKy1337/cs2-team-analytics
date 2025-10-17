import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';
import ModernNavigation from './components/layout/ModernNavigation';
import ModernTeamInput from './components/inputs/ModernTeamInput';
import ModernTeamDashboard from './components/dashboard/ModernTeamDashboard';
import ModernCard from './components/ui/ModernCard';
import ModernButton from './components/ui/ModernButton';
import { AlertCircle, Loader2 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myTeam, setMyTeam] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeTeam = async (nicknames) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.analyzeTeam(nicknames);
      setMyTeam(response);
    } catch (error) {
      setError('Erreur lors de l\'analyse de l\'équipe: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadBothTeamsFromMatch = async (ourTeamNicknames, enemyTeamNicknames, matchData) => {
    setLoading(true);
    setError('');
    
    try {
      // Analyser notre équipe
      const ourTeamResponse = await api.analyzeTeam(ourTeamNicknames);
      setMyTeam(ourTeamResponse);
      
      // Analyser l'équipe adverse
      const enemyTeamResponse = await api.analyzeTeam(enemyTeamNicknames);
      setEnemyTeam(enemyTeamResponse);
      
      // Comparer les équipes
      const comparisonResponse = await api.compareTeams(ourTeamResponse, enemyTeamResponse);
      setComparison(comparisonResponse);
      
      // Rester sur le dashboard pour voir les stats globales
      setActiveTab('dashboard');
    } catch (error) {
      setError('Erreur lors du chargement des équipes: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Inputs des équipes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModernTeamInput
                onAnalyze={analyzeTeam}
                loading={loading}
                isOurTeam={true}
                onLoadBothTeams={loadBothTeamsFromMatch}
              />
              <ModernTeamInput
                onAnalyze={(nicknames) => {
                  setLoading(true);
                  setError('');
                  api.analyzeTeam(nicknames)
                    .then(response => {
                      setEnemyTeam(response);
                      if (myTeam) {
                        api.compareTeams(myTeam, response)
                          .then(comparisonResponse => setComparison(comparisonResponse));
                      }
                    })
                    .catch(error => setError('Erreur lors de l\'analyse de l\'équipe adverse: ' + (error.response?.data?.error || error.message)))
                    .finally(() => setLoading(false));
                }}
                loading={loading}
                isOurTeam={false}
              />
            </div>

            {/* Dashboard des équipes */}
            {myTeam && (
              <ModernTeamDashboard team={myTeam} />
            )}

            {enemyTeam && (
              <ModernTeamDashboard team={enemyTeam} />
            )}

            {/* Comparaison */}
            {comparison && (
              <ModernCard variant="elevated">
                <div className="card-header">
                  <h2 className="card-title">Comparaison des Équipes</h2>
                </div>
                <div className="space-y-4">
                  {comparison.overall_analysis && (
                    <div>
                      <h3 className="font-semibold text-text-primary mb-2">Analyse Globale</h3>
                      <p className="text-text-secondary text-sm">{comparison.overall_analysis}</p>
                    </div>
                  )}
                  
                  {comparison.key_differences && comparison.key_differences.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-text-primary mb-2">Différences Clés</h3>
                      <ul className="space-y-1">
                        {comparison.key_differences.map((diff, i) => (
                          <li key={i} className="text-sm text-text-secondary">• {diff}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ModernCard>
            )}
          </div>
        );

      case 'comparison':
        return (
          <ModernCard>
            <div className="text-center py-12">
              <div className="text-text-tertiary">
                <p>Fonctionnalité de comparaison en développement</p>
              </div>
            </div>
          </ModernCard>
        );

      case 'analysis':
        return (
          <ModernCard>
            <div className="text-center py-12">
              <div className="text-text-tertiary">
                <p>Analyse tactique en développement</p>
              </div>
            </div>
          </ModernCard>
        );

      case 'map-pool':
        return (
          <ModernCard>
            <div className="text-center py-12">
              <div className="text-text-tertiary">
                <p>Performance des cartes en développement</p>
              </div>
            </div>
          </ModernCard>
        );

      case 'settings':
        return (
          <ModernCard>
            <div className="text-center py-12">
              <div className="text-text-tertiary">
                <p>Paramètres en développement</p>
              </div>
            </div>
          </ModernCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <ModernNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="section">
        <div className="container">
          {/* Erreur globale */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-error-500/10 border border-error-500/20 rounded-lg flex items-center gap-3 text-error-500"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setError('')}
                  className="ml-auto"
                >
                  Fermer
                </ModernButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading global */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <ModernCard className="text-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
                <p className="text-text-secondary">Analyse en cours...</p>
              </ModernCard>
            </motion.div>
          )}

          {/* Contenu principal */}
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
        </div>
      </main>
    </div>
  );
}

export default App;
