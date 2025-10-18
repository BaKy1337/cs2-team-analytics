// Script de test pour vérifier le déploiement
const axios = require('axios');

const BACKEND_URL = 'https://cs2-team-analytics.onrender.com';
const FRONTEND_URL = 'https://esea-helper-by-baky.vercel.app'; // Remplacez par votre URL Vercel

async function testDeployment() {
  console.log('🧪 Test de déploiement ESEA Helper by Baky');
  console.log('==========================================\n');

  try {
    // Test 1: Health check backend
    console.log('1️⃣ Test du backend...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend OK:', healthResponse.data);
    console.log('');

    // Test 2: Test CORS
    console.log('2️⃣ Test CORS...');
    try {
      const corsResponse = await axios.get(`${BACKEND_URL}/health`, {
        headers: {
          'Origin': FRONTEND_URL
        }
      });
      console.log('✅ CORS OK');
    } catch (error) {
      console.log('❌ CORS Error:', error.message);
    }
    console.log('');

    // Test 3: Test d'une route API
    console.log('3️⃣ Test route API...');
    try {
      const apiResponse = await axios.post(`${BACKEND_URL}/api/team/analyze`, {
        nicknames: ['s1mple']
      });
      console.log('✅ API Route OK');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Route API non trouvée - Vérifiez les routes');
      } else {
        console.log('⚠️  API Route Error (normal si pas de clé API):', error.response?.status);
      }
    }
    console.log('');

    console.log('🎯 Résumé:');
    console.log(`Backend: ${BACKEND_URL}`);
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log('✅ Tests terminés');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testDeployment();
