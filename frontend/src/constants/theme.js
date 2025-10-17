export const CS2_THEME = {
    colors: {
      primary: '#FF6B35',      // Orange CS2
      secondary: '#004E89',    // Bleu profond
      accent: '#F77F00',       // Orange vif
      success: '#06FFA5',      // Vert fluo
      warning: '#FFD23F',      // Jaune
      error: '#EF476F',        // Rouge
      dark: '#0A0E27',         // Fond sombre
      darkCard: '#1A1F3A',     // Card background
      text: '#E8E9ED',         // Texte clair
      textMuted: '#8B95A5',    // Texte secondaire
    },
    gradients: {
      primary: 'linear-gradient(135deg, #FF6B35 0%, #F77F00 100%)',
      secondary: 'linear-gradient(135deg, #004E89 0%, #1A659E 100%)',
      success: 'linear-gradient(135deg, #06FFA5 0%, #00D9FF 100%)',
      dark: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
    }
  };
  
  export const MAP_POOL = [
    { name: 'Dust2', color: '#D4A574', icon: '🏜️' },
    { name: 'Mirage', color: '#E8C468', icon: '🌴' },
    { name: 'Nuke', color: '#7B8FA3', icon: '☢️' },
    { name: 'Ancient', color: '#8B7355', icon: '🏛️' },
    { name: 'Train', color: '#5A6B7D', icon: '🚂' },
    { name: 'Inferno', color: '#C75B39', icon: '🔥' },
    { name: 'Overpass', color: '#6B8E95', icon: '🌉' }
  ];
  
  export const ROLES_CONFIG = {
    'AWPer': { color: '#FF6B35', icon: '🎯', description: 'Sniper principal' },
    'Entry Fragger': { color: '#EF476F', icon: '⚡', description: 'Premier engagé' },
    'Support': { color: '#06FFA5', icon: '🛡️', description: 'Utilitaire & backup' },
    'Clutcher': { color: '#FFD23F', icon: '👑', description: 'Specialist 1vX' },
    'Rifler': { color: '#1A659E', icon: '🎮', description: 'Polyvalent' }
  };