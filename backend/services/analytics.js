const apiManager = require('./apiManager');

class AnalyticsService {
  constructor() {
    this.mapPool = ['Dust2', 'Mirage', 'Nuke', 'Ancient', 'Train', 'Inferno', 'Overpass', 'Vertigo', 'Anubis'];
  }

  // Analyse de performance avec données enrichies
  async analyzePlayerPerformance(playerId, days = 30) {
    const now = Math.floor(Date.now() / 1000);
    const from = now - (days * 24 * 60 * 60);
    
    // Récupérer l'historique avec pagination intelligente
    const history = await apiManager.getPlayerHistory(playerId, from, now, 50);
    const matches = history.items || [];
    
    if (matches.length === 0) {
      return this.getEmptyPerformance();
    }

    // Récupérer les stats détaillées en parallèle avec limite de concurrence
    const matchStatsPromises = matches.map(match => 
      this.getMatchStatsWithFallback(match.match_id, playerId)
    );

    const matchStats = await Promise.allSettled(matchStatsPromises);
    const validMatches = matchStats
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    return this.calculatePerformanceMetrics(validMatches, days);
  }

  async getMatchStatsWithFallback(matchId, playerId) {
    try {
      const matchStats = await apiManager.getMatchStats(matchId);
      const playerStats = this.findPlayerStatsInMatch(matchStats, playerId);
      const mapName = this.extractMapName(matchStats);
      
      return {
        match_id: matchId,
        stats: playerStats,
        map: mapName,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn(`Failed to get stats for match ${matchId}:`, error.message);
      return null;
    }
  }

  findPlayerStatsInMatch(matchStatsData, playerId) {
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
      console.error('Error finding player stats:', error.message);
      return {};
    }
  }

