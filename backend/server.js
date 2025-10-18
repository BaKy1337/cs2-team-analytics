const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const SimpleDataEnricher = require('./services/simpleDataEnricher');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cors: 'configured',
    api_url: 'https://cs2-team-analytics.onrender.com'
  });
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://cs2-team-analytics-git-main-baky1337s-projects.vercel.app', // TON URL Vercel
    'https://cs2-team-analytics-px3tx4qdx-baky1337s-projects.vercel.app', // Tous les preview deployments
    'https://esea-helper-by-baky.vercel.app', // URL de production
    'https://*.vercel.app' // Tous les sous-domaines Vercel
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
const FACEIT_BASE_URL = 'https://open.faceit.com/data/v4';

const headers = {
  'Authorization': `Bearer ${FACEIT_API_KEY}`,
  'Accept': 'application/json'
};

// Fonction helper pour calculer les rôles avec plus de précision
function detectRole(stats) {
  const entryRate = parseFloat(stats['Entry Rate']) || 0;
  const entrySuccess = parseFloat(stats['Entry Success Rate']) || 0;
  const sniperKillRate = parseFloat(stats['Sniper Kill Rate']) || 0;
  const avgAssists = parseFloat(stats['Average Assists']) || 0;
  const clutchRate = parseFloat(stats['1v1 Win Rate']) || 0;
  const flashSuccessRate = parseFloat(stats['Flash Success Rate']) || 0;
  const utilityUsage = parseFloat(stats['Utility Usage per Round']) || 0;
  const kd = parseFloat(stats['Average K/D Ratio']) || 0;
  const adr = parseFloat(stats.ADR) || 0;
  const hsPercent = parseFloat(stats['Average Headshots %']) || 0;

  // Score pondéré pour chaque rôle avec plus de critères
  const scores = {
    AWPer: (sniperKillRate * 100) + (hsPercent * 0.5) + (kd * 10),
    'Entry Fragger': (entryRate * 50) + (entrySuccess * 30) + (adr * 0.8) + (kd * 15),
    Support: (avgAssists * 5) + (flashSuccessRate * 20) + (utilityUsage * 30) + (clutchRate * 20),
    Clutcher: (clutchRate * 80) + (kd * 8) + (hsPercent * 0.3),
    Rifler: (kd * 12) + (adr * 0.6) + (hsPercent * 0.4) // Joueur polyvalent
  };

  const maxRole = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );

  return maxRole;
}

// Nouvelle fonction pour assigner des rôles uniques à une équipe
function assignUniqueRoles(playersData) {
  // Calculer les scores de rôle pour chaque joueur
  const playersWithScores = playersData.map(player => {
    const stats = player.stats;
    const entryRate = stats.entry_rate || 0;
    const entrySuccess = stats.entry_success || 0;
    const sniperRate = stats.sniper_rate || 0;
    const clutchRate = stats.clutch_rate || 0;
    const kd = stats.kd || 0;
    const adr = stats.adr || 0;
    const hsPercent = stats.hs_percent || 0;
    const consistency = player.consistency || 0;

    // Scores détaillés pour chaque rôle
    const roleScores = {
      AWPer: {
        score: (sniperRate * 100) + (hsPercent * 0.5) + (kd * 10) + (consistency * 0.3),
        priority: 1, // Priorité haute pour l'AWPer
        description: 'Sniper principal, précision élevée'
      },
      'Entry Fragger': {
        score: (entryRate * 50) + (entrySuccess * 30) + (adr * 0.8) + (kd * 15),
        priority: 2,
        description: 'Premier contact, agressivité'
      },
      Clutcher: {
        score: (clutchRate * 80) + (kd * 8) + (hsPercent * 0.3) + (consistency * 0.4),
        priority: 3,
        description: 'Situations difficiles, sang-froid'
      },
      Support: {
        score: (stats.flash_success * 20) + (stats.utility_usage * 30) + (clutchRate * 20) + (consistency * 0.5),
        priority: 4,
        description: 'Utilitaires, assistance équipe'
      },
      Rifler: {
        score: (kd * 12) + (adr * 0.6) + (hsPercent * 0.4) + (consistency * 0.2),
        priority: 5,
        description: 'Polyvalent, équilibre'
      }
    };

    return {
      ...player,
      roleScores,
      bestRole: Object.keys(roleScores).reduce((a, b) => 
        roleScores[a].score > roleScores[b].score ? a : b
      )
    };
  });

  // Assigner les rôles de manière unique
  const assignedRoles = new Set();
  const finalPlayers = [];

  // Trier par priorité des rôles (AWPer en premier, etc.)
  const rolePriority = ['AWPer', 'Entry Fragger', 'Clutcher', 'Support', 'Rifler'];

  for (const role of rolePriority) {
    // Trouver le meilleur joueur pour ce rôle qui n'a pas encore de rôle assigné
    let bestPlayer = null;
    let bestScore = -1;

    for (const player of playersWithScores) {
      if (!assignedRoles.has(player.nickname) && player.roleScores[role].score > bestScore) {
        bestPlayer = player;
        bestScore = player.roleScores[role].score;
      }
    }

    if (bestPlayer) {
      assignedRoles.add(bestPlayer.nickname);
      finalPlayers.push({
        ...bestPlayer,
        role: role,
        roleConfidence: Math.round((bestScore / 200) * 100), // Score de confiance 0-100
        roleDescription: bestPlayer.roleScores[role].description
      });
    }
  }

  // Assigner les rôles restants aux joueurs non assignés
  for (const player of playersWithScores) {
    if (!assignedRoles.has(player.nickname)) {
      assignedRoles.add(player.nickname);
      finalPlayers.push({
        ...player,
        role: player.bestRole,
        roleConfidence: Math.round((player.roleScores[player.bestRole].score / 200) * 100),
        roleDescription: player.roleScores[player.bestRole].description
      });
    }
  }

  return finalPlayers;
}

// Calculer la consistance d'un joueur (variance des performances)
function calculateConsistency(mapStats) {
  if (mapStats.length === 0) return 0;
  
  const kdValues = mapStats.map(m => parseFloat(m.stats['Average K/D Ratio']) || 0);
  const mean = kdValues.reduce((a, b) => a + b, 0) / kdValues.length;
  const variance = kdValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / kdValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Score de consistance inversé (moins de variance = plus consistent)
  const consistencyScore = Math.max(0, 100 - (stdDev * 50));
  return Math.round(consistencyScore);
}

// Analyser la forme récente à partir des Recent Results
function analyzeRecentForm(recentResults) {
  if (!recentResults || recentResults.length === 0) {
    return { streak: 0, trend: 'neutral', wins: 0, losses: 0 };
  }

  const wins = recentResults.filter(r => r === '1').length;
  const losses = recentResults.length - wins;
  
  // Calculer la streak
  let streak = 0;
  const lastResult = recentResults[0];
  for (let result of recentResults) {
    if (result === lastResult) streak++;
    else break;
  }
  
  if (lastResult === '0') streak = -streak;

  // Tendance (weighted vers les matchs récents)
  let trendScore = 0;
  recentResults.forEach((result, idx) => {
    const weight = recentResults.length - idx;
    trendScore += (result === '1' ? 1 : -1) * weight;
  });

  let trend = 'neutral';
  if (trendScore > 3) trend = 'hot';
  else if (trendScore < -3) trend = 'cold';

  return { streak, trend, wins, losses, winRate: ((wins / recentResults.length) * 100).toFixed(0) };
}

// Fonction pour trouver les stats d'un joueur dans les données d'un match
function findPlayerStatsInMatch(matchStatsData, playerId) {
  try {
    // Chercher dans les rounds
    if (matchStatsData.rounds && matchStatsData.rounds.length > 0) {
      for (const round of matchStatsData.rounds) {
        if (round.teams) {
          for (const team of Object.values(round.teams)) {
            if (team.players) {
              for (const player of team.players) {
                if (player.player_id === playerId) {
                  return {
                    Kills: player.player_stats?.Kills || 0,
                    Deaths: player.player_stats?.Deaths || 0,
                    ADR: player.player_stats?.ADR || 0,
                    Headshots: player.player_stats?.Headshots || 0,
                    Assists: player.player_stats?.Assists || 0,
                    Rounds: player.player_stats?.Rounds || 0
                  };
                }
              }
            }
          }
        }
      }
    }
    
    // Fallback: chercher dans les teams directement
    if (matchStatsData.teams) {
      for (const team of Object.values(matchStatsData.teams)) {
        if (team.players) {
          for (const player of team.players) {
            if (player.player_id === playerId) {
              return {
                Kills: player.player_stats?.Kills || 0,
                Deaths: player.player_stats?.Deaths || 0,
                ADR: player.player_stats?.ADR || 0,
                Headshots: player.player_stats?.Headshots || 0,
                Assists: player.player_stats?.Assists || 0,
                Rounds: player.player_stats?.Rounds || 0
              };
            }
          }
        }
      }
    }
    
    return {};
  } catch (error) {
    console.error(`Error finding player stats in match:`, error.message);
    return {};
  }
}

// Calculer les stats récentes (30 derniers jours, 30 matchs max)
async function calculateRecentStats(playerId, headers) {
  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const now = Math.floor(Date.now() / 1000);
    
    // Récupérer l'historique des 30 derniers jours
    const historyResponse = await axios.get(`${FACEIT_BASE_URL}/players/${playerId}/history`, {
      headers,
      params: { 
        game: 'cs2', 
        from: thirtyDaysAgo, 
        to: now, 
        offset: 0, 
        limit: 30 
      }
    });

    const matches = historyResponse.data.items || [];
    
    if (matches.length === 0) {
      return {
        recent_matches: 0,
        recent_wins: 0,
        recent_losses: 0,
        recent_win_rate: 0,
        recent_kd: 0,
        recent_adr: 0,
        recent_hs_percent: 0,
        recent_form_trend: 'neutral',
        recent_streak: 0
      };
    }

    // Récupérer les stats détaillées pour chaque match
    const matchStatsPromises = matches.map(async (match, index) => {
      try {
        const statsResponse = await axios.get(`${FACEIT_BASE_URL}/matches/${match.match_id}/stats`, {
          headers
        });
        
        // Trouver les stats du joueur dans la réponse
        const playerStats = findPlayerStatsInMatch(statsResponse.data, playerId);
        const mapName = statsResponse.data.rounds?.[0]?.i1 || 'Unknown';
        
        return {
          match_id: match.match_id,
          stats: playerStats,
          map: mapName,
          results: match.results,
          finished_at: match.finished_at
        };
      } catch (error) {
        return {
          match_id: match.match_id,
          stats: {},
          map: 'Unknown',
          results: match.results,
          finished_at: match.finished_at
        };
      }
    });

    const matchesWithStats = await Promise.all(matchStatsPromises);
    
    if (matchesWithStats.length === 0) {
      return {
        recent_matches: 0,
        recent_wins: 0,
        recent_losses: 0,
        recent_win_rate: 0,
        recent_kd: 0,
        recent_adr: 0,
        recent_hs_percent: 0,
        recent_form_trend: 'neutral',
        recent_streak: 0
      };
    }

    // Analyser les performances récentes
    let totalKills = 0, totalDeaths = 0, totalADR = 0, totalHS = 0;
    let wins = 0, losses = 0;
    const results = [];

    matchesWithStats.forEach((match, index) => {
      const playerStats = match.stats || {};
      
      // Déterminer si le joueur a gagné
      // Utiliser le résultat du match si disponible, sinon utiliser une logique de score
      let isWinner = false;
      
      const playerScore = parseFloat(playerStats.Kills) || 0;
      const playerDeaths = parseFloat(playerStats.Deaths) || 0;
      const playerKD = playerDeaths > 0 ? playerScore / playerDeaths : playerScore;
      
      if (match.results && match.results.winner) {
        // Vérifier si le joueur fait partie de l'équipe gagnante
        // Pour l'instant, utiliser une logique basée sur les performances
        isWinner = playerKD > 1.0;
      } else {
        // Fallback: utiliser le K/D du joueur
        isWinner = playerDeaths > 0 ? (playerScore / playerDeaths) > 1.0 : playerScore > 0;
      }
      
      if (isWinner) wins++;
      else losses++;
      
      results.push(isWinner ? '1' : '0');
      
      totalKills += parseFloat(playerStats.Kills) || 0;
      totalDeaths += parseFloat(playerStats.Deaths) || 0;
      totalADR += parseFloat(playerStats.ADR) || 0;
      totalHS += parseFloat(playerStats.Headshots) || 0;
    });

    const recentWinRate = matchesWithStats.length > 0 ? (wins / matchesWithStats.length) * 100 : 0;
    const recentKD = totalDeaths > 0 ? totalKills / totalDeaths : 0;
    const recentADR = matchesWithStats.length > 0 ? totalADR / matchesWithStats.length : 0;
    const recentHSPercent = totalKills > 0 ? (totalHS / totalKills) * 100 : 0;

    // Analyser la forme récente
    const recentForm = analyzeRecentForm(results);

    const result = {
      recent_matches: matchesWithStats.length,
      recent_wins: wins,
      recent_losses: losses,
      recent_win_rate: Math.round(recentWinRate),
      recent_kd: parseFloat(recentKD.toFixed(2)),
      recent_adr: Math.round(recentADR),
      recent_hs_percent: Math.round(recentHSPercent),
      recent_form_trend: recentForm.trend,
      recent_streak: recentForm.streak
    };

    return result;
  } catch (error) {
    console.error(`Error calculating recent stats for player ${playerId}:`, error.message);
    return {
      recent_matches: 0,
      recent_wins: 0,
      recent_losses: 0,
      recent_win_rate: 0,
      recent_kd: 0,
      recent_adr: 0,
      recent_hs_percent: 0,
      recent_form_trend: 'neutral',
      recent_streak: 0
    };
  }
}

