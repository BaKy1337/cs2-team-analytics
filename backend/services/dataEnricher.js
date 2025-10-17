const { makeApiRequest } = require('./apiManager');
const DataNormalizer = require('./dataNormalizer');

class DataEnricher {
  
  // Enrichir les données d'un match avec des informations complémentaires
  static async enrichMatchWithCompetitionData(matchData) {
    try {
      const enriched = DataNormalizer.normalizeMatchData(matchData);
      
      // Enrichir avec les données de compétition si disponibles
      if (enriched.competition.id) {
        try {
          const competitionData = await makeApiRequest(`/competitions/${enriched.competition.id}`);
          enriched.competition = {
            ...enriched.competition,
            ...competitionData,
            prize_pool: competitionData.prize_pool,
            organizer: competitionData.organizer,
            status: competitionData.status
          };
        } catch (error) {
          console.warn(`Impossible de récupérer les données de compétition ${enriched.competition.id}:`, error.message);
        }
      }

      // Enrichir chaque équipe
      for (const [factionKey, team] of Object.entries(enriched.teams)) {
        enriched.teams[factionKey] = DataNormalizer.enrichTeamData(team);
      }

      // Ajouter les insights du match
      return DataNormalizer.enrichMatchData(enriched);
      
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des données de match:', error.message);
      return matchData;
    }
  }

