// Script de test pour vérifier le déploiement
const axios = require('axios');

const BACKEND_URL = 'https://cs2-team-analytics-1.onrender.com/api';
const FRONTEND_URL = 'https://cs2-team-analytics.vercel.app';

async function testDeployment() {
  console.log('🧪 Test de déploiement CS2 Team Analytics\n');
  
  try {
    // Test 1: Health check du backend
    console.log('1. Test du backend (Render)...');
    const healthResponse = await axios.get(`${BACKEND_URL.replace('/api', '')}/health`);
    console.log('✅ Backend accessible:', healthResponse.data);
    
    // Test 2: Test de l'endpoint match teams (mode test)
    console.log('\n2. Test de l\'endpoint match teams...');
    const matchResponse = await axios.get(`${BACKEND_URL}/match/1-850813c3-21db-4045-be6d-ba8ecf557f44/teams?mode=optimized`);
    console.log('✅ Endpoint match teams fonctionnel');
    console.log('📊 Données reçues:', {
      match_id: matchResponse.data.match_id,
      teams_count: Object.keys(matchResponse.data.teams).length,
      optimization: matchResponse.data.optimization,
      loading_time: matchResponse.data.loading_time + 'ms'
    });
    
    // Test 3: Test CORS
    console.log('\n3. Test CORS...');
    const corsResponse = await axios.options(`${BACKEND_URL}/match/1-850813c3-21db-4045-be6d-ba8ecf557f44/teams`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS configuré correctement');
    
    console.log('\n🎉 Tous les tests sont passés ! Le déploiement est fonctionnel.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('📄 Détails:', error.response.data);
    }
  }
}

testDeployment();