// Fonction pour générer une analyse détaillée des forces et faiblesses
function generateDetailedAnalysis(teamStats, players, teamForm) {
  const strengths = [];
  const weaknesses = [];
  const insights = [];
  const recommendations = [];

  // === ANALYSE DES FORCES LIFETIME ===
  
  // Firepower et précision
  if (teamStats.avg_kd > 1.2) {
    strengths.push({
      category: 'Firepower',
      title: 'Excellent K/D ratio global',
      description: `K/D moyen de ${teamStats.avg_kd.toFixed(2)} - L'équipe domine les duels`,
      impact: 'high',
      value: teamStats.avg_kd.toFixed(2)
    });
  } else if (teamStats.avg_kd > 1.1) {
    strengths.push({
      category: 'Firepower',
      title: 'Bon K/D ratio',
      description: `K/D moyen de ${teamStats.avg_kd.toFixed(2)} - Performance solide en duel`,
      impact: 'medium',
      value: teamStats.avg_kd.toFixed(2)
    });
  }

  if (teamStats.avg_adr > 85) {
    strengths.push({
      category: 'Firepower',
      title: 'ADR exceptionnel',
      description: `ADR moyen de ${teamStats.avg_adr} - Dégâts constants et élevés`,
      impact: 'high',
      value: teamStats.avg_adr
    });
  } else if (teamStats.avg_adr > 80) {
    strengths.push({
      category: 'Firepower',
      title: 'ADR élevé',
      description: `ADR moyen de ${teamStats.avg_adr} - Bonne capacité de dégâts`,
      impact: 'medium',
      value: teamStats.avg_adr
    });
  }

  if (teamStats.avg_hs > 55) {
    strengths.push({
      category: 'Précision',
      title: 'Précision headshot excellente',
      description: `${teamStats.avg_hs}% de headshots - Précision exceptionnelle`,
      impact: 'high',
      value: teamStats.avg_hs + '%'
    });
  } else if (teamStats.avg_hs > 50) {
    strengths.push({
      category: 'Précision',
      title: 'Bonne précision headshot',
      description: `${teamStats.avg_hs}% de headshots - Précision solide`,
      impact: 'medium',
      value: teamStats.avg_hs + '%'
    });
  }

  // Forme d'équipe
  if (teamForm.hot_players >= 4) {
    strengths.push({
      category: 'Forme',
      title: 'Équipe en feu',
      description: `${teamForm.hot_players}/5 joueurs en forme - Momentum exceptionnel`,
      impact: 'high',
      value: teamForm.hot_players + '/5'
    });
  } else if (teamForm.hot_players >= 3) {
    strengths.push({
      category: 'Forme',
      title: 'Équipe en forme',
      description: `${teamForm.hot_players}/5 joueurs en forme - Bon momentum`,
      impact: 'medium',
      value: teamForm.hot_players + '/5'
    });
  }

  // Analyse des rôles
  const entryPlayer = players.find(p => p.role === 'Entry Fragger');
  if (entryPlayer && entryPlayer.stats.entry_success > 0.6) {
    strengths.push({
      category: 'Rôles',
      title: 'Entry fragger exceptionnel',
      description: `${(entryPlayer.stats.entry_success * 100).toFixed(0)}% de réussite en entry - Ouverture de rounds efficace`,
      impact: 'high',
      value: (entryPlayer.stats.entry_success * 100).toFixed(0) + '%'
    });
  } else if (entryPlayer && entryPlayer.stats.entry_success > 0.55) {
    strengths.push({
      category: 'Rôles',
      title: 'Entry fragger efficace',
      description: `${(entryPlayer.stats.entry_success * 100).toFixed(0)}% de réussite en entry - Bonne ouverture`,
      impact: 'medium',
      value: (entryPlayer.stats.entry_success * 100).toFixed(0) + '%'
    });
  }

  const awper = players.find(p => p.role === 'AWPer');
  if (awper && awper.stats.sniper_rate > 0.25) {
    strengths.push({
      category: 'Rôles',
      title: 'AWPer impactant',
      description: `${(awper.stats.sniper_rate * 100).toFixed(0)}% de kills au sniper - Impact AWP significatif`,
      impact: 'medium',
      value: (awper.stats.sniper_rate * 100).toFixed(0) + '%'
    });
  }

  // === ANALYSE DES FORCES RÉCENTES ===
  
  if (teamStats.recent_stats.avg_recent_kd > 1.3) {
    strengths.push({
      category: 'Forme Récente',
      title: 'Forme récente exceptionnelle',
      description: `K/D récent de ${teamStats.recent_stats.avg_recent_kd.toFixed(2)} - Performance en hausse`,
      impact: 'high',
      value: teamStats.recent_stats.avg_recent_kd.toFixed(2)
    });
  } else if (teamStats.recent_stats.avg_recent_kd > 1.2) {
    strengths.push({
      category: 'Forme Récente',
      title: 'Forme récente excellente',
      description: `K/D récent de ${teamStats.recent_stats.avg_recent_kd.toFixed(2)} - Bonne tendance`,
      impact: 'medium',
      value: teamStats.recent_stats.avg_recent_kd.toFixed(2)
    });
  }

  if (teamStats.recent_stats.avg_recent_win_rate > 75) {
    strengths.push({
      category: 'Forme Récente',
      title: 'Win rate récent exceptionnel',
      description: `${teamStats.recent_stats.avg_recent_win_rate.toFixed(0)}% de victoires récentes - Momentum fort`,
      impact: 'high',
      value: teamStats.recent_stats.avg_recent_win_rate.toFixed(0) + '%'
    });
  } else if (teamStats.recent_stats.avg_recent_win_rate > 65) {
    strengths.push({
      category: 'Forme Récente',
      title: 'Win rate récent élevé',
      description: `${teamStats.recent_stats.avg_recent_win_rate.toFixed(0)}% de victoires récentes - Bonne tendance`,
      impact: 'medium',
      value: teamStats.recent_stats.avg_recent_win_rate.toFixed(0) + '%'
    });
  }

  if (teamStats.recent_stats.hot_players_recent >= 4) {
    strengths.push({
      category: 'Forme Récente',
      title: 'Équipe en feu récente',
      description: `${teamStats.recent_stats.hot_players_recent}/5 joueurs en forme récente - Momentum exceptionnel`,
      impact: 'high',
      value: teamStats.recent_stats.hot_players_recent + '/5'
    });
  } else if (teamStats.recent_stats.hot_players_recent >= 3) {
    strengths.push({
      category: 'Forme Récente',
      title: 'Forme récente positive',
      description: `${teamStats.recent_stats.hot_players_recent}/5 joueurs en forme récente - Bon momentum`,
      impact: 'medium',
      value: teamStats.recent_stats.hot_players_recent + '/5'
    });
  }

  // === ANALYSE DES FAIBLESSES LIFETIME ===
  
  if (teamStats.avg_kd < 1.0) {
    weaknesses.push({
      category: 'Firepower',
      title: 'K/D faible',
      description: `K/D moyen de ${teamStats.avg_kd.toFixed(2)} - Difficultés en duel`,
      impact: 'high',
      value: teamStats.avg_kd.toFixed(2)
    });
  } else if (teamStats.avg_kd < 1.05) {
    weaknesses.push({
      category: 'Firepower',
      title: 'K/D préoccupant',
      description: `K/D moyen de ${teamStats.avg_kd.toFixed(2)} - Performance en duel à améliorer`,
      impact: 'medium',
      value: teamStats.avg_kd.toFixed(2)
    });
  }

  if (teamStats.avg_consistency < 50) {
    weaknesses.push({
      category: 'Consistance',
      title: 'Équipe très inconsistante',
      description: `Consistance de ${teamStats.avg_consistency}% - Performance très variable`,
      impact: 'high',
      value: teamStats.avg_consistency + '%'
    });
  } else if (teamStats.avg_consistency < 60) {
    weaknesses.push({
      category: 'Consistance',
      title: 'Équipe peu consistante',
      description: `Consistance de ${teamStats.avg_consistency}% - Performance variable`,
      impact: 'medium',
      value: teamStats.avg_consistency + '%'
    });
  }

  if (teamForm.cold_players >= 4) {
    weaknesses.push({
      category: 'Forme',
      title: 'Équipe en méforme',
      description: `${teamForm.cold_players}/5 joueurs en méforme - Momentum négatif`,
      impact: 'high',
      value: teamForm.cold_players + '/5'
    });
  } else if (teamForm.cold_players >= 3) {
    weaknesses.push({
      category: 'Forme',
      title: 'Plusieurs joueurs en méforme',
      description: `${teamForm.cold_players}/5 joueurs en méforme - Attention requise`,
      impact: 'medium',
      value: teamForm.cold_players + '/5'
    });
  }

  // === ANALYSE DES FAIBLESSES RÉCENTES ===
  
  if (teamStats.recent_stats.avg_recent_kd < 0.9) {
    weaknesses.push({
      category: 'Forme Récente',
      title: 'Forme récente préoccupante',
      description: `K/D récent de ${teamStats.recent_stats.avg_recent_kd.toFixed(2)} - Dégradation significative`,
      impact: 'high',
      value: teamStats.recent_stats.avg_recent_kd.toFixed(2)
    });
  } else if (teamStats.recent_stats.avg_recent_kd < 0.95) {
    weaknesses.push({
      category: 'Forme Récente',
      title: 'Forme récente faible',
      description: `K/D récent de ${teamStats.recent_stats.avg_recent_kd.toFixed(2)} - Tendance négative`,
      impact: 'medium',
      value: teamStats.recent_stats.avg_recent_kd.toFixed(2)
    });
  }

  if (teamStats.recent_stats.avg_recent_win_rate < 35) {
    weaknesses.push({
      category: 'Forme Récente',
      title: 'Win rate récent très faible',
      description: `${teamStats.recent_stats.avg_recent_win_rate.toFixed(0)}% de victoires récentes - Série noire`,
      impact: 'high',
      value: teamStats.recent_stats.avg_recent_win_rate.toFixed(0) + '%'
    });
  } else if (teamStats.recent_stats.avg_recent_win_rate < 45) {
    weaknesses.push({
      category: 'Forme Récente',
      title: 'Win rate récent faible',
      description: `${teamStats.recent_stats.avg_recent_win_rate.toFixed(0)}% de victoires récentes - Tendance négative`,
      impact: 'medium',
      value: teamStats.recent_stats.avg_recent_win_rate.toFixed(0) + '%'
    });
  }

  if (teamStats.recent_stats.cold_players_recent >= 4) {
    weaknesses.push({
      category: 'Forme Récente',
      title: 'Équipe en méforme récente',
      description: `${teamStats.recent_stats.cold_players_recent}/5 joueurs en méforme récente - Momentum très négatif`,
      impact: 'high',
      value: teamStats.recent_stats.cold_players_recent + '/5'
    });
  } else if (teamStats.recent_stats.cold_players_recent >= 3) {
    weaknesses.push({
      category: 'Forme Récente',
      title: 'Plusieurs joueurs en méforme récente',
      description: `${teamStats.recent_stats.cold_players_recent}/5 joueurs en méforme récente - Attention requise`,
      impact: 'medium',
      value: teamStats.recent_stats.cold_players_recent + '/5'
    });
  }

  // === ANALYSE COMPARATIVE LIFETIME VS RÉCENT ===
  
  const kdDiff = teamStats.recent_stats.avg_recent_kd - teamStats.avg_kd;
  const wrDiff = teamStats.recent_stats.avg_recent_win_rate - teamStats.avg_win_rate;
  
  if (kdDiff > 0.15) {
    strengths.push({
      category: 'Évolution',
      title: 'Amélioration significative du K/D',
      description: `+${kdDiff.toFixed(2)} K/D récent vs lifetime - Progression remarquable`,
      impact: 'high',
      value: '+' + kdDiff.toFixed(2)
    });
  } else if (kdDiff > 0.1) {
    strengths.push({
      category: 'Évolution',
      title: 'Amélioration du K/D',
      description: `+${kdDiff.toFixed(2)} K/D récent vs lifetime - Bonne progression`,
      impact: 'medium',
      value: '+' + kdDiff.toFixed(2)
    });
  } else if (kdDiff < -0.15) {
    weaknesses.push({
      category: 'Évolution',
      title: 'Dégradation significative du K/D',
      description: `${kdDiff.toFixed(2)} K/D récent vs lifetime - Régression préoccupante`,
      impact: 'high',
      value: kdDiff.toFixed(2)
    });
  } else if (kdDiff < -0.1) {
    weaknesses.push({
      category: 'Évolution',
      title: 'Dégradation du K/D',
      description: `${kdDiff.toFixed(2)} K/D récent vs lifetime - Tendance négative`,
      impact: 'medium',
      value: kdDiff.toFixed(2)
    });
  }

  if (wrDiff > 15) {
    strengths.push({
      category: 'Évolution',
      title: 'Amélioration significative du win rate',
      description: `+${wrDiff.toFixed(0)}% win rate récent vs lifetime - Progression remarquable`,
      impact: 'high',
      value: '+' + wrDiff.toFixed(0) + '%'
    });
  } else if (wrDiff > 10) {
    strengths.push({
      category: 'Évolution',
      title: 'Amélioration du win rate',
      description: `+${wrDiff.toFixed(0)}% win rate récent vs lifetime - Bonne progression`,
      impact: 'medium',
      value: '+' + wrDiff.toFixed(0) + '%'
    });
  } else if (wrDiff < -15) {
    weaknesses.push({
      category: 'Évolution',
      title: 'Dégradation significative du win rate',
      description: `${wrDiff.toFixed(0)}% win rate récent vs lifetime - Régression préoccupante`,
      impact: 'high',
      value: wrDiff.toFixed(0) + '%'
    });
  } else if (wrDiff < -10) {
    weaknesses.push({
      category: 'Évolution',
      title: 'Dégradation du win rate',
      description: `${wrDiff.toFixed(0)}% win rate récent vs lifetime - Tendance négative`,
      impact: 'medium',
      value: wrDiff.toFixed(0) + '%'
    });
  }

  // Supprimé: analyse des performances récentes par map pour améliorer les performances

  // === GÉNÉRATION D'INSIGHTS ET RECOMMANDATIONS ===
  
  // Insight sur la forme générale
  if (teamStats.recent_stats.avg_recent_win_rate > teamStats.avg_win_rate + 10) {
    insights.push({
      type: 'positive',
      title: 'Momentum positif',
      description: 'L\'équipe est en pleine progression avec une forme récente supérieure à la moyenne lifetime'
    });
  } else if (teamStats.recent_stats.avg_recent_win_rate < teamStats.avg_win_rate - 10) {
    insights.push({
      type: 'negative',
      title: 'Momentum négatif',
      description: 'L\'équipe traverse une période difficile avec une forme récente inférieure à la moyenne lifetime'
    });
  }

  // Insight sur la consistance
  if (teamStats.avg_consistency > 70) {
    insights.push({
      type: 'positive',
      title: 'Équipe consistante',
      description: 'L\'équipe maintient un niveau de performance stable sur toutes les maps'
    });
  } else if (teamStats.avg_consistency < 50) {
    insights.push({
      type: 'negative',
      title: 'Équipe inconsistante',
      description: 'L\'équipe a des performances très variables selon les maps et les matchs'
    });
  }

  // Recommandations tactiques
  // Supprimé: recommandation sur les maps fortes récentes

  // Supprimé: recommandation sur les maps faibles récentes

  if (teamStats.recent_stats.cold_players_recent >= 3) {
    recommendations.push({
      type: 'mental',
      title: 'Soutien psychologique',
      description: 'Plusieurs joueurs en méforme - Travailler sur la confiance et la cohésion d\'équipe'
    });
  }

  if (teamStats.avg_consistency < 60) {
    recommendations.push({
      type: 'training',
      title: 'Travail sur la consistance',
      description: 'Se concentrer sur l\'entraînement des maps faibles et la préparation mentale'
    });
  }

  // === RECOMMANDATIONS TACTIQUES AVANCÉES ===
  const advancedTacticalRecommendations = generateAdvancedTacticalRecommendations(teamStats, players, teamForm);
  recommendations.push(...advancedTacticalRecommendations);

  return {
    strengths,
    weaknesses,
    insights,
    recommendations,
    summary: {
      total_strengths: strengths.length,
      total_weaknesses: weaknesses.length,
      high_impact_strengths: strengths.filter(s => s.impact === 'high').length,
      high_impact_weaknesses: weaknesses.filter(w => w.impact === 'high').length
    }
  };
}