  // Enrichir les données d'équipe avec les stats des joueurs
  static async enrichTeamWithPlayerStats(teamData) {
    try {
      const enrichedTeam = DataNormalizer.enrichTeamData(teamData);
      const playerStatsPromises = enrichedTeam.roster.map(async (player) => {
        try {
          const stats = await makeApiRequest(`/players/${player.player_id}/stats/cs2`);
          return {
            ...player,
            lifetime_stats: stats.lifetime || {},
            segments: stats.segments || [],
            recent_stats: this.calculateRecentStats(stats.segments || [])
          };
        } catch (error) {
          console.warn(`Impossible de récupérer les stats du joueur ${player.player_id}:`, error.message);
          return player;
        }
      });

      const enrichedRoster = await Promise.allSettled(playerStatsPromises);
      enrichedTeam.roster = enrichedRoster
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      return enrichedTeam;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des stats d\'équipe:', error.message);
      return teamData;
    }
  }

  // Calculer les stats récentes depuis les segments
  static calculateRecentStats(segments) {
    if (!segments || segments.length === 0) {
      return {
        recent_matches: 0,
        recent_win_rate: 0,
        recent_kd: 0,
        recent_adr: 0,
        recent_hs_percent: 0,
        recent_form_trend: 'neutral'
      };
    }

    // Prendre les segments les plus récents (généralement les 3 derniers)
    const recentSegments = segments.slice(0, 3);
    
    let totalMatches = 0;
    let totalWins = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalADR = 0;
    let totalHeadshots = 0;

    recentSegments.forEach(segment => {
      totalMatches += parseInt(segment.stats?.Matches || 0);
      totalWins += parseInt(segment.stats?.Wins || 0);
      totalKills += parseFloat(segment.stats?.Kills || 0);
      totalDeaths += parseFloat(segment.stats?.Deaths || 0);
      totalADR += parseFloat(segment.stats?.ADR || 0);
      totalHeadshots += parseFloat(segment.stats?.Headshots || 0);
    });

    const recentWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
    const recentKD = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : 0;
    const recentADR = recentSegments.length > 0 ? Math.round(totalADR / recentSegments.length) : 0;
    const recentHSPercent = totalKills > 0 ? Math.round((totalHeadshots / totalKills) * 100) : 0;

    return {
      recent_matches: totalMatches,
      recent_win_rate: recentWinRate,
      recent_kd: recentKD,
      recent_adr: recentADR,
      recent_hs_percent: recentHSPercent,
      recent_form_trend: this.analyzeFormTrend(recentSegments)
    };
  }

  // Analyser la tendance de forme
  static analyzeFormTrend(segments) {
    if (segments.length < 2) return 'neutral';
    
    const winRates = segments.map(s => parseFloat(s.stats?.Wins || 0) / Math.max(parseFloat(s.stats?.Matches || 1), 1));
    
    if (winRates.length >= 2) {
      const trend = winRates[0] - winRates[winRates.length - 1];
      if (trend > 0.1) return 'improving';
      if (trend < -0.1) return 'declining';
    }
    
    return 'stable';
  }

  // Enrichir avec des métriques d'équipe avancées
  static calculateAdvancedTeamMetrics(teamData) {
    const roster = teamData.roster || [];
    
    if (roster.length === 0) {
      return {
        team_synergy: 0,
        role_balance: 'Unknown',
        experience_level: 'Unknown',
        consistency_score: 0
      };
    }

    // Calculer la synergie d'équipe basée sur la cohérence des niveaux
    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    const skillConsistency = DataNormalizer.calculateSkillConsistency(skillLevels);
    
    // Analyser l'équilibre des rôles (basé sur les stats si disponibles)
    const roleBalance = this.analyzeRoleBalance(roster);
    
    // Niveau d'expérience moyen
    const experienceLevel = this.calculateExperienceLevel(roster);
    
    // Score de consistance global
    const consistencyScore = this.calculateConsistencyScore(roster);

    return {
      team_synergy: skillConsistency,
      role_balance: roleBalance,
      experience_level: experienceLevel,
      consistency_score: consistencyScore,
      team_strengths: this.identifyTeamStrengths(roster),
      potential_weaknesses: this.identifyPotentialWeaknesses(roster)
    };
  }

  // Analyser l'équilibre des rôles
  static analyzeRoleBalance(roster) {
    // Cette fonction pourrait être étendue avec des données de rôles plus détaillées
    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    
    if (skillLevels.length === 0) return 'Unknown';
    
    const avgSkill = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
    const skillRange = Math.max(...skillLevels) - Math.min(...skillLevels);
    
    if (skillRange <= 2) return 'Équilibré';
    if (skillRange <= 4) return 'Modérément équilibré';
    return 'Déséquilibré';
  }

  // Calculer le niveau d'expérience
  static calculateExperienceLevel(roster) {
    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    
    if (skillLevels.length === 0) return 'Unknown';
    
    const avgSkill = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
    
    if (avgSkill >= 8) return 'Expert';
    if (avgSkill >= 6) return 'Avancé';
    if (avgSkill >= 4) return 'Intermédiaire';
    return 'Débutant';
  }

  // Calculer le score de consistance
  static calculateConsistencyScore(roster) {
    // Basé sur la cohérence des niveaux de skill et la présence de joueurs premium
    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    const premiumPlayers = roster.filter(p => p.membership === 'premium').length;
    
    const skillConsistency = DataNormalizer.calculateSkillConsistency(skillLevels);
    const premiumBonus = (premiumPlayers / roster.length) * 20; // Bonus de 20% max pour les joueurs premium
    
    return Math.min(100, Math.round(skillConsistency + premiumBonus));
  }

  // Identifier les forces de l'équipe
  static identifyTeamStrengths(roster) {
    const strengths = [];
    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    const premiumPlayers = roster.filter(p => p.membership === 'premium').length;
    
    if (skillLevels.length > 0) {
      const avgSkill = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
      
      if (avgSkill >= 7) strengths.push('Niveau de skill élevé');
      if (premiumPlayers >= 3) strengths.push('Majorité de joueurs premium');
      if (DataNormalizer.calculateSkillConsistency(skillLevels) >= 80) strengths.push('Cohérence d\'équipe');
    }
    
    return strengths.length > 0 ? strengths : ['Équipe équilibrée'];
  }

  // Identifier les faiblesses potentielles
  static identifyPotentialWeaknesses(roster) {
    const weaknesses = [];
    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    const premiumPlayers = roster.filter(p => p.membership === 'premium').length;
    
    if (skillLevels.length > 0) {
      const avgSkill = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
      const skillRange = Math.max(...skillLevels) - Math.min(...skillLevels);
      
      if (avgSkill < 4) weaknesses.push('Niveau de skill faible');
      if (skillRange > 5) weaknesses.push('Écart de niveau important');
      if (premiumPlayers === 0) weaknesses.push('Aucun joueur premium');
    }
    
    return weaknesses.length > 0 ? weaknesses : ['Aucune faiblesse majeure identifiée'];
  }
}

module.exports = DataEnricher;
