// Version simplifiée de l'enrichisseur de données
class SimpleDataEnricher {
  
  // Enrichir les données d'équipe avec des calculs simples
  static enrichTeamData(teamData) {
    const roster = teamData.roster || [];
    
    if (roster.length === 0) {
      return {
        ...teamData,
        calculated_stats: {
          average_skill_level: 0,
          total_players: 0,
          premium_players: 0,
          anticheat_required: false
        }
      };
    }

    const skillLevels = roster.map(p => p.skill_level || 0).filter(s => s > 0);
    const premiumPlayers = roster.filter(p => p.membership === 'premium').length;
    const anticheatRequired = roster.some(p => p.anticheat_required);

    return {
      ...teamData,
      calculated_stats: {
        average_skill_level: skillLevels.length > 0 ? 
          Math.round(skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length) : 0,
        total_players: roster.length,
        premium_players: premiumPlayers,
        premium_percentage: Math.round((premiumPlayers / roster.length) * 100),
        anticheat_required: anticheatRequired,
        skill_range: {
          min: skillLevels.length > 0 ? Math.min(...skillLevels) : 0,
          max: skillLevels.length > 0 ? Math.max(...skillLevels) : 0
        }
      }
    };
  }

  // Enrichir les données de match avec des insights simples
  static enrichMatchData(matchData) {
    const teams = Object.values(matchData.teams || {});
    
    if (teams.length !== 2) {
      return matchData;
    }

    const [team1, team2] = teams;
    const team1Stats = team1.calculated_stats || {};
    const team2Stats = team2.calculated_stats || {};

    return {
      ...matchData,
      match_insights: {
        skill_gap: Math.abs(team1Stats.average_skill_level - team2Stats.average_skill_level),
        team_balance: this.calculateTeamBalance(team1Stats, team2Stats),
        premium_advantage: this.calculatePremiumAdvantage(team1Stats, team2Stats),
        anticheat_requirement: team1Stats.anticheat_required || team2Stats.anticheat_required,
        match_difficulty: this.predictMatchDifficulty(team1Stats, team2Stats)
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

  // Normaliser les données d'équipe
  static normalizeTeamData(faction, factionKey) {
    return {
      faction_id: faction.faction_id || factionKey,
      name: faction.name || faction.nickname || `Équipe ${factionKey}`,
      avatar: faction.avatar,
      leader: faction.leader,
      type: faction.type,
      roster: (faction.roster || faction.players || []).map(player => ({
        player_id: player.player_id,
        nickname: player.nickname,
        avatar: player.avatar,
        game_player_id: player.game_player_id,
        game_player_name: player.game_player_name,
        skill_level: player.skill_level || player.game_skill_level || 0,
        membership: player.membership,
        anticheat_required: player.anticheat_required || false,
        faceit_url: player.faceit_url
      }))
    };
  }
}

module.exports = SimpleDataEnricher;