// Fonction pour générer des recommandations tactiques avancées
function generateAdvancedTacticalRecommendations(teamStats, players, teamForm) {
  const recommendations = [];

  // === ANALYSE DES RÔLES ET SYNERGIES ===
  
  // Analyser la composition des rôles
  const roleDistribution = {};
  players.forEach(player => {
    roleDistribution[player.role] = (roleDistribution[player.role] || 0) + 1;
  });

  // Vérifier si l'équipe a tous les rôles essentiels
  const essentialRoles = ['AWPer', 'Entry Fragger', 'Support', 'Clutcher', 'Rifler'];
  const missingRoles = essentialRoles.filter(role => !roleDistribution[role]);
  
  if (missingRoles.length > 0) {
    recommendations.push({
      type: 'composition',
      title: 'Rôles manquants',
      description: `L'équipe manque de ${missingRoles.join(', ')} - Considérer une redistribution des rôles`,
      priority: 'high',
      impact: 'high'
    });
  }

  // === ANALYSE DES PERFORMANCES PAR RÔLE ===
  
  const roleAnalysis = {};
  players.forEach(player => {
    if (!roleAnalysis[player.role]) {
      roleAnalysis[player.role] = {
        players: [],
        avg_kd: 0,
        avg_adr: 0,
        avg_win_rate: 0,
        recent_performance: 0
      };
    }
    
    roleAnalysis[player.role].players.push(player);
    roleAnalysis[player.role].avg_kd += player.stats.kd;
    roleAnalysis[player.role].avg_adr += player.stats.adr;
    roleAnalysis[player.role].avg_win_rate += player.stats.win_rate;
    roleAnalysis[player.role].recent_performance += player.recent_stats.recent_kd;
  });

  // Calculer les moyennes par rôle
  Object.keys(roleAnalysis).forEach(role => {
    const count = roleAnalysis[role].players.length;
    roleAnalysis[role].avg_kd /= count;
    roleAnalysis[role].avg_adr /= count;
    roleAnalysis[role].avg_win_rate /= count;
    roleAnalysis[role].recent_performance /= count;
  });

  // Recommandations basées sur les performances par rôle
  Object.entries(roleAnalysis).forEach(([role, stats]) => {
    if (stats.recent_performance < stats.avg_kd - 0.2) {
      recommendations.push({
        type: 'performance',
        title: `${role} en méforme récente`,
        description: `Le rôle ${role} montre une baisse de performance récente (K/D: ${stats.recent_performance.toFixed(2)} vs ${stats.avg_kd.toFixed(2)}) - Travailler sur la confiance`,
        priority: 'medium',
        impact: 'medium'
      });
    }
  });

  // === ANALYSE DES SYNERGIES D'ÉQUIPE ===
  
  // Analyser la cohérence des niveaux de skill
  const skillLevels = players.map(p => p.skill_level);
  const skillVariance = Math.max(...skillLevels) - Math.min(...skillLevels);
  
  if (skillVariance > 3) {
    recommendations.push({
      type: 'cohesion',
      title: 'Écart de niveau important',
      description: `Écart de skill level de ${skillVariance} - Travailler sur la cohésion et l'entraide`,
      priority: 'medium',
      impact: 'medium'
    });
  }

  // === ANALYSE DES TENDANCES RÉCENTES ===
  
  // Analyser la progression récente de l'équipe
  const recentImprovement = teamStats.recent_stats.avg_recent_kd - teamStats.avg_kd;
  const recentWinRateChange = teamStats.recent_stats.avg_recent_win_rate - teamStats.avg_win_rate;
  
  if (recentImprovement > 0.15) {
    recommendations.push({
      type: 'momentum',
      title: 'Momentum positif à exploiter',
      description: `L'équipe est en pleine progression (+${recentImprovement.toFixed(2)} K/D récent) - Maintenir l'élan et la confiance`,
      priority: 'high',
      impact: 'high'
    });
  } else if (recentImprovement < -0.15) {
    recommendations.push({
      type: 'momentum',
      title: 'Momentum négatif à inverser',
      description: `L'équipe traverse une période difficile (${recentImprovement.toFixed(2)} K/D récent) - Travail mental et retour aux bases`,
      priority: 'high',
      impact: 'high'
    });
  }

  // Supprimé: generateMapSpecificRecommendations pour améliorer les performances

  // === RECOMMANDATIONS DE STRATÉGIE ===
  
  // Analyser les forces offensives vs défensives
  const entryPlayer = players.find(p => p.role === 'Entry Fragger');
  const awper = players.find(p => p.role === 'AWPer');
  
  if (entryPlayer && entryPlayer.stats.entry_success > 0.6) {
    recommendations.push({
      type: 'strategy',
      title: 'Exploiter l\'entry forte',
      description: `Entry fragger exceptionnel (${(entryPlayer.stats.entry_success * 100).toFixed(0)}% de réussite) - Privilégier les stratégies agressives`,
      priority: 'high',
      impact: 'high'
    });
  }
  
  if (awper && awper.stats.sniper_rate > 0.3) {
    recommendations.push({
      type: 'strategy',
      title: 'Centrer sur l\'AWP',
      description: `AWPer très impactant (${(awper.stats.sniper_rate * 100).toFixed(0)}% de kills au sniper) - Construire autour de l'AWP`,
      priority: 'medium',
      impact: 'medium'
    });
  }

  // === RECOMMANDATIONS DE PRÉPARATION ===
  
  // Analyser la consistance pour les recommandations de préparation
  if (teamStats.avg_consistency < 50) {
    recommendations.push({
      type: 'preparation',
      title: 'Préparation intensive requise',
      description: 'Équipe très inconsistante - Sessions d\'entraînement intensives et analyse détaillée des maps faibles',
      priority: 'high',
      impact: 'high'
    });
  } else if (teamStats.avg_consistency > 75) {
    recommendations.push({
      type: 'preparation',
      title: 'Maintenir la consistance',
      description: 'Équipe très consistante - Continuer les routines d\'entraînement actuelles',
      priority: 'low',
      impact: 'low'
    });
  }

  return recommendations;
}

