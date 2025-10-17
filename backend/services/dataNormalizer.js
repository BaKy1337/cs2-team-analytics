const { makeApiRequest } = require('./apiManager');

class DataNormalizer {
  
  // Normaliser les données d'un match pour une structure cohérente
  static normalizeMatchData(matchData) {
    const normalized = {
      match_id: matchData.match_id,
      game: matchData.game,
      region: matchData.region,
      status: matchData.status,
      competition: {
        id: matchData.competition_id,
        name: matchData.competition_name,
        type: matchData.competition_type
      },
      organizer: {
        id: matchData.organizer_id
      },
      timing: {
        scheduled_at: matchData.scheduled_at,
        started_at: matchData.started_at,
        finished_at: matchData.finished_at,
        duration: matchData.finished_at ? matchData.finished_at - matchData.started_at : null
      },
      results: {
        winner: matchData.results?.winner,
        score: matchData.results?.score,
        detailed_results: matchData.detailed_results
      },
      teams: {},
      metadata: {
        best_of: matchData.best_of,
        calculate_elo: matchData.calculate_elo,
        faceit_url: matchData.faceit_url,
        demo_urls: matchData.demo_url || []
      }
    };

    // Normaliser les équipes avec structure cohérente
    for (const [factionKey, faction] of Object.entries(matchData.teams || {})) {
      normalized.teams[factionKey] = this.normalizeTeamData(faction, factionKey);
    }

    return normalized;
  }

  // Normaliser les données d'une équipe
  static normalizeTeamData(faction, factionKey) {
    return {
      faction_id: faction.faction_id || factionKey,
      name: faction.name || faction.nickname || `Équipe ${factionKey}`,
      avatar: faction.avatar,
      leader: faction.leader,
      type: faction.type,
      stats: faction.stats || {},
      roster: this.normalizeRosterData(faction.roster || faction.players || []),
      metadata: {
        substituted: faction.substituted || false,
        anticheat_required: this.checkAnticheatRequirement(faction.roster || faction.players || [])
      }
    };
  }

  // Normaliser les données des joueurs
  static normalizeRosterData(roster) {
    return roster.map(player => ({
      player_id: player.player_id,
      nickname: player.nickname,
      avatar: player.avatar,
      game_player_id: player.game_player_id,
      game_player_name: player.game_player_name,
      skill_level: player.skill_level || player.game_skill_level || 0,
      membership: player.membership,
      anticheat_required: player.anticheat_required || false,
      faceit_url: player.faceit_url
    }));
  }

  // Vérifier si l'anticheat est requis pour l'équipe
  static checkAnticheatRequirement(roster) {
    return roster.some(player => player.anticheat_required === true);
  }

  // Enrichir les données d'équipe avec des calculs avancés
  static enrichTeamData(team) {
    const roster = team.roster || [];
    
    if (roster.length === 0) {
      return {
        ...team,
        calculated_stats: {
          average_skill_level: 0,
          skill_level_range: { min: 0, max: 0 },
          total_players: 0,
          premium_players: 0,
          anticheat_required: false
        }
      };
    }

    const skillLevels = roster.map(p => p.skill_level).filter(s => s > 0);
    const premiumPlayers = roster.filter(p => p.membership === 'premium').length;
    const anticheatRequired = roster.some(p => p.anticheat_required);

    return {
      ...team,
      calculated_stats: {
        average_skill_level: skillLevels.length > 0 ? 
          Math.round(skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length) : 0,
        skill_level_range: {
          min: skillLevels.length > 0 ? Math.min(...skillLevels) : 0,
          max: skillLevels.length > 0 ? Math.max(...skillLevels) : 0
        },
        total_players: roster.length,
        premium_players: premiumPlayers,
        premium_percentage: Math.round((premiumPlayers / roster.length) * 100),
        anticheat_required: anticheatRequired,
        skill_consistency: this.calculateSkillConsistency(skillLevels)
      }
    };
  }

