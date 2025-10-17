const axios = require('axios');

// Test des améliorations de données
async function testDataImprovements() {
  console.log('🧪 Test des améliorations de données Faceit');
  console.log('='.repeat(50));
  
  const matchId = '1-850813c3-21db-4045-be6d-ba8ecf557f44';
  
  try {
    // Test 1: Route ultra-rapide avec données enrichies
    console.log('\n1️⃣ Test route ultra-rapide enrichie...');
    const start1 = Date.now();
    const response1 = await axios.get(`http://localhost:5000/api/match/${matchId}/teams?mode=ultrafast`);
    const time1 = Date.now() - start1;
    
    console.log(`✅ Temps de réponse: ${time1}ms`);
    console.log(`📊 Données retournées:`, {
      match_id: response1.data.match_id,
      teams_count: Object.keys(response1.data.teams || {}).length,
      has_match_insights: !!response1.data.match_insights,
      has_competition_info: !!response1.data.match_info?.competition,
      optimization: response1.data.optimization
    });
    
    // Test 2: Route insights détaillés
    console.log('\n2️⃣ Test route insights détaillés...');
    const start2 = Date.now();
    const response2 = await axios.get(`http://localhost:5000/api/match/${matchId}/insights`);
    const time2 = Date.now() - start2;
    
    console.log(`✅ Temps de réponse: ${time2}ms`);
    console.log(`📊 Données enrichies:`, {
      match_id: response2.data.match_id,
      processing_time: response2.data.processing_time,
      teams_with_advanced_metrics: Object.values(response2.data.teams || {}).filter(t => t.advanced_metrics).length,
      has_match_insights: !!response2.data.match_insights
    });
    
    // Test 3: Analyse d'un joueur
    console.log('\n3️⃣ Test analyse de joueur...');
    const playerId = '4ac375ef-cf95-45ef-8c83-bd7905cc5708'; // FARIDZ
    const start3 = Date.now();
    const response3 = await axios.get(`http://localhost:5000/api/player/${playerId}/analysis`);
    const time3 = Date.now() - start3;
    
    console.log(`✅ Temps de réponse: ${time3}ms`);
    console.log(`📊 Analyse joueur:`, {
      player_id: response3.data.player_id,
      has_basic_info: !!response3.data.basic_info,
      has_lifetime_stats: !!response3.data.lifetime_stats,
      has_recent_stats: !!response3.data.recent_stats,
      has_match_history: !!response3.data.match_history,
      processing_time: response3.data.processing_time
    });
    
    console.log('\n🎯 Résumé des améliorations:');
    console.log(`• Route ultra-rapide: ${time1}ms (données enrichies)`);
    console.log(`• Route insights: ${time2}ms (analyse complète)`);
    console.log(`• Analyse joueur: ${time3}ms (profil détaillé)`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

// Exécuter les tests
testDataImprovements();