// Fonction supprimée: generateMapSpecificRecommendations pour améliorer les performances

// Fonction pour générer une stratégie de veto avancée
function generateAdvancedVetoStrategy(teamStats, players, teamForm) {
  const vetoStrategy = {
    pick_priority: [],
    ban_priority: [],
    neutral_maps: [],
    strategy_notes: [],
    confidence_level: 'medium'
  };

  // === ANALYSE DES PERFORMANCES PAR MAP ===
  
  const mapPool = ['Dust2', 'Mirage', 'Nuke', 'Ancient', 'Train', 'Inferno', 'Overpass', 'Vertigo', 'Anubis'];
  const mapAnalysis = {};

  // Analyser les performances lifetime
  if (teamStats.map_strengths) {
    teamStats.map_strengths.forEach(map => {
      mapAnalysis[map.map] = {
        lifetime: {
          win_rate: map.avg_win_rate,
          kd: map.avg_kd,
          adr: map.avg_adr,
          matches: map.matches,
          confidence: map.confidence
        }
      };
    });
  }

  // Supprimé: analyse des performances récentes (30 jours) pour améliorer les performances

  // Analyser les performances étendues (1-2 mois)
  if (teamStats.extended_analysis && teamStats.extended_analysis.map_performance) {
    Object.entries(teamStats.extended_analysis.map_performance).forEach(([mapName, stats]) => {
      if (!mapAnalysis[mapName]) mapAnalysis[mapName] = {};
      mapAnalysis[mapName].extended_60d = {
        win_rate: stats.avg_win_rate,
        kd: stats.avg_kd,
        adr: stats.avg_adr,
        matches: stats.total_matches,
        confidence: stats.confidence
      };
    });
  }

  // === CALCULER LES SCORES COMPOSITES ===
  
  const mapScores = {};
  mapPool.forEach(mapName => {
    const analysis = mapAnalysis[mapName];
    if (!analysis) return;

    let score = 0;
    let weight = 0;
    let confidence = 0;

    // Score lifetime (poids 30%)
    if (analysis.lifetime) {
      const lifetimeScore = (analysis.lifetime.win_rate / 100) * 0.3;
      score += lifetimeScore;
      weight += 0.3;
      confidence += analysis.lifetime.confidence === 'high' ? 0.3 : analysis.lifetime.confidence === 'medium' ? 0.2 : 0.1;
    }

    // Score récent 30 jours (poids 40%)
    if (analysis.recent_30d) {
      const recentScore = (analysis.recent_30d.win_rate / 100) * 0.4;
      score += recentScore;
      weight += 0.4;
      confidence += analysis.recent_30d.matches >= 5 ? 0.4 : analysis.recent_30d.matches >= 3 ? 0.3 : 0.2;
    }

    // Score étendu 60 jours (poids 30%)
    if (analysis.extended_60d) {
      const extendedScore = (analysis.extended_60d.win_rate / 100) * 0.3;
      score += extendedScore;
      weight += 0.3;
      confidence += analysis.extended_60d.confidence === 'high' ? 0.3 : analysis.extended_60d.confidence === 'medium' ? 0.2 : 0.1;
    }

    if (weight > 0) {
      mapScores[mapName] = {
        final_score: score / weight,
        confidence: confidence / weight,
        data_points: weight,
        analysis: analysis
      };
    }
  });

  // === GÉNÉRER LA STRATÉGIE DE VETO ===
  
  // Trier les maps par score
  const sortedMaps = Object.entries(mapScores)
    .sort((a, b) => b[1].final_score - a[1].final_score);

  // Maps à pick (top 3 avec haute confiance)
  vetoStrategy.pick_priority = sortedMaps
    .filter(([map, data]) => data.final_score >= 0.6 && data.confidence >= 0.6)
    .slice(0, 3)
    .map(([map, data]) => ({
      map: map,
      score: Math.round(data.final_score * 100),
      confidence: data.confidence,
      reason: generatePickReason(map, data.analysis, data.final_score)
    }));

  // Maps à ban (bottom 3 avec haute confiance)
  vetoStrategy.ban_priority = sortedMaps
    .filter(([map, data]) => data.final_score <= 0.4 && data.confidence >= 0.6)
    .slice(-3)
    .reverse()
    .map(([map, data]) => ({
      map: map,
      score: Math.round(data.final_score * 100),
      confidence: data.confidence,
      reason: generateBanReason(map, data.analysis, data.final_score)
    }));

  // Maps neutres (entre 40% et 60%)
  vetoStrategy.neutral_maps = sortedMaps
    .filter(([map, data]) => data.final_score > 0.4 && data.final_score < 0.6)
    .map(([map, data]) => ({
      map: map,
      score: Math.round(data.final_score * 100),
      confidence: data.confidence,
      note: 'Performance neutre - Peut être utilisée selon le contexte'
    }));

  // === GÉNÉRER LES NOTES STRATÉGIQUES ===
  
  // Note sur la confiance globale
  const avgConfidence = Object.values(mapScores).reduce((sum, data) => sum + data.confidence, 0) / Object.keys(mapScores).length;
  if (avgConfidence >= 0.7) {
    vetoStrategy.confidence_level = 'high';
    vetoStrategy.strategy_notes.push('Stratégie de veto basée sur des données solides et récentes');
  } else if (avgConfidence >= 0.5) {
    vetoStrategy.confidence_level = 'medium';
    vetoStrategy.strategy_notes.push('Stratégie de veto basée sur des données moyennement fiables');
  } else {
    vetoStrategy.confidence_level = 'low';
    vetoStrategy.strategy_notes.push('Stratégie de veto basée sur des données limitées - Prudence recommandée');
  }

  // Note sur les tendances récentes
  if (teamStats.extended_analysis && teamStats.extended_analysis.form_trends) {
    const improvingMaps = Object.entries(teamStats.extended_analysis.form_trends)
      .filter(([map, trend]) => trend.trend === 'improving' && trend.trend_value > 15);
    
    if (improvingMaps.length > 0) {
      vetoStrategy.strategy_notes.push(`Maps en amélioration: ${improvingMaps.map(([map]) => map).join(', ')} - Considérer pour les picks`);
    }

    const decliningMaps = Object.entries(teamStats.extended_analysis.form_trends)
      .filter(([map, trend]) => trend.trend === 'declining' && trend.trend_value < -15);
    
    if (decliningMaps.length > 0) {
      vetoStrategy.strategy_notes.push(`Maps en déclin: ${decliningMaps.map(([map]) => map).join(', ')} - Considérer pour les bans`);
    }
  }

  // Note sur la forme d'équipe
  if (teamStats.recent_stats.hot_players_recent >= 4) {
    vetoStrategy.strategy_notes.push('Équipe en forme récente - Stratégie agressive recommandée');
  } else if (teamStats.recent_stats.cold_players_recent >= 3) {
    vetoStrategy.strategy_notes.push('Plusieurs joueurs en méforme - Stratégie conservatrice recommandée');
  }

  // Note sur la consistance
  if (teamStats.avg_consistency >= 70) {
    vetoStrategy.strategy_notes.push('Équipe très consistante - Stratégie de veto fiable');
  } else if (teamStats.avg_consistency <= 50) {
    vetoStrategy.strategy_notes.push('Équipe inconsistante - Adapter la stratégie selon l\'adversaire');
  }

  return vetoStrategy;
}

// Fonction pour générer les raisons de pick
function generatePickReason(mapName, analysis, score) {
  const reasons = [];
  
  if (analysis.lifetime && analysis.lifetime.win_rate >= 70) {
    reasons.push(`Win rate lifetime excellent (${analysis.lifetime.win_rate}%)`);
  }
  
  if (analysis.recent_30d && analysis.recent_30d.win_rate >= 75) {
    reasons.push(`Forme récente exceptionnelle (${analysis.recent_30d.win_rate}%)`);
  }
  
  if (analysis.extended_60d && analysis.extended_60d.win_rate >= 65) {
    reasons.push(`Performance étendue solide (${analysis.extended_60d.win_rate}%)`);
  }
  
  if (reasons.length === 0) {
    reasons.push(`Score composite élevé (${Math.round(score * 100)}%)`);
  }
  
  return reasons.join(' - ');
}

// Fonction pour générer les raisons de ban
function generateBanReason(mapName, analysis, score) {
  const reasons = [];
  
  if (analysis.lifetime && analysis.lifetime.win_rate <= 30) {
    reasons.push(`Win rate lifetime faible (${analysis.lifetime.win_rate}%)`);
  }
  
  if (analysis.recent_30d && analysis.recent_30d.win_rate <= 25) {
    reasons.push(`Forme récente préoccupante (${analysis.recent_30d.win_rate}%)`);
  }
  
  if (analysis.extended_60d && analysis.extended_60d.win_rate <= 35) {
    reasons.push(`Performance étendue faible (${analysis.extended_60d.win_rate}%)`);
  }
  
  if (reasons.length === 0) {
    reasons.push(`Score composite faible (${Math.round(score * 100)}%)`);
  }
  
  return reasons.join(' - ');
}

