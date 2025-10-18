import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://cs2-team-analytics.onrender.com/api'
  : 'http://localhost:5000/api';

export const api = {
  analyzeTeam: async (nicknames) => {
    const response = await axios.post(`${API_BASE_URL}/team/analyze`, { nicknames });
    return response.data;
  },

  compareTeams: async (team1, team2) => {
    const response = await axios.post(`${API_BASE_URL}/team/compare`, { team1, team2 });
    return response.data;
  },

  getMatchData: async (matchId) => {
    const response = await axios.post(`${API_BASE_URL}/match/get`, { match_id: matchId });
    return response.data;
  },

  loadMatchTeams: async (matchId, mode = 'optimized') => {
    const response = await axios.get(`${API_BASE_URL}/match/${matchId}/teams?mode=${mode}`);
    return response.data;
  },

  // Charger les équipes d'un match (mode ultra-rapide)
  loadMatchTeamsUltraFast: async (matchId) => {
    const response = await axios.get(`${API_BASE_URL}/match/${matchId}/teams?mode=ultrafast`);
    return response.data;
  },

  // Charger les équipes d'un match (mode complet)
  loadMatchTeamsFull: async (matchId) => {
    const response = await axios.get(`${API_BASE_URL}/match/${matchId}/teams?mode=full`);
    return response.data;
  },

  getPlayerHistory: async (playerId, limit = 20) => {
    const response = await axios.post(`${API_BASE_URL}/player/history`, { player_id: playerId, limit });
    return response.data;
  },

  getTacticalAnalysis: async (team1, team2) => {
    const response = await axios.post(`${API_BASE_URL}/team/tactical-analysis`, { team1, team2 });
    return response.data;
  }
};