  // Calculer la cohérence des niveaux de skill
  static calculateSkillConsistency(skillLevels) {
    if (skillLevels.length < 2) return 100;
    
    const avg = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
    const variance = skillLevels.reduce((sum, level) => sum + Math.pow(level - avg, 2), 0) / skillLevels.length;
    const stdDev = Math.sqrt(variance);
    
    // Plus l'écart-type est faible, plus la cohérence est élevée
    return Math.max(0, Math.round(100 - (stdDev * 10)));
  }

  // Enrichir les données de match avec des insights
  static enrichMatchData(normalizedMatch) {
    const teams = Object.values(normalizedMatch.teams);
    
    if (teams.length !== 2) {
      return normalizedMatch;
    }

    const [team1, team2] = teams;
    const team1Stats = team1.calculated_stats || {};
    const team2Stats = team2.calculated_stats || {};

    return {
      ...normalizedMatch,
      match_insights: {
        skill_gap: Math.abs(team1Stats.average_skill_level - team2Stats.average_skill_level),
        team_balance: this.calculateTeamBalance(team1Stats, team2Stats),
        premium_advantage: this.calculatePremiumAdvantage(team1Stats, team2Stats),
        anticheat_requirement: team1Stats.anticheat_required || team2Stats.anticheat_required,
        predicted_difficulty: this.predictMatchDifficulty(team1Stats, team2Stats)
      }
    };
  }

  // Calculer l'équilibre entre les équipes
  static calculateTeamBalance(team1Stats, team2Stats) {
    const skillDiff = Math.abs(team1Stats.average_skill_level - team2Stats.average_skill_level);
    
    if (skillDiff <= 1) return 'Équilibré';
    if (skillDiff <= 3) return 'Légèrement déséquilibré';
    if (skillDiff <= 5) return 'Déséquilibré';
    return 'Très déséquilibré';
  }

  // Calculer l'avantage premium
  static calculatePremiumAdvantage(team1Stats, team2Stats) {
    const team1Premium = team1Stats.premium_percentage || 0;
    const team2Premium = team2Stats.premium_percentage || 0;
    
    if (Math.abs(team1Premium - team2Premium) <= 20) return 'Équilibré';
    
    return team1Premium > team2Premium ? 'Équipe 1' : 'Équipe 2';
  }

  // Prédire la difficulté du match
  static predictMatchDifficulty(team1Stats, team2Stats) {
    const avgSkill = (team1Stats.average_skill_level + team2Stats.average_skill_level) / 2;
    const skillGap = Math.abs(team1Stats.average_skill_level - team2Stats.average_skill_level);
    
    if (avgSkill >= 8 && skillGap <= 2) return 'Très difficile';
    if (avgSkill >= 6 && skillGap <= 3) return 'Difficile';
    if (avgSkill >= 4 && skillGap <= 4) return 'Moyen';
    return 'Facile';
  }

  // Normaliser les données d'historique de joueur
  static normalizePlayerHistory(historyData) {
    return {
      total_matches: historyData.items?.length || 0,
      matches: (historyData.items || []).map(match => ({
        match_id: match.match_id,
        game: match.game,
        region: match.region,
        status: match.status,
        competition: {
          name: match.competition_name,
          type: match.competition_type
        },
        timing: {
          started_at: match.started_at,
          finished_at: match.finished_at,
          duration: match.finished_at ? match.finished_at - match.started_at : null
        },
        results: match.results,
        teams: this.normalizeTeamsFromHistory(match.teams)
      }))
    };
  }

  // Normaliser les équipes depuis l'historique
  static normalizeTeamsFromHistory(teams) {
    const normalized = {};
    
    for (const [factionKey, faction] of Object.entries(teams || {})) {
      normalized[factionKey] = {
        name: faction.nickname || `Équipe ${factionKey}`,
        avatar: faction.avatar,
        players: (faction.players || []).map(player => ({
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar,
          skill_level: player.skill_level
        }))
      };
    }
    
    return normalized;
  }
}

module.exports = DataNormalizer;