// Fonction pour calculer l'analyse étendue au niveau équipe (1-2 mois)
function calculateTeamExtendedAnalysis(players) {
  const mapPool = ['Dust2', 'Mirage', 'Nuke', 'Ancient', 'Train', 'Inferno', 'Overpass', 'Vertigo', 'Anubis'];
  
  // Agrégation des données d'analyse étendue
  const teamMapPerformance = {};
  const teamFormTrends = {};
  const allRecommendations = [];
  
  // Initialiser les structures
  mapPool.forEach(mapName => {
    teamMapPerformance[mapName] = {
      total_matches: 0,
      total_wins: 0,
      avg_win_rate: 0,
      avg_recent_win_rate: 0,
      avg_kd: 0,
      avg_adr: 0,
      players_with_data: 0,
      confidence: 'low'
    };
  });

  // Agréger les données de tous les joueurs
  players.forEach(player => {
    if (player.extended_analysis && player.extended_analysis.map_performance) {
      Object.entries(player.extended_analysis.map_performance).forEach(([mapName, stats]) => {
        if (teamMapPerformance[mapName]) {
          teamMapPerformance[mapName].total_matches += stats.matches;
          teamMapPerformance[mapName].total_wins += Math.round((stats.win_rate / 100) * stats.matches);
          teamMapPerformance[mapName].avg_kd += stats.kd;
          teamMapPerformance[mapName].avg_adr += stats.adr;
          teamMapPerformance[mapName].players_with_data++;
        }
      });
    }

    // Agréger les tendances
    if (player.extended_analysis && player.extended_analysis.form_trends) {
      Object.entries(player.extended_analysis.form_trends).forEach(([mapName, trend]) => {
        if (!teamFormTrends[mapName]) {
          teamFormTrends[mapName] = {
            improving_count: 0,
            declining_count: 0,
            stable_count: 0,
            total_players: 0
          };
        }
        
        teamFormTrends[mapName].total_players++;
        if (trend.trend === 'improving') teamFormTrends[mapName].improving_count++;
        else if (trend.trend === 'declining') teamFormTrends[mapName].declining_count++;
        else teamFormTrends[mapName].stable_count++;
      });
    }

    // Collecter les recommandations
    if (player.extended_analysis && player.extended_analysis.recommendations) {
      allRecommendations.push(...player.extended_analysis.recommendations);
    }
  });

  // Calculer les moyennes finales
  Object.entries(teamMapPerformance).forEach(([mapName, stats]) => {
    if (stats.players_with_data > 0) {
      stats.avg_win_rate = stats.total_matches > 0 ? Math.round((stats.total_wins / stats.total_matches) * 100) : 0;
      stats.avg_kd = stats.players_with_data > 0 ? parseFloat((stats.avg_kd / stats.players_with_data).toFixed(2)) : 0;
      stats.avg_adr = stats.players_with_data > 0 ? Math.round(stats.avg_adr / stats.players_with_data) : 0;
      stats.confidence = stats.total_matches >= 20 ? 'high' : stats.total_matches >= 10 ? 'medium' : 'low';
    }
  });

  // Générer les recommandations d'équipe
  const teamRecommendations = generateTeamMapRecommendations(teamMapPerformance, teamFormTrends);

  // Calculer les statistiques globales
  const totalMatches = Object.values(teamMapPerformance).reduce((sum, stats) => sum + stats.total_matches, 0);
  const totalWins = Object.values(teamMapPerformance).reduce((sum, stats) => sum + stats.total_wins, 0);
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  return {
    total_matches: totalMatches,
    overall_win_rate: overallWinRate,
    map_performance: teamMapPerformance,
    form_trends: teamFormTrends,
    recommendations: teamRecommendations,
    individual_recommendations: allRecommendations,
    summary: {
      maps_analyzed: Object.keys(teamMapPerformance).filter(map => teamMapPerformance[map].players_with_data > 0).length,
      high_confidence_maps: Object.values(teamMapPerformance).filter(stats => stats.confidence === 'high').length,
      improving_maps: Object.values(teamFormTrends).filter(trend => trend.improving_count > trend.declining_count).length,
      declining_maps: Object.values(teamFormTrends).filter(trend => trend.declining_count > trend.improving_count).length
    }
  };
}

// Fonction pour générer les recommandations de map pool d'équipe
function generateTeamMapRecommendations(mapPerformance, formTrends) {
  const recommendations = [];

  // Maps fortes d'équipe (win rate > 60% avec confiance élevée)
  const strongMaps = Object.entries(mapPerformance)
    .filter(([map, stats]) => stats.avg_win_rate >= 60 && stats.confidence !== 'low' && stats.players_with_data >= 3)
    .sort((a, b) => b[1].avg_win_rate - a[1].avg_win_rate);

  if (strongMaps.length > 0) {
    recommendations.push({
      type: 'pick',
      priority: 'high',
      maps: strongMaps.slice(0, 3).map(([map]) => map),
      reason: 'Maps fortes d\'équipe avec win rate élevé',
      confidence: 'high'
    });
  }

  // Maps faibles d'équipe (win rate < 40% avec confiance élevée)
  const weakMaps = Object.entries(mapPerformance)
    .filter(([map, stats]) => stats.avg_win_rate <= 40 && stats.confidence !== 'low' && stats.players_with_data >= 3)
    .sort((a, b) => a[1].avg_win_rate - b[1].avg_win_rate);

  if (weakMaps.length > 0) {
    recommendations.push({
      type: 'ban',
      priority: 'high',
      maps: weakMaps.slice(0, 3).map(([map]) => map),
      reason: 'Maps faibles d\'équipe avec win rate faible',
      confidence: 'high'
    });
  }

  // Maps en amélioration (tendance positive)
  const improvingMaps = Object.entries(formTrends)
    .filter(([map, trend]) => trend.improving_count > trend.declining_count && trend.total_players >= 2)
    .map(([map, trend]) => ({ map, improvement_ratio: trend.improving_count / trend.total_players }))
    .sort((a, b) => b.improvement_ratio - a.improvement_ratio);

  if (improvingMaps.length > 0) {
    recommendations.push({
      type: 'pick',
      priority: 'medium',
      maps: improvingMaps.slice(0, 2).map(item => item.map),
      reason: 'Tendance d\'amélioration d\'équipe sur ces maps',
      confidence: 'medium'
    });
  }

  // Maps en déclin (tendance négative)
  const decliningMaps = Object.entries(formTrends)
    .filter(([map, trend]) => trend.declining_count > trend.improving_count && trend.total_players >= 2)
    .map(([map, trend]) => ({ map, decline_ratio: trend.declining_count / trend.total_players }))
    .sort((a, b) => b.decline_ratio - a.decline_ratio);

  if (decliningMaps.length > 0) {
    recommendations.push({
      type: 'ban',
      priority: 'medium',
      maps: decliningMaps.slice(0, 2).map(item => item.map),
      reason: 'Tendance de déclin d\'équipe sur ces maps',
      confidence: 'medium'
    });
  }

  return recommendations;
}

// Fonction supprimée: calculateTeamRecentMapStats pour améliorer les performances

// Fonction supprimée: calculateRecentMapStats pour améliorer les performances

// Fonction pour analyser les performances sur 1-2 mois (pour stratégie map pool et ban)
async function calculateExtendedRecentAnalysis(playerId, headers) {
  try {
    const twoMonthsAgo = Math.floor(Date.now() / 1000) - (60 * 24 * 60 * 60); // 60 jours
    const now = Math.floor(Date.now() / 1000);
    
    const historyResponse = await axios.get(`${FACEIT_BASE_URL}/players/${playerId}/history`, {
      headers,
      params: { 
        game: 'cs2', 
        from: twoMonthsAgo, 
        to: now, 
        offset: 0, 
        limit: 100 // Plus de matchs pour une analyse plus précise
      }
    });

    const matches = historyResponse.data.items || [];
    
    if (matches.length === 0) {
      return {
        total_matches: 0,
        map_performance: {},
        form_trends: {},
        recommendations: []
      };
    }

    // Grouper par map et analyser les tendances
    const mapPerformance = {};
    const monthlyData = { month1: [], month2: [] };
    const currentTime = Date.now();
    
    matches.forEach(match => {
      const mapName = match.i1 || 'Unknown';
      const playerStats = match.stats || {};
      
      // Utiliser la même logique de détection de victoire
      let isWinner = false;
      const playerScore = parseFloat(playerStats.Kills) || 0;
      const playerDeaths = parseFloat(playerStats.Deaths) || 0;
      isWinner = playerDeaths > 0 ? (playerScore / playerDeaths) > 1.0 : playerScore > 0;
      
      const matchTime = new Date(match.finished_at * 1000);
      const daysAgo = (currentTime - matchTime.getTime()) / (1000 * 60 * 60 * 24);
      
      // Séparer en deux mois
      if (daysAgo <= 30) {
        monthlyData.month1.push({ map: mapName, isWinner, stats: playerStats, daysAgo });
      } else if (daysAgo <= 60) {
        monthlyData.month2.push({ map: mapName, isWinner, stats: playerStats, daysAgo });
      }
      
      // Performance globale par map
      if (!mapPerformance[mapName]) {
        mapPerformance[mapName] = {
          matches: 0,
          wins: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalADR: 0,
          totalHS: 0,
          recent_matches: 0,
          recent_wins: 0
        };
      }
      
      mapPerformance[mapName].matches++;
      if (isWinner) mapPerformance[mapName].wins++;
      mapPerformance[mapName].totalKills += parseFloat(playerStats.Kills) || 0;
      mapPerformance[mapName].totalDeaths += parseFloat(playerStats.Deaths) || 0;
      mapPerformance[mapName].totalADR += parseFloat(playerStats.ADR) || 0;
      mapPerformance[mapName].totalHS += parseFloat(playerStats.Headshots) || 0;
      
      // Marquer les matchs récents (15 derniers jours)
      if (daysAgo <= 15) {
        mapPerformance[mapName].recent_matches++;
        if (isWinner) mapPerformance[mapName].recent_wins++;
      }
    });

    // Calculer les stats finales par map
    const finalMapPerformance = {};
    for (const [mapName, stats] of Object.entries(mapPerformance)) {
      if (stats.matches >= 3) { // Au moins 3 matchs pour être significatif
        const winRate = (stats.wins / stats.matches) * 100;
        const kd = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : 0;
        const adr = stats.matches > 0 ? stats.totalADR / stats.matches : 0;
        const hsPercent = stats.totalKills > 0 ? (stats.totalHS / stats.totalKills) * 100 : 0;
        const recentWinRate = stats.recent_matches > 0 ? (stats.recent_wins / stats.recent_matches) * 100 : winRate;
        
        finalMapPerformance[mapName] = {
          matches: stats.matches,
          win_rate: Math.round(winRate),
          recent_win_rate: Math.round(recentWinRate),
          kd: parseFloat(kd.toFixed(2)),
          adr: Math.round(adr),
          hs_percent: Math.round(hsPercent),
          recent_matches: stats.recent_matches,
          confidence: stats.matches >= 10 ? 'high' : stats.matches >= 5 ? 'medium' : 'low'
        };
      }
    }

    // Analyser les tendances mensuelles
    const formTrends = {};
    for (const [mapName, stats] of Object.entries(finalMapPerformance)) {
      const month1Data = monthlyData.month1.filter(m => m.map === mapName);
      const month2Data = monthlyData.month2.filter(m => m.map === mapName);
      
      if (month1Data.length >= 2 && month2Data.length >= 2) {
        const month1WR = (month1Data.filter(m => m.isWinner).length / month1Data.length) * 100;
        const month2WR = (month2Data.filter(m => m.isWinner).length / month2Data.length) * 100;
        const trend = month1WR - month2WR;
        
        formTrends[mapName] = {
          month1_win_rate: Math.round(month1WR),
          month2_win_rate: Math.round(month2WR),
          trend: trend > 10 ? 'improving' : trend < -10 ? 'declining' : 'stable',
          trend_value: Math.round(trend)
        };
      }
    }

    // Générer des recommandations
    const recommendations = [];
    
    // Supprimé: analyse des maps fortes/faibles récentes pour améliorer les performances

    // Maps en amélioration
    const improvingMaps = Object.entries(formTrends)
      .filter(([map, trend]) => trend.trend === 'improving' && trend.trend_value > 15)
      .sort((a, b) => b[1].trend_value - a[1].trend_value);
    
    if (improvingMaps.length > 0) {
      recommendations.push({
        type: 'pick',
        priority: 'medium',
        maps: improvingMaps.slice(0, 2).map(([map]) => map),
        reason: 'Tendance positive récente sur ces maps'
      });
    }

    // Maps en déclin
    const decliningMaps = Object.entries(formTrends)
      .filter(([map, trend]) => trend.trend === 'declining' && trend.trend_value < -15)
      .sort((a, b) => a[1].trend_value - b[1].trend_value);
    
    if (decliningMaps.length > 0) {
      recommendations.push({
        type: 'ban',
        priority: 'medium',
        maps: decliningMaps.slice(0, 2).map(([map]) => map),
        reason: 'Tendance négative récente sur ces maps'
      });
    }

    return {
      total_matches: matches.length,
      map_performance: finalMapPerformance,
      form_trends: formTrends,
      recommendations: recommendations,
      monthly_breakdown: {
        month1_matches: monthlyData.month1.length,
        month2_matches: monthlyData.month2.length
      }
    };
  } catch (error) {
    console.error(`Error calculating extended recent analysis for player ${playerId}:`, error.message);
    return {
      total_matches: 0,
      map_performance: {},
      form_trends: {},
      recommendations: []
    };
  }
}

