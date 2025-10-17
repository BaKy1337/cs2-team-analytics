const apiManager = require('./apiManager');
const cache = require('./cache');

class MatchOptimizer {
  constructor() {
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  // Optimisation principale : chargement par match ID
  async loadMatchTeamsOptimized(matchId) {
    const cacheKey = `match:${matchId}:teams`;
    
    // 1. Vérifier le cache d'abord
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Match ${matchId} trouvé en cache`);
      return cached;
    }

    console.log(`🔄 Chargement optimisé du match ${matchId}`);
    const startTime = Date.now();

    try {
      // 2. Récupérer les détails du match (1 requête)
      const matchDetails = await apiManager.getMatchDetails(matchId);
      
      // 3. Récupérer les stats du match (1 requête)
      const matchStats = await apiManager.getMatchStats(matchId);
      
      // 4. Extraire les données des joueurs directement des stats du match
      const teams = this.extractTeamsFromMatchData(matchDetails, matchStats);
      
      // 5. Charger les stats lifetime en parallèle (10 requêtes max)
      const playerStatsPromises = teams.faction1.roster
        .concat(teams.faction2.roster)
        .map(player => this.getPlayerStatsOptimized(player.player_id));
      
      const playerStats = await Promise.allSettled(playerStatsPromises);
      
      // 6. Enrichir les données des joueurs
      teams.faction1.roster = teams.faction1.roster.map((player, index) => ({
        ...player,
        lifetime_stats: playerStats[index]?.value?.lifetime || {},
        match_stats: this.extractPlayerMatchStats(matchStats, player.player_id)
      }));
      
      teams.faction2.roster = teams.faction2.roster.map((player, index) => ({
        ...player,
        lifetime_stats: playerStats[index + 5]?.value?.lifetime || {},
        match_stats: this.extractPlayerMatchStats(matchStats, player.player_id)
      }));

      const result = {
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
        loading_time: Date.now() - startTime,
        optimization: 'fast_mode'
      };

      // 7. Mettre en cache pour 1 heure
      await cache.set(cacheKey, result, 3600);
      
      console.log(`✅ Match ${matchId} chargé en ${result.loading_time}ms`);
      
      // 8. Pré-charger les données récentes en arrière-plan
      this.preloadRecentData(teams.faction1.roster.concat(teams.faction2.roster));
      
      return result;
      
    } catch (error) {
      console.error(`❌ Erreur lors du chargement du match ${matchId}:`, error.message);
      throw error;
    }
  }

  // Extraction des équipes depuis les données du match
  extractTeamsFromMatchData(matchDetails, matchStats) {
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
    
    return teams;
  }

  // Extraction des stats du joueur depuis les stats du match
  extractPlayerMatchStats(matchStats, playerId) {
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

  // Récupération optimisée des stats du joueur
  async getPlayerStatsOptimized(playerId) {
    const cacheKey = `player:${playerId}:stats`;
    
    // Vérifier le cache d'abord
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const stats = await apiManager.getPlayerStats(playerId);
      // Mettre en cache pour 30 minutes
      await cache.set(cacheKey, stats, 1800);
      return stats;
    } catch (error) {
      console.warn(`Failed to get stats for player ${playerId}:`, error.message);
      return null;
    }
  }

  // Pré-chargement des données récentes en arrière-plan
  async preloadRecentData(players) {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🔄 Pré-chargement des données récentes en arrière-plan...');
    
    try {
      // Pré-charger les stats récentes pour les 5 premiers joueurs seulement
      const topPlayers = players.slice(0, 5);
      
      const recentStatsPromises = topPlayers.map(player => 
        this.preloadPlayerRecentStats(player.player_id)
      );
      
      await Promise.allSettled(recentStatsPromises);
      
      console.log('✅ Pré-chargement terminé');
    } catch (error) {
      console.error('Erreur lors du pré-chargement:', error.message);
    } finally {
      this.isPreloading = false;
    }
  }

  // Pré-chargement des stats récentes d'un joueur
  async preloadPlayerRecentStats(playerId) {
    const cacheKey = `player:${playerId}:recent`;
    
    // Vérifier si déjà en cache
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      const now = Math.floor(Date.now() / 1000);
      
      // Récupérer seulement l'historique (pas les stats détaillées)
      const history = await apiManager.getPlayerHistory(playerId, thirtyDaysAgo, now, 10);
      
      // Calculer les stats récentes basiques
      const recentStats = this.calculateBasicRecentStats(history.items || []);
      
      // Mettre en cache pour 10 minutes
      await cache.set(cacheKey, recentStats, 600);
      
      return recentStats;
    } catch (error) {
      console.warn(`Failed to preload recent stats for player ${playerId}:`, error.message);
      return null;
    }
  }

  // Calcul des stats récentes basiques (sans stats détaillées)
  calculateBasicRecentStats(matches) {
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

    // Utiliser les données disponibles dans l'historique
    let wins = 0;
    let losses = 0;
    
    matches.forEach(match => {
      // Logique simplifiée basée sur les résultats du match
      if (match.results && match.results.winner) {
        // Pour l'instant, on ne peut pas déterminer facilement si le joueur a gagné
        // On utilise une estimation basée sur la position dans l'équipe
        wins += 0.5; // Estimation
        losses += 0.5;
      }
    });

    return {
      recent_matches: matches.length,
      recent_wins: Math.round(wins),
      recent_losses: Math.round(losses),
      recent_win_rate: Math.round((wins / matches.length) * 100),
      recent_kd: 1.0, // Estimation
      recent_adr: 75, // Estimation
      recent_hs_percent: 45, // Estimation
      recent_form_trend: 'neutral',
      recent_streak: 0
    };
  }

  // Mode ultra-rapide : données minimales
  async loadMatchTeamsUltraFast(matchId) {
    const cacheKey = `match:${matchId}:ultrafast`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    console.log(`⚡ Chargement ultra-rapide du match ${matchId}`);
    const startTime = Date.now();

    try {
      // Seulement 2 requêtes : détails + stats du match
      const [matchDetails, matchStats] = await Promise.all([
        apiManager.getMatchDetails(matchId),
        apiManager.getMatchStats(matchId)
      ]);
      
      const teams = this.extractTeamsFromMatchData(matchDetails, matchStats);
      
      // Enrichir avec les stats du match uniquement
      teams.faction1.roster = teams.faction1.roster.map(player => ({
        ...player,
        match_stats: this.extractPlayerMatchStats(matchStats, player.player_id),
        lifetime_stats: {} // Sera chargé plus tard si nécessaire
      }));
      
      teams.faction2.roster = teams.faction2.roster.map(player => ({
        ...player,
        match_stats: this.extractPlayerMatchStats(matchStats, player.player_id),
        lifetime_stats: {} // Sera chargé plus tard si nécessaire
      }));

      const result = {
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
        loading_time: Date.now() - startTime,
        optimization: 'ultra_fast_mode',
        note: 'Données minimales - stats lifetime à charger séparément'
      };

      // Cache pour 2 heures
      await cache.set(cacheKey, result, 7200);
      
      console.log(`⚡ Match ${matchId} chargé en ${result.loading_time}ms (mode ultra-rapide)`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Erreur lors du chargement ultra-rapide du match ${matchId}:`, error.message);
      throw error;
    }
  }

  // Statistiques de performance
  getPerformanceStats() {
    return {
      cache_hit_rate: cache.getStats().memory.hitRate,
      preload_queue_size: this.preloadQueue.length,
      is_preloading: this.isPreloading
    };
  }
}

module.exports = new MatchOptimizer();
