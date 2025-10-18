import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cs2-team-analytics.onrender.com/api';

// Configuration axios avec timeout et gestion d'erreur
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: Le serveur met trop de temps à répondre');
    }
    if (error.response) {
      throw new Error(`Erreur serveur: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
    }
    if (error.request) {
      throw new Error('Erreur réseau: Impossible de contacter le serveur');
    }
    throw new Error('Erreur inconnue');
  }
);

export const api = {
  analyzeTeam: async (nicknames) => {
    const response = await apiClient.post('/team/analyze', { nicknames });
    return response.data;
  },

  compareTeams: async (team1, team2) => {
    const response = await apiClient.post('/team/compare', { team1, team2 });
    return response.data;
  },

  getMatchData: async (matchId) => {
    const response = await apiClient.post('/match/get', { match_id: matchId });
    return response.data;
  },

  loadMatchTeams: async (matchId, mode = 'optimized') => {
    const response = await apiClient.get(`/match/${matchId}/teams?mode=${mode}`);
    return response.data;
  },

  // Charger les équipes d'un match (mode ultra-rapide)
  loadMatchTeamsUltraFast: async (matchId) => {
    const response = await apiClient.get(`/match/${matchId}/teams?mode=ultrafast`);
    return response.data;
  },

  // Charger les équipes d'un match (mode complet)
  loadMatchTeamsFull: async (matchId) => {
    const response = await apiClient.get(`/match/${matchId}/teams?mode=full`);
    return response.data;
  },

  getPlayerHistory: async (playerId, limit = 20) => {
    const response = await apiClient.post('/player/history', { player_id: playerId, limit });
    return response.data;
  },

  getTacticalAnalysis: async (team1, team2) => {
    const response = await apiClient.post('/team/tactical-analysis', { team1, team2 });
    return response.data;
  },

  // Test de connectivité
  testConnection: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};