// Route principale: Analyser une équipe avec toutes les données
app.post('/api/team/analyze', async (req, res) => {
  try {
    const { nicknames } = req.body;
    
    if (!Array.isArray(nicknames) || nicknames.length === 0) {
      return res.status(400).json({ error: 'At least one nickname required' });
    }

    // Si plus de 5 joueurs, prendre les 5 premiers
    const teamNicknames = nicknames.slice(0, 5);
    if (nicknames.length > 5) {
      console.log(`Team has ${nicknames.length} players, analyzing first 5: ${teamNicknames.join(', ')}`);
    }

    // Étape 1: Convertir nicknames → player data
    const playerPromises = teamNicknames.map(async (nickname) => {
      try {
        const searchResponse = await axios.get(
          `${FACEIT_BASE_URL}/players`,
          { headers, params: { nickname, game: 'cs2' } }
        );
        return {
          nickname: searchResponse.data.nickname,
          player_id: searchResponse.data.player_id,
          avatar: searchResponse.data.avatar,
          country: searchResponse.data.country,
          skill_level: searchResponse.data.games?.cs2?.skill_level || 0,
          faceit_elo: searchResponse.data.games?.cs2?.faceit_elo || 0
        };
      } catch (error) {
        throw new Error(`Player not found: ${nickname}`);
      }
    });

    const players = await Promise.all(playerPromises);

    // Étape 2: Fetch stats complètes et stats récentes
    const statsPromises = players.map(p => 
      axios.get(`${FACEIT_BASE_URL}/players/${p.player_id}/stats/cs2`, { headers })
    );

    const statsResponses = await Promise.all(statsPromises);
    
    // Étape 2.5: Calculer les stats récentes pour chaque joueur
    const recentStatsPromises = players.map(p => 
      calculateRecentStats(p.player_id, headers)
    );

    const recentStatsResponses = await Promise.all(recentStatsPromises);
    
    // Supprimé: calculateRecentMapStats pour améliorer les performances
    
    // Étape 2.7: Calculer l'analyse étendue récente (1-2 mois) pour chaque joueur
    const extendedAnalysisPromises = players.map(p => 
      calculateExtendedRecentAnalysis(p.player_id, headers)
    );

    const extendedAnalysisResponses = await Promise.all(extendedAnalysisPromises);
    
    // Étape 3: Construire les données enrichies
    const playersData = statsResponses.map((r, idx) => {
      const lifetime = r.data.lifetime;
      const segments = r.data.segments;
        const recentStats = recentStatsResponses[idx];
        const extendedAnalysis = extendedAnalysisResponses[idx];
      
      const recentForm = analyzeRecentForm(lifetime['Recent Results']);
      const consistency = calculateConsistency(segments);
      
      return {
        ...players[idx],
        consistency,
        recent_form: recentForm,
        stats: {
          // Stats lifetime
          win_rate: parseFloat(lifetime['Win Rate %']) || 0,
          kd: parseFloat(lifetime['Average K/D Ratio']) || 0,
          adr: parseFloat(lifetime.ADR) || 0,
          hs_percent: parseFloat(lifetime['Average Headshots %']) || 0,
          total_matches: parseInt(lifetime['Total Matches']) || 0,
          entry_rate: parseFloat(lifetime['Entry Rate']) || 0,
          entry_success: parseFloat(lifetime['Entry Success Rate']) || 0,
          clutch_rate: parseFloat(lifetime['1v1 Win Rate']) || 0,
          flash_success: parseFloat(lifetime['Flash Success Rate']) || 0,
          utility_usage: parseFloat(lifetime['Utility Usage per Round']) || 0,
          sniper_rate: parseFloat(lifetime['Sniper Kill Rate']) || 0
        },
        recent_stats: recentStats,
        map_stats: segments,
        extended_analysis: extendedAnalysis
      };
    });

    // Étape 3.5: Assigner des rôles uniques à l'équipe
    const playersWithUniqueRoles = assignUniqueRoles(playersData);

    // Étape 4: Calculer stats d'équipe
    const teamStats = {
      // Stats lifetime
      avg_skill_level: (players.reduce((a, p) => a + p.skill_level, 0) / 5).toFixed(1),
      avg_elo: Math.round(players.reduce((a, p) => a + p.faceit_elo, 0) / 5),
      avg_win_rate: playersWithUniqueRoles.reduce((a, p) => a + p.stats.win_rate, 0) / 5,
      avg_kd: playersWithUniqueRoles.reduce((a, p) => a + p.stats.kd, 0) / 5,
      avg_adr: playersWithUniqueRoles.reduce((a, p) => a + p.stats.adr, 0) / 5,
      avg_hs: playersWithUniqueRoles.reduce((a, p) => a + p.stats.hs_percent, 0) / 5,
      avg_consistency: playersWithUniqueRoles.reduce((a, p) => a + p.consistency, 0) / 5,
      
      // Stats récentes (30 derniers jours)
      recent_stats: {
        avg_recent_win_rate: playersWithUniqueRoles.reduce((a, p) => a + p.recent_stats.recent_win_rate, 0) / 5,
        avg_recent_kd: playersWithUniqueRoles.reduce((a, p) => a + p.recent_stats.recent_kd, 0) / 5,
        avg_recent_adr: playersWithUniqueRoles.reduce((a, p) => a + p.recent_stats.recent_adr, 0) / 5,
        avg_recent_hs: playersWithUniqueRoles.reduce((a, p) => a + p.recent_stats.recent_hs_percent, 0) / 5,
        total_recent_matches: playersWithUniqueRoles.reduce((a, p) => a + p.recent_stats.recent_matches, 0),
        hot_players_recent: playersWithUniqueRoles.filter(p => p.recent_stats.recent_form_trend === 'hot').length,
        cold_players_recent: playersWithUniqueRoles.filter(p => p.recent_stats.recent_form_trend === 'cold').length
      },
      
        // Supprimé: recent_map_stats pour améliorer les performances
      
      // Analyse étendue récente (1-2 mois) pour stratégie map pool et ban
      extended_analysis: calculateTeamExtendedAnalysis(playersWithUniqueRoles),
      
      players: playersWithUniqueRoles
    };

    // Étape 5: Analyser la forme d'équipe globale
    const teamForm = {
      hot_players: playersData.filter(p => p.recent_form.trend === 'hot').length,
      cold_players: playersData.filter(p => p.recent_form.trend === 'cold').length,
      avg_recent_wr: playersData.reduce((a, p) => a + parseFloat(p.recent_form.winRate), 0) / 5
    };
    teamStats.team_form = teamForm;

    // Étape 6: Force par map avec données détaillées
    const mapPool = ['Dust2', 'Mirage', 'Nuke', 'Ancient', 'Train', 'Inferno', 'Overpass'];
    teamStats.map_strengths = mapPool.map(mapName => {
      const mapData = playersData.flatMap(p => 
        p.map_stats.filter(m => m.label === mapName)
      );
      
      if (mapData.length === 0) return { 
        map: mapName, 
        avg_win_rate: 0, 
        matches: 0,
        avg_kd: 0,
        avg_adr: 0,
        confidence: 'low'
      };

      const totalMatches = mapData.reduce((a, m) => a + (parseInt(m.stats.Matches) || 0), 0);
      const avgWinRate = mapData.reduce((a, m) => a + (parseFloat(m.stats['Win Rate %']) || 0), 0) / mapData.length;
      const avgKD = mapData.reduce((a, m) => a + (parseFloat(m.stats['Average K/D Ratio']) || 0), 0) / mapData.length;
      const avgADR = mapData.reduce((a, m) => a + (parseFloat(m.stats.ADR) || 0), 0) / mapData.length;
      
      // Calculer la confiance basée sur le nombre de matchs
      let confidence = 'low';
      if (totalMatches > 50) confidence = 'high';
      else if (totalMatches > 20) confidence = 'medium';

      return { 
        map: mapName, 
        avg_win_rate: Math.round(avgWinRate), 
        matches: totalMatches,
        avg_kd: parseFloat(avgKD.toFixed(2)),
        avg_adr: Math.round(avgADR),
        confidence
      };
    }).sort((a, b) => b.avg_win_rate - a.avg_win_rate);

    // Étape 7: Identifier forces et faiblesses avec analyse détaillée
    const analysis = generateDetailedAnalysis(teamStats, playersWithUniqueRoles, teamForm);
    teamStats.analysis = analysis;

    // Étape 8: Générer la stratégie de veto avancée
    const vetoStrategy = generateAdvancedVetoStrategy(teamStats, playersWithUniqueRoles, teamForm);
    teamStats.veto_strategy = vetoStrategy;

    res.json(teamStats);
  } catch (error) {
    console.error('Error analyzing team:', error.message);
    res.status(500).json({ error: error.message || 'Failed to analyze team' });
  }
});

// Route: Comparaison détaillée entre 2 équipes
app.post('/api/team/compare', async (req, res) => {
  try {
    const { team1, team2 } = req.body; // Les objets team déjà analysés

    // Calculer les matchups rôle par rôle
    const roleMatchups = team1.players.map(p1 => {
      const p2 = team2.players.find(p => p.role === p1.role);
      if (!p2) return null;

      return {
        role: p1.role,
        player1: { nickname: p1.nickname, kd: p1.stats.kd, adr: p1.stats.adr },
        player2: { nickname: p2.nickname, kd: p2.stats.kd, adr: p2.stats.adr },
        advantage: p1.stats.kd > p2.stats.kd ? 'team1' : 'team2',
        kd_diff: (p1.stats.kd - p2.stats.kd).toFixed(2)
      };
    }).filter(m => m !== null);

    // Recommandations tactiques
    const recommendations = [];
    
    // Analyser les maps à pick/ban
    const mapRecommendations = team1.map_strengths.map(m1 => {
      const m2 = team2.map_strengths.find(m => m.map === m1.map);
      const diff = m1.avg_win_rate - (m2?.avg_win_rate || 0);
      
      let recommendation = 'neutral';
      if (diff > 10) recommendation = 'strong_pick';
      else if (diff > 5) recommendation = 'pick';
      else if (diff < -10) recommendation = 'ban';
      else if (diff < -5) recommendation = 'avoid';

      return {
        map: m1.map,
        our_wr: m1.avg_win_rate,
        their_wr: m2?.avg_win_rate || 0,
        diff,
        recommendation
      };
    });

    // Identifier les faiblesses adverses à exploiter
    const weakPlayer = team2.players.reduce((min, p) => 
      p.stats.kd < min.stats.kd ? p : min
    );
    recommendations.push(`Cibler ${weakPlayer.nickname} (${weakPlayer.role}) - K/D: ${weakPlayer.stats.kd}`);

    if (team2.team_form.cold_players >= 2) {
      recommendations.push('Équipe adverse en méforme - jouer agressif');
    }

    const awper2 = team2.players.find(p => p.role === 'AWPer');
    if (awper2 && awper2.stats.sniper_rate < 0.2) {
      recommendations.push('AWPer adverse peu efficace - contestations possibles');
    }

    res.json({
      role_matchups: roleMatchups,
      map_recommendations: mapRecommendations,
      tactical_recommendations: recommendations
    });
  } catch (error) {
    console.error('Error comparing teams:', error.message);
    res.status(500).json({ error: 'Failed to compare teams' });
  }
});

