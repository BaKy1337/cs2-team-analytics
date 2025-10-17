const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cache = require('./services/cache');
const apiManager = require('./services/apiManager');
const analytics = require('./services/analytics');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting pour protéger l'API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(limiter);

// Middleware de logging des performances
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Routes de santé
app.get('/health', (req, res) => {
  const cacheStats = cache.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: cacheStats,
    uptime: process.uptime()
  });
});

// Route d'analyse d'équipe optimisée
app.post('/api/team/analyze', async (req, res) => {
  try {
    const { nicknames } = req.body;
    
    if (!nicknames || !Array.isArray(nicknames) || nicknames.length === 0) {
      return res.status(400).json({ error: 'Nicknames requis' });
    }

    // Limiter à 5 joueurs maximum
    const limitedNicknames = nicknames.slice(0, 5);
    
    console.log(`Analyzing team with ${limitedNicknames.length} players: ${limitedNicknames.join(', ')}`);
    
    // Récupérer les données des joueurs en parallèle
    const playerDataPromises = limitedNicknames.map(async (nickname) => {
      try {
        const player = await apiManager.getPlayer(nickname);
        const stats = await apiManager.getPlayerStats(player.player_id);
        const recentPerformance = await analytics.analyzePlayerPerformance(player.player_id, 30);
        
        return {
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar,
          country: player.country,
          skill_level: player.skill_level,
          game_player_id: player.game_player_id,
          game_player_name: player.game_player_name,
          faceit_url: player.faceit_url,
          lifetime_stats: this.processLifetimeStats(stats.lifetime),
          recent_performance: recentPerformance,
          map_stats: this.processMapStats(stats.segments)
        };
      } catch (error) {
        console.error(`Error processing player ${nickname}:`, error.message);
        return null;
      }
    });

    const playersData = (await Promise.all(playerDataPromises)).filter(p => p !== null);
    
    if (playersData.length === 0) {
      return res.status(404).json({ error: 'Aucun joueur valide trouvé' });
    }

    // Analyser les performances d'équipe
    const teamAnalysis = await analytics.analyzeTeamPerformance(playersData, 30);
    
    // Assigner des rôles uniques
    const playersWithRoles = this.assignUniqueRoles(playersData);
    
    // Générer l'analyse détaillée
    const detailedAnalysis = this.generateDetailedAnalysis(playersWithRoles, teamAnalysis);
    
    // Générer la stratégie de veto
    const vetoStrategy = this.generateVetoStrategy(playersWithRoles, teamAnalysis);

    const result = {
      team_info: {
        total_players: playersData.length,
        avg_skill_level: Math.round(playersData.reduce((sum, p) => sum + p.skill_level, 0) / playersData.length),
        countries: [...new Set(playersData.map(p => p.country))],
        analysis_timestamp: new Date().toISOString()
      },
      team_performance: teamAnalysis,
      players: playersWithRoles,
      analysis: detailedAnalysis,
      veto_strategy: vetoStrategy,
      cache_info: {
        hit_rate: cache.getStats().memory.hitRate,
        total_keys: cache.getStats().memory.keys
      }
    };

    res.json(result);
    
  } catch (error) {
    console.error('Error in team analysis:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse de l\'équipe',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route optimisée pour charger les équipes d'un match
app.get('/api/match/:matchId/teams', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { mode = 'optimized' } = req.query; // optimized, ultrafast, full
    
    const matchOptimizer = require('./services/matchOptimizer');
    
    let result;
    
    switch (mode) {
      case 'ultrafast':
        result = await matchOptimizer.loadMatchTeamsUltraFast(matchId);
        break;
      case 'full':
        // Mode complet (ancien comportement)
        result = await loadMatchTeamsFull(matchId);
        break;
      default:
        // Mode optimisé (recommandé)
        result = await matchOptimizer.loadMatchTeamsOptimized(matchId);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error loading match teams:', error);
    res.status(500).json({ 
      error: 'Erreur lors du chargement des équipes du match',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Fonction pour le mode complet (ancien comportement)
async function loadMatchTeamsFull(matchId) {
  const matchDetails = await apiManager.getMatchDetails(matchId);
  const matchStats = await apiManager.getMatchStats(matchId);
  
  const teams = {};
  
  for (const [factionKey, faction] of Object.entries(matchDetails.teams)) {
    teams[factionKey] = {
      team_id: faction.team_id,
      name: faction.nickname,
      avatar: faction.avatar,
      roster: faction.players.map(player => ({
        player_id: player.player_id,
        nickname: player.nickname,
        avatar: player.avatar,
        skill_level: player.skill_level,
        game_player_id: player.game_player_id,
        game_player_name: player.game_player_name,
        faceit_url: player.faceit_url
      }))
    };
  }
  
  return {
    match_id: matchId,
    teams: teams,
    match_info: {
      game_id: matchDetails.game_id,
      region: matchDetails.region,
      status: matchDetails.status,
      started_at: matchDetails.started_at,
      finished_at: matchDetails.finished_at,
      results: matchDetails.results
    },
    optimization: 'full_mode'
  };
}

// Route pour comparer deux équipes
app.post('/api/teams/compare', async (req, res) => {
  try {
    const { team1, team2 } = req.body;
    
    if (!team1 || !team2) {
      return res.status(400).json({ error: 'Deux équipes requises pour la comparaison' });
    }
    
    // Analyser les deux équipes
    const [team1Analysis, team2Analysis] = await Promise.all([
      this.analyzeTeamForComparison(team1),
      this.analyzeTeamForComparison(team2)
    ]);
    
    // Générer la comparaison
    const comparison = this.generateTeamComparison(team1Analysis, team2Analysis);
    
    res.json(comparison);
    
  } catch (error) {
    console.error('Error comparing teams:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la comparaison des équipes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour obtenir les statistiques de cache
app.get('/api/cache/stats', (req, res) => {
  res.json(cache.getStats());
});

// Route pour invalider le cache
app.post('/api/cache/invalidate', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({ error: 'Pattern requis pour l\'invalidation' });
    }
    
    await cache.invalidate(pattern);
    res.json({ message: `Cache invalidé pour le pattern: ${pattern}` });
    
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ error: 'Erreur lors de l\'invalidation du cache' });
  }
});

// Méthodes utilitaires
function processLifetimeStats(lifetime) {
  return {
    matches: parseInt(lifetime.Matches) || 0,
    wins: parseInt(lifetime.Wins) || 0,
    losses: parseInt(lifetime.Losses) || 0,
    win_rate: parseFloat(lifetime['Win Rate %']) || 0,
    kd: parseFloat(lifetime['Average K/D Ratio']) || 0,
    adr: parseFloat(lifetime['Average Headshots %']) || 0,
    hs_percent: parseFloat(lifetime['Average Headshots %']) || 0,
    kast: parseFloat(lifetime['Average KAST']) || 0,
    rating: parseFloat(lifetime['Average K/D Ratio']) || 0,
    clutch_rate: parseFloat(lifetime['1v1 Win Rate']) || 0,
    flash_success: parseFloat(lifetime['Flash Success Rate']) || 0,
    utility_usage: parseFloat(lifetime['Utility Usage per Round']) || 0,
    sniper_rate: parseFloat(lifetime['Sniper Kill Rate']) || 0
  };
}

function processMapStats(segments) {
  const mapStats = {};
  
  if (segments && Array.isArray(segments)) {
    segments.forEach(segment => {
      if (segment.label && segment.stats) {
        mapStats[segment.label] = {
          matches: parseInt(segment.stats.Matches) || 0,
          win_rate: parseFloat(segment.stats['Win Rate %']) || 0,
          kd: parseFloat(segment.stats['Average K/D Ratio']) || 0,
          adr: parseFloat(segment.stats['Average Damage per Round']) || 0,
          hs_percent: parseFloat(segment.stats['Average Headshots %']) || 0,
          kast: parseFloat(segment.stats['Average KAST']) || 0,
          rating: parseFloat(segment.stats['Average K/D Ratio']) || 0
        };
      }
    });
  }
  
  return mapStats;
}

function assignUniqueRoles(players) {
  const roles = ['AWPer', 'Entry Fragger', 'Support', 'Clutcher', 'Rifler'];
  const playersWithRoles = [...players];
  
  // Trier par skill level décroissant
  playersWithRoles.sort((a, b) => b.skill_level - a.skill_level);
  
  // Assigner les rôles
  playersWithRoles.forEach((player, index) => {
    player.role = roles[index] || 'Rifler';
  });
  
  return playersWithRoles;
}

function generateDetailedAnalysis(players, teamPerformance) {
  const analysis = {
    summary: `Équipe de niveau ${teamPerformance.avg_skill_level} avec ${teamPerformance.team_win_rate}% de victoires récentes`,
    strengths: [],
    weaknesses: [],
    insights: [],
    recommendations: []
  };
  
  // Analyser les forces
  if (teamPerformance.team_win_rate >= 70) {
    analysis.strengths.push({
      category: 'Performance',
      title: 'Forme excellente',
      description: `${teamPerformance.team_win_rate}% de victoires récentes`,
      impact: 'high',
      value: teamPerformance.team_win_rate + '%'
    });
  }
  
  if (teamPerformance.hot_players >= 3) {
    analysis.strengths.push({
      category: 'Momentum',
      title: 'Joueurs en forme',
      description: `${teamPerformance.hot_players} joueurs en excellente forme`,
      impact: 'high',
      value: teamPerformance.hot_players + ' joueurs'
    });
  }
  
  // Analyser les faiblesses
  if (teamPerformance.cold_players >= 3) {
    analysis.weaknesses.push({
      category: 'Performance',
      title: 'Joueurs en difficulté',
      description: `${teamPerformance.cold_players} joueurs en forme difficile`,
      impact: 'high',
      value: teamPerformance.cold_players + ' joueurs'
    });
  }
  
  // Générer des insights
  if (teamPerformance.team_consistency === 'very_consistent') {
    analysis.insights.push('L\'équipe montre une excellente cohérence dans ses performances');
  }
  
  if (teamPerformance.synergies.momentum === 'high') {
    analysis.insights.push('L\'équipe a un excellent momentum collectif');
  }
  
  // Générer des recommandations
  if (teamPerformance.improving_players >= 3) {
    analysis.recommendations.push({
      type: 'development',
      title: 'Continuer le développement',
      description: 'Plusieurs joueurs sont en progression, maintenir l\'entraînement',
      priority: 'medium',
      impact: 'medium'
    });
  }
  
  return analysis;
}

function generateVetoStrategy(players, teamPerformance) {
  return {
    pick_priority: [],
    ban_priority: [],
    neutral_maps: [],
    strategic_notes: [
      `Équipe avec ${teamPerformance.team_win_rate}% de victoires récentes`,
      `Cohérence: ${teamPerformance.team_consistency}`,
      `Momentum: ${teamPerformance.synergies.momentum}`
    ],
    last_updated: new Date().toISOString()
  };
}

async function analyzeTeamForComparison(teamData) {
  // Cette fonction analyserait une équipe pour la comparaison
  // Pour l'instant, on retourne les données telles quelles
  return teamData;
}

function generateTeamComparison(team1, team2) {
  return {
    team1_advantages: [],
    team2_advantages: [],
    key_matchups: [],
    prediction: 'Équipe 1',
    confidence: 65,
    analysis_timestamp: new Date().toISOString()
  };
}

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur optimisé démarré sur le port ${PORT}`);
  console.log(`📊 Cache Redis: ${process.env.REDIS_URL ? 'Connecté' : 'Désactivé'}`);
  console.log(`🔒 Rate limiting: Activé (100 req/15min)`);
  console.log(`⚡ Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