  extractMapName(matchStatsData) {
    try {
      if (matchStatsData.rounds && matchStatsData.rounds.length > 0) {
        return matchStatsData.rounds[0].i1 || 'Unknown';
      }
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  calculatePerformanceMetrics(matches, days) {
    if (matches.length === 0) {
      return this.getEmptyPerformance();
    }

    let totalKills = 0, totalDeaths = 0, totalADR = 0, totalHS = 0;
    let totalKAST = 0, totalRating = 0;
    let wins = 0, losses = 0;
    const results = [];
    const mapPerformance = {};
    const dailyPerformance = {};

    matches.forEach(match => {
      const stats = match.stats || {};
      const mapName = match.map || 'Unknown';
      
      // Calculer la victoire basée sur les performances
      const playerKD = this.calculateKD(stats);
      const isWinner = playerKD > 1.0; // Logique améliorée
      
      if (isWinner) wins++;
      else losses++;
      
      results.push(isWinner ? '1' : '0');
      
      // Accumuler les stats
      totalKills += parseFloat(stats.Kills) || 0;
      totalDeaths += parseFloat(stats.Deaths) || 0;
      totalADR += parseFloat(stats.ADR) || 0;
      totalHS += parseFloat(stats.Headshots) || 0;
      totalKAST += parseFloat(stats.KAST) || 0;
      totalRating += parseFloat(stats.Rating) || 0;
      
      // Performance par map
      if (!mapPerformance[mapName]) {
        mapPerformance[mapName] = {
          matches: 0, wins: 0, losses: 0,
          totalKills: 0, totalDeaths: 0, totalADR: 0, totalHS: 0
        };
      }
      
      mapPerformance[mapName].matches++;
      if (isWinner) mapPerformance[mapName].wins++;
      else mapPerformance[mapName].losses++;
      
      mapPerformance[mapName].totalKills += parseFloat(stats.Kills) || 0;
      mapPerformance[mapName].totalDeaths += parseFloat(stats.Deaths) || 0;
      mapPerformance[mapName].totalADR += parseFloat(stats.ADR) || 0;
      mapPerformance[mapName].totalHS += parseFloat(stats.Headshots) || 0;
    });

    // Calculer les moyennes
    const avgWinRate = (wins / matches.length) * 100;
    const avgKD = totalDeaths > 0 ? totalKills / totalDeaths : 0;
    const avgADR = matches.length > 0 ? totalADR / matches.length : 0;
    const avgHS = totalKills > 0 ? (totalHS / totalKills) * 100 : 0;
    const avgKAST = matches.length > 0 ? totalKAST / matches.length : 0;
    const avgRating = matches.length > 0 ? totalRating / matches.length : 0;

    // Analyser la forme récente
    const formAnalysis = this.analyzeForm(results);
    
    // Calculer les stats par map
    const mapStats = this.calculateMapStats(mapPerformance);

    return {
      period_days: days,
      total_matches: matches.length,
      wins: wins,
      losses: losses,
      win_rate: Math.round(avgWinRate),
      kd: parseFloat(avgKD.toFixed(2)),
      adr: Math.round(avgADR),
      hs_percent: Math.round(avgHS),
      kast: Math.round(avgKAST),
      rating: parseFloat(avgRating.toFixed(2)),
      form_trend: formAnalysis.trend,
      form_streak: formAnalysis.streak,
      map_performance: mapStats,
      consistency: this.calculateConsistency(matches),
      improvement_trend: this.calculateImprovementTrend(matches)
    };
  }

  calculateKD(stats) {
    const kills = parseFloat(stats.Kills) || 0;
    const deaths = parseFloat(stats.Deaths) || 0;
    return deaths > 0 ? kills / deaths : kills;
  }

  analyzeForm(results) {
    if (results.length === 0) {
      return { trend: 'neutral', streak: 0 };
    }

    let currentStreak = 0;
    let maxStreak = 0;
    let currentResult = results[0];
    
    for (const result of results) {
      if (result === currentResult) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
        currentResult = result;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);

    const wins = results.filter(r => r === '1').length;
    const winRate = (wins / results.length) * 100;
    
    let trend = 'neutral';
    if (winRate >= 70) trend = 'hot';
    else if (winRate <= 30) trend = 'cold';

    return {
      trend,
      streak: currentResult === '1' ? currentStreak : -currentStreak,
      max_streak: maxStreak,
      win_rate: Math.round(winRate)
    };
  }

  calculateMapStats(mapPerformance) {
    const mapStats = {};
    
    for (const [mapName, stats] of Object.entries(mapPerformance)) {
      if (stats.matches >= 3) { // Minimum 3 matchs pour être significatif
        const winRate = (stats.wins / stats.matches) * 100;
        const kd = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : 0;
        const adr = stats.matches > 0 ? stats.totalADR / stats.matches : 0;
        const hsPercent = stats.totalKills > 0 ? (stats.totalHS / stats.totalKills) * 100 : 0;
        
        mapStats[mapName] = {
          matches: stats.matches,
          win_rate: Math.round(winRate),
          kd: parseFloat(kd.toFixed(2)),
          adr: Math.round(adr),
          hs_percent: Math.round(hsPercent),
          confidence: this.calculateConfidence(stats.matches)
        };
      }
    }
    
    return mapStats;
  }

  calculateConfidence(matches) {
    if (matches >= 20) return 'high';
    if (matches >= 10) return 'medium';
    return 'low';
  }

  calculateConsistency(matches) {
    if (matches.length < 5) return 'insufficient_data';
    
    const ratings = matches.map(m => parseFloat(m.stats?.Rating) || 0).filter(r => r > 0);
    if (ratings.length < 3) return 'insufficient_data';
    
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - avg, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev <= 0.2) return 'very_consistent';
    if (stdDev <= 0.4) return 'consistent';
    if (stdDev <= 0.6) return 'inconsistent';
    return 'very_inconsistent';
  }

  calculateImprovementTrend(matches) {
    if (matches.length < 10) return 'insufficient_data';
    
    const recent = matches.slice(0, Math.floor(matches.length / 2));
    const older = matches.slice(Math.floor(matches.length / 2));
    
    const recentAvg = this.calculateAverageRating(recent);
    const olderAvg = this.calculateAverageRating(older);
    
    const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }

  calculateAverageRating(matches) {
    const ratings = matches.map(m => parseFloat(m.stats?.Rating) || 0).filter(r => r > 0);
    return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  }

  getEmptyPerformance() {
    return {
      period_days: 0,
      total_matches: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      kd: 0,
      adr: 0,
      hs_percent: 0,
      kast: 0,
      rating: 0,
      form_trend: 'neutral',
      form_streak: 0,
      map_performance: {},
      consistency: 'insufficient_data',
      improvement_trend: 'insufficient_data'
    };
  }

  // Analyse d'équipe avec nouvelles métriques
  async analyzeTeamPerformance(players, days = 30) {
    const playerAnalyses = await Promise.all(
      players.map(player => this.analyzePlayerPerformance(player.player_id, days))
    );

    return this.aggregateTeamMetrics(playerAnalyses);
  }

  aggregateTeamMetrics(playerAnalyses) {
    const validAnalyses = playerAnalyses.filter(a => a.total_matches > 0);
    
    if (validAnalyses.length === 0) {
      return this.getEmptyTeamPerformance();
    }

    const totalMatches = validAnalyses.reduce((sum, a) => sum + a.total_matches, 0);
    const totalWins = validAnalyses.reduce((sum, a) => sum + a.wins, 0);
    const totalLosses = validAnalyses.reduce((sum, a) => sum + a.losses, 0);
    
    const avgWinRate = (totalWins / totalMatches) * 100;
    const avgKD = validAnalyses.reduce((sum, a) => sum + a.kd, 0) / validAnalyses.length;
    const avgADR = validAnalyses.reduce((sum, a) => sum + a.adr, 0) / validAnalyses.length;
    const avgHS = validAnalyses.reduce((sum, a) => sum + a.hs_percent, 0) / validAnalyses.length;
    const avgKAST = validAnalyses.reduce((sum, a) => sum + a.kast, 0) / validAnalyses.length;
    const avgRating = validAnalyses.reduce((sum, a) => sum + a.rating, 0) / validAnalyses.length;

    // Analyser la cohérence de l'équipe
    const teamConsistency = this.analyzeTeamConsistency(validAnalyses);
    
    // Analyser les synergies
    const synergies = this.analyzeTeamSynergies(validAnalyses);

    return {
      period_days: days,
      total_matches: totalMatches,
      avg_matches_per_player: Math.round(totalMatches / validAnalyses.length),
      team_win_rate: Math.round(avgWinRate),
      team_kd: parseFloat(avgKD.toFixed(2)),
      team_adr: Math.round(avgADR),
      team_hs_percent: Math.round(avgHS),
      team_kast: Math.round(avgKAST),
      team_rating: parseFloat(avgRating.toFixed(2)),
      team_consistency: teamConsistency,
      synergies: synergies,
      hot_players: validAnalyses.filter(a => a.form_trend === 'hot').length,
      cold_players: validAnalyses.filter(a => a.form_trend === 'cold').length,
      improving_players: validAnalyses.filter(a => a.improvement_trend === 'improving').length
    };
  }

  analyzeTeamConsistency(analyses) {
    const consistencies = analyses.map(a => a.consistency);
    const consistentPlayers = consistencies.filter(c => c === 'consistent' || c === 'very_consistent').length;
    const consistencyRatio = consistentPlayers / analyses.length;
    
    if (consistencyRatio >= 0.8) return 'very_consistent';
    if (consistencyRatio >= 0.6) return 'consistent';
    if (consistencyRatio >= 0.4) return 'mixed';
    return 'inconsistent';
  }

  analyzeTeamSynergies(analyses) {
    const improvingPlayers = analyses.filter(a => a.improvement_trend === 'improving').length;
    const hotPlayers = analyses.filter(a => a.form_trend === 'hot').length;
    
    return {
      momentum: hotPlayers >= 3 ? 'high' : hotPlayers >= 2 ? 'medium' : 'low',
      development: improvingPlayers >= 3 ? 'high' : improvingPlayers >= 2 ? 'medium' : 'low',
      balance: Math.abs(hotPlayers - analyses.filter(a => a.form_trend === 'cold').length) <= 1 ? 'balanced' : 'unbalanced'
    };
  }

  getEmptyTeamPerformance() {
    return {
      period_days: 0,
      total_matches: 0,
      avg_matches_per_player: 0,
      team_win_rate: 0,
      team_kd: 0,
      team_adr: 0,
      team_hs_percent: 0,
      team_kast: 0,
      team_rating: 0,
      team_consistency: 'insufficient_data',
      synergies: { momentum: 'low', development: 'low', balance: 'unknown' },
      hot_players: 0,
      cold_players: 0,
      improving_players: 0
    };
  }
}

module.exports = new AnalyticsService();