// Route pour charger les deux équipes d'un match
app.post('/api/match/load-teams', async (req, res) => {
  try {
    const { match_id } = req.body;
    
    if (!match_id) {
      return res.status(400).json({ error: 'match_id is required' });
    }

    // Vérifier le cache d'abord
    const cacheKey = `match_teams_${match_id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Récupérer les données du match depuis l'API Faceit
    const response = await axios.get(`${FACEIT_BASE_URL}/matches/${match_id}`, {
      headers: FACEIT_API_KEY ? headers : {}
    });

    const matchData = response.data;
    
    // Extraire les informations des équipes
    const teams = {};
    for (const [factionKey, faction] of Object.entries(matchData.teams)) {
      teams[factionKey] = {
        name: faction.name,
        avatar: faction.avatar,
        roster: faction.roster.map(player => ({
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar,
          game_skill_level: player.game_skill_level,
          membership: player.membership
        }))
      };
    }

    const result = {
      match_id: matchData.match_id,
      game: matchData.game,
      region: matchData.region,
      competition_name: matchData.competition_name,
      status: matchData.status,
      teams: teams,
      faceit_url: matchData.faceit_url
    };

    // Mettre en cache pour 1 heure
    cache.set(cacheKey, result, 3600);
    
    res.json(result);
  } catch (error) {
    console.error('Error loading match teams:', error.message);
    
    if (error.response?.status === 403) {
      res.status(403).json({ 
        error: 'API Faceit requires authentication. Please add FACEIT_API_KEY to your environment variables.' 
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Match not found' });
    } else {
      res.status(500).json({ error: 'Failed to load match teams' });
    }
  }
});

// Route pour récupérer l'historique des matchs d'un joueur
app.post('/api/player/history', async (req, res) => {
  try {
    const { player_id, limit = 20 } = req.body;
    
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

    // Récupérer l'historique des matchs
    const response = await axios.get(`${FACEIT_BASE_URL}/players/${player_id}/history`, {
      headers: FACEIT_API_KEY ? headers : {},
      params: { game: 'cs2', from: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), to: Math.floor(Date.now() / 1000), limit }
    });

    const history = response.data.items;
    
    // Analyser les performances récentes
    const recentAnalysis = {
      total_matches: history.length,
      wins: history.filter(m => m.results.winner === player_id).length,
      losses: history.filter(m => m.results.winner !== player_id).length,
      win_rate: history.length > 0 ? (history.filter(m => m.results.winner === player_id).length / history.length * 100).toFixed(1) : 0,
      avg_kd: history.reduce((sum, m) => sum + (m.stats?.K/D || 0), 0) / history.length,
      avg_adr: history.reduce((sum, m) => sum + (m.stats?.ADR || 0), 0) / history.length,
      form_trend: 'stable', // À calculer
      maps_played: [...new Set(history.map(m => m.i1))],
      recent_matches: history.slice(0, 5).map(match => ({
        match_id: match.match_id,
        map: match.i1,
        result: match.results.winner === player_id ? 'win' : 'loss',
        kd: match.stats?.['K/D'] || 0,
        adr: match.stats?.ADR || 0,
        date: new Date(match.finished_at * 1000).toISOString()
      }))
    };

    res.json(recentAnalysis);
  } catch (error) {
    console.error('Error fetching player history:', error.message);
    res.status(500).json({ error: 'Failed to fetch player history' });
  }
});

// Route pour récupérer les données d'un match Faceit
app.post('/api/match/get', async (req, res) => {
  try {
    const { match_id } = req.body;
    
    if (!match_id) {
      return res.status(400).json({ error: 'match_id is required' });
    }

    // Vérifier le cache d'abord
    const cacheKey = `match_${match_id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Récupérer les données du match depuis l'API Faceit
    const response = await axios.get(`${FACEIT_BASE_URL}/matches/${match_id}`, {
      headers: FACEIT_API_KEY ? headers : {}
    });

    const matchData = response.data;
    
    // Extraire les informations des équipes
    const teams = {};
    for (const [factionKey, faction] of Object.entries(matchData.teams)) {
      teams[factionKey] = {
        name: faction.name,
        avatar: faction.avatar,
        roster: faction.roster.map(player => ({
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar,
          game_skill_level: player.game_skill_level,
          membership: player.membership
        }))
      };
    }

    const result = {
      match_id: matchData.match_id,
      game: matchData.game,
      region: matchData.region,
      competition_name: matchData.competition_name,
      status: matchData.status,
      teams: teams,
      faceit_url: matchData.faceit_url
    };

    // Mettre en cache pour 1 heure
    cache.set(cacheKey, result, 3600);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching match data:', error.message);
    
    if (error.response?.status === 403) {
      res.status(403).json({ 
        error: 'API Faceit requires authentication. Please add FACEIT_API_KEY to your environment variables.' 
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Match not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch match data' });
    }
  }
});

// Route pour des analyses tactiques avancées
app.post('/api/team/tactical-analysis', async (req, res) => {
  try {
    const { team1, team2 } = req.body;

    if (!team1 || !team2) {
      return res.status(400).json({ error: 'Both teams are required' });
    }

    // Analyse des rôles et matchups
    const roleAnalysis = {
      our_roles: team1.players.map(p => ({ nickname: p.nickname, role: p.role, confidence: p.roleConfidence })),
      their_roles: team2.players.map(p => ({ nickname: p.nickname, role: p.role, confidence: p.roleConfidence })),
      role_advantages: [],
      tactical_recommendations: []
    };

    // Analyser les avantages par rôle
    const roleMatchups = ['AWPer', 'Entry Fragger', 'Clutcher', 'Support', 'Rifler'];
    
    for (const role of roleMatchups) {
      const ourPlayer = team1.players.find(p => p.role === role);
      const theirPlayer = team2.players.find(p => p.role === role);
      
      if (ourPlayer && theirPlayer) {
        const kdAdvantage = ourPlayer.stats.kd - theirPlayer.stats.kd;
        const adrAdvantage = ourPlayer.stats.adr - theirPlayer.stats.adr;
        
        roleAnalysis.role_advantages.push({
          role,
          our_player: ourPlayer.nickname,
          their_player: theirPlayer.nickname,
          kd_advantage: kdAdvantage.toFixed(2),
          adr_advantage: adrAdvantage.toFixed(1),
          overall_advantage: kdAdvantage > 0.1 && adrAdvantage > 5 ? 'us' : kdAdvantage < -0.1 && adrAdvantage < -5 ? 'them' : 'even'
        });
      }
    }

    // Recommandations tactiques basées sur les données
    const recommendations = [];

    // Analyser les forces/faiblesses
    const ourEntryFragger = team1.players.find(p => p.role === 'Entry Fragger');
    const theirEntryFragger = team2.players.find(p => p.role === 'Entry Fragger');
    
    if (ourEntryFragger && theirEntryFragger) {
      if (ourEntryFragger.stats.entry_success > theirEntryFragger.stats.entry_success + 0.1) {
        recommendations.push({
          type: 'aggressive',
          priority: 'high',
          message: `Exploiter notre Entry Fragger ${ourEntryFragger.nickname} (${ourEntryFragger.stats.entry_success.toFixed(2)} vs ${theirEntryFragger.stats.entry_success.toFixed(2)})`,
          tactic: 'Jouer agressif en early round, prendre l\'initiative'
        });
      }
    }

    // Analyser les AWPers
    const ourAWPer = team1.players.find(p => p.role === 'AWPer');
    const theirAWPer = team2.players.find(p => p.role === 'AWPer');
    
    if (ourAWPer && theirAWPer) {
      if (ourAWPer.stats.sniper_rate > theirAWPer.stats.sniper_rate + 0.1) {
        recommendations.push({
          type: 'positioning',
          priority: 'medium',
          message: `Notre AWPer ${ourAWPer.nickname} est plus efficace (${ourAWPer.stats.sniper_rate.toFixed(2)} vs ${theirAWPer.stats.sniper_rate.toFixed(2)})`,
          tactic: 'Contrôler les angles longs, forcer les duels AWP'
        });
      }
    }

    // Analyser la forme récente
    const ourHotPlayers = team1.players.filter(p => p.recent_form?.trend === 'hot').length;
    const theirHotPlayers = team2.players.filter(p => p.recent_form?.trend === 'hot').length;
    
    if (ourHotPlayers > theirHotPlayers + 1) {
      recommendations.push({
        type: 'momentum',
        priority: 'high',
        message: `Nous avons ${ourHotPlayers} joueurs en forme vs ${theirHotPlayers} pour eux`,
        tactic: 'Maintenir la pression, exploiter notre momentum'
      });
    }

    // Analyser les maps
    const mapRecommendations = [];
    if (team1.map_strengths && team2.map_strengths) {
      for (const ourMap of team1.map_strengths) {
        const theirMap = team2.map_strengths.find(m => m.map === ourMap.map);
        if (theirMap) {
          const diff = ourMap.avg_win_rate - theirMap.avg_win_rate;
          if (diff > 15) {
            mapRecommendations.push({
              map: ourMap.map,
              our_wr: ourMap.avg_win_rate,
              their_wr: theirMap.avg_win_rate,
              advantage: 'strong_pick',
              recommendation: `Pick fort: ${ourMap.map} (${diff.toFixed(1)}% d'avantage)`
            });
          } else if (diff < -15) {
            mapRecommendations.push({
              map: ourMap.map,
              our_wr: ourMap.avg_win_rate,
              their_wr: theirMap.avg_win_rate,
              advantage: 'ban',
              recommendation: `Ban recommandé: ${ourMap.map} (${Math.abs(diff).toFixed(1)}% de désavantage)`
            });
          }
        }
      }
    }

    // Analyser les joueurs à cibler
    const targetPlayer = team2.players.reduce((weakest, player) => 
      player.stats.kd < weakest.stats.kd ? player : weakest
    );

    recommendations.push({
      type: 'targeting',
      priority: 'medium',
      message: `Cibler ${targetPlayer.nickname} (${targetPlayer.role}) - K/D: ${targetPlayer.stats.kd}`,
      tactic: 'Forcer les duels contre ce joueur, exploiter sa faiblesse'
    });

    const tacticalAnalysis = {
      role_analysis: roleAnalysis,
      recommendations,
      map_recommendations: mapRecommendations,
      key_insights: [
        `Notre K/D moyen: ${team1.avg_kd.toFixed(2)} vs Leur K/D moyen: ${team2.avg_kd.toFixed(2)}`,
        `Notre ADR moyen: ${team1.avg_adr.toFixed(1)} vs Leur ADR moyen: ${team2.avg_adr.toFixed(1)}`,
        `Notre consistance: ${team1.avg_consistency.toFixed(1)}% vs Leur consistance: ${team2.avg_consistency.toFixed(1)}%`
      ],
      game_plan: {
        early_round: ourEntryFragger?.stats.entry_success > 0.5 ? 'Agressif' : 'Contrôlé',
        mid_round: team1.avg_consistency > team2.avg_consistency ? 'Stable' : 'Adaptatif',
        late_round: team1.players.filter(p => p.role === 'Clutcher').length > 0 ? 'Clutch focus' : 'Team play'
      }
    };

    res.json(tacticalAnalysis);
  } catch (error) {
    console.error('Error in tactical analysis:', error.message);
    res.status(500).json({ error: 'Failed to perform tactical analysis' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
// Route optimisée pour charger les équipes d'un match (nouvelle méthode)
app.get('/api/match/:matchId/teams', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { mode = 'optimized' } = req.query;
    
    console.log(`🔄 Chargement du match ${matchId} en mode ${mode}`);
    const startTime = Date.now();
    
    // Récupérer les détails du match
    const matchResponse = await axios.get(`${FACEIT_BASE_URL}/matches/${matchId}`, { 
      headers: FACEIT_API_KEY ? headers : {} 
    });
    const matchData = matchResponse.data;
    
    
    let result;
    
    switch (mode) {
      case 'ultrafast':
        result = await loadMatchTeamsUltraFast(matchId, matchData);
        break;
      case 'full':
        result = await loadMatchTeamsFull(matchId, matchData);
        break;
      default:
        result = await loadMatchTeamsOptimized(matchId, matchData);
    }
    
    result.loading_time = Date.now() - startTime;
    console.log(`✅ Match ${matchId} chargé en ${result.loading_time}ms (mode: ${mode})`);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error loading match teams:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors du chargement des équipes du match',
      details: error.response?.data || error.message
    });
  }
});

// Fonction pour le mode ultra-rapide
async function loadMatchTeamsUltraFast(matchId, matchData) {
  const teams = {};
  
  // Normaliser et enrichir chaque équipe
  for (const [factionKey, faction] of Object.entries(matchData.teams || {})) {
    const normalizedTeam = SimpleDataEnricher.normalizeTeamData(faction, factionKey);
    teams[factionKey] = SimpleDataEnricher.enrichTeamData(normalizedTeam);
  }
  
  // Enrichir les données de match
  const enrichedMatch = SimpleDataEnricher.enrichMatchData({
    ...matchData,
    teams: teams
  });
  
  return {
    match_id: matchId,
    teams: teams,
    match_info: {
      game_id: matchData.game_id,
      region: matchData.region,
      status: matchData.status,
      started_at: matchData.started_at,
      finished_at: matchData.finished_at,
      results: matchData.results,
      competition: {
        name: matchData.competition_name,
        type: matchData.competition_type
      }
    },
    match_insights: enrichedMatch.match_insights,
    optimization: 'ultra_fast_mode',
    note: 'Données enrichies avec insights de match'
  };
}

// Fonction pour le mode optimisé
async function loadMatchTeamsOptimized(matchId, matchData) {
  const teams = {};
  
  // Récupérer les stats du match en parallèle
  let matchStats = null;
  try {
    const statsResponse = await axios.get(`${FACEIT_BASE_URL}/matches/${matchId}/stats`, { 
      headers: FACEIT_API_KEY ? headers : {} 
    });
    matchStats = statsResponse.data;
  } catch (error) {
    console.warn(`Stats du match ${matchId} non disponibles:`, error.message);
  }
  
  for (const [factionKey, faction] of Object.entries(matchData.teams || {})) {
    teams[factionKey] = {
      team_id: faction.team_id,
      name: faction.nickname || faction.name || `Équipe ${factionKey}`,
      avatar: faction.avatar,
      roster: (faction.roster || []).map(player => ({
        player_id: player.player_id,
        nickname: player.nickname,
        avatar: player.avatar,
        skill_level: player.skill_level,
        game_player_id: player.game_player_id,
        game_player_name: player.game_player_name,
        faceit_url: player.faceit_url,
        match_stats: matchStats ? extractPlayerMatchStats(matchStats, player.player_id) : {},
        lifetime_stats: {} // Sera chargé en arrière-plan
      }))
    };
  }
  
  // Charger les stats lifetime en arrière-plan (non bloquant)
  loadLifetimeStatsInBackground(teams);
  
  return {
    match_id: matchId,
    teams: teams,
    match_info: {
      game_id: matchData.game_id,
      region: matchData.region,
      status: matchData.status,
      started_at: matchData.started_at,
      finished_at: matchData.finished_at,
      results: matchData.results
    },
    optimization: 'optimized_mode',
    note: 'Stats lifetime chargées en arrière-plan'
  };
}

// Fonction pour le mode complet
async function loadMatchTeamsFull(matchId, matchData) {
  const teams = {};
  
  // Récupérer les stats du match
  let matchStats = null;
  try {
    const statsResponse = await axios.get(`${FACEIT_BASE_URL}/matches/${matchId}/stats`, { 
      headers: FACEIT_API_KEY ? headers : {} 
    });
    matchStats = statsResponse.data;
  } catch (error) {
    console.warn(`Stats du match ${matchId} non disponibles:`, error.message);
  }
  
  // Charger les stats lifetime pour tous les joueurs
  const playerStatsPromises = [];
  const allPlayers = [];
  
  for (const [factionKey, faction] of Object.entries(matchData.teams || {})) {
    for (const player of (faction.roster || [])) {
      allPlayers.push({ ...player, faction: factionKey });
      playerStatsPromises.push(
        axios.get(`${FACEIT_BASE_URL}/players/${player.player_id}/stats/cs2`, { 
          headers: FACEIT_API_KEY ? headers : {} 
        })
          .then(response => ({ player_id: player.player_id, stats: response.data }))
          .catch(error => ({ player_id: player.player_id, stats: null, error: error.message }))
      );
    }
  }
  
  const playerStatsResults = await Promise.allSettled(playerStatsPromises);
  const playerStatsMap = {};
  
  playerStatsResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.stats) {
      playerStatsMap[result.value.player_id] = result.value.stats;
    }
  });
  
  for (const [factionKey, faction] of Object.entries(matchData.teams || {})) {
    teams[factionKey] = {
      team_id: faction.team_id,
      name: faction.nickname || faction.name || `Équipe ${factionKey}`,
      avatar: faction.avatar,
      roster: (faction.roster || []).map(player => ({
        player_id: player.player_id,
        nickname: player.nickname,
        avatar: player.avatar,
        skill_level: player.skill_level,
        game_player_id: player.game_player_id,
        game_player_name: player.game_player_name,
        faceit_url: player.faceit_url,
        match_stats: matchStats ? extractPlayerMatchStats(matchStats, player.player_id) : {},
        lifetime_stats: playerStatsMap[player.player_id]?.lifetime || {}
      }))
    };
  }
  
  return {
    match_id: matchId,
    teams: teams,
    match_info: {
      game_id: matchData.game_id,
      region: matchData.region,
      status: matchData.status,
      started_at: matchData.started_at,
      finished_at: matchData.finished_at,
      results: matchData.results
    },
    optimization: 'full_mode',
    note: 'Toutes les données chargées'
  };
}

// Fonction pour extraire les stats d'un joueur depuis les stats du match
function extractPlayerMatchStats(matchStats, playerId) {
  try {
    if (matchStats.rounds && matchStats.rounds.length > 0) {
      for (const round of matchStats.rounds) {
        if (round.teams) {
          for (const team of Object.values(round.teams)) {
            if (team.players) {
              for (const player of team.players) {
                if (player.player_id === playerId) {
                  return {
                    Kills: player.player_stats?.Kills || 0,
                    Deaths: player.player_stats?.Deaths || 0,
                    ADR: player.player_stats?.ADR || 0,
                    Headshots: player.player_stats?.Headshots || 0,
                    Assists: player.player_stats?.Assists || 0,
                    Rounds: player.player_stats?.Rounds || 0,
                    KAST: player.player_stats?.KAST || 0,
                    Rating: player.player_stats?.Rating || 0
                  };
                }
              }
            }
          }
        }
      }
    }
    return {};
  } catch (error) {
    console.error('Error extracting player match stats:', error.message);
    return {};
  }
}

// Fonction pour charger les stats lifetime en arrière-plan
async function loadLifetimeStatsInBackground(teams) {
  // Cette fonction charge les stats lifetime en arrière-plan sans bloquer la réponse
  setTimeout(async () => {
    try {
      const allPlayers = [];
      for (const team of Object.values(teams)) {
        allPlayers.push(...team.roster);
      }
      
      const playerStatsPromises = allPlayers.map(player =>
        axios.get(`${FACEIT_BASE_URL}/players/${player.player_id}/stats/cs2`, { 
          headers: FACEIT_API_KEY ? headers : {} 
        })
          .then(response => ({ player_id: player.player_id, stats: response.data }))
          .catch(error => ({ player_id: player.player_id, stats: null, error: error.message }))
      );
      
      await Promise.allSettled(playerStatsPromises);
      console.log('✅ Stats lifetime chargées en arrière-plan');
    } catch (error) {
      console.error('Erreur lors du chargement en arrière-plan:', error.message);
    }
  }, 100); // Délai de 100ms pour ne pas bloquer la réponse
}

// Route pour obtenir des insights détaillés sur un match
app.get('/api/match/:matchId/insights', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log(`🔍 Génération d'insights pour le match ${matchId}`);
    const startTime = Date.now();
    
    // Récupérer les données du match
    const matchResponse = await axios.get(`${FACEIT_BASE_URL}/matches/${matchId}`, { 
      headers: FACEIT_API_KEY ? headers : {} 
    });
    const matchData = matchResponse.data;
    
    // Enrichir avec toutes les données disponibles
    const enrichedMatch = await DataEnricher.enrichMatchWithCompetitionData(matchData);
    
    // Enrichir chaque équipe avec les stats des joueurs
    for (const [factionKey, team] of Object.entries(enrichedMatch.teams)) {
      enrichedMatch.teams[factionKey] = await DataEnricher.enrichTeamWithPlayerStats(team);
      
      // Ajouter les métriques avancées
      enrichedMatch.teams[factionKey].advanced_metrics = DataEnricher.calculateAdvancedTeamMetrics(team);
    }
    
    const result = {
      match_id: matchId,
      ...enrichedMatch,
      processing_time: Date.now() - startTime,
      generated_at: new Date().toISOString()
    };
    
    console.log(`✅ Insights générés pour le match ${matchId} en ${result.processing_time}ms`);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error generating match insights:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la génération des insights du match',
      details: error.response?.data || error.message
    });
  }
});

// Route pour analyser un joueur avec des données enrichies
app.get('/api/player/:playerId/analysis', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    console.log(`🔍 Analyse enrichie du joueur ${playerId}`);
    const startTime = Date.now();
    
    // Récupérer les données de base du joueur
    const [playerData, playerStats, playerHistory] = await Promise.allSettled([
      axios.get(`${FACEIT_BASE_URL}/players/${playerId}`, { headers: FACEIT_API_KEY ? headers : {} }),
      axios.get(`${FACEIT_BASE_URL}/players/${playerId}/stats/cs2`, { headers: FACEIT_API_KEY ? headers : {} }),
      axios.get(`${FACEIT_BASE_URL}/players/${playerId}/history`, { 
        headers: FACEIT_API_KEY ? headers : {},
        params: { game: 'cs2', limit: 20 }
      })
    ]);
    
    const result = {
      player_id: playerId,
      basic_info: playerData.status === 'fulfilled' ? playerData.value.data : null,
      lifetime_stats: playerStats.status === 'fulfilled' ? playerStats.value.data.lifetime : {},
      segments: playerStats.status === 'fulfilled' ? playerStats.value.data.segments : [],
      recent_stats: playerStats.status === 'fulfilled' ? 
        DataEnricher.calculateRecentStats(playerStats.value.data.segments) : {},
      match_history: playerHistory.status === 'fulfilled' ? 
        DataNormalizer.normalizePlayerHistory(playerHistory.value.data) : {},
      analysis: {
        skill_assessment: 'À calculer',
        consistency_score: 'À calculer',
        recent_form: 'À calculer',
        strengths: 'À calculer',
        areas_for_improvement: 'À calculer'
      },
      processing_time: Date.now() - startTime,
      generated_at: new Date().toISOString()
    };
    
    console.log(`✅ Analyse du joueur ${playerId} générée en ${result.processing_time}ms`);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error analyzing player:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse du joueur',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});