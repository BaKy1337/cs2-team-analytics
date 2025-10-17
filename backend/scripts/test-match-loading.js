const axios = require('axios');

class MatchLoadingTester {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.testMatchId = '1-efaf591a-684f-4c55-bb42-e0c2de717ec5'; // Match de test
  }

  async testLoadingMode(mode, iterations = 3) {
    console.log(`\n🧪 Test du mode: ${mode.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const times = [];
    const errors = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await axios.get(`${this.baseURL}/api/match/${this.testMatchId}/teams?mode=${mode}`);
        const duration = Date.now() - start;
        times.push(duration);
        
        console.log(`  Iteration ${i + 1}: ${duration}ms`);
        console.log(`    - Temps de chargement: ${response.data.loading_time || 'N/A'}ms`);
        console.log(`    - Mode d'optimisation: ${response.data.optimization || 'N/A'}`);
        console.log(`    - Joueurs chargés: ${response.data.teams ? Object.keys(response.data.teams).length * 5 : 'N/A'}`);
        
        // Attendre 1 seconde entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errors.push(error.message);
        console.error(`  Iteration ${i + 1}: ERREUR - ${error.message}`);
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n📊 Résultats pour le mode ${mode}:`);
      console.log(`  Temps moyen: ${Math.round(avgTime)}ms`);
      console.log(`  Temps min: ${minTime}ms`);
      console.log(`  Temps max: ${maxTime}ms`);
      console.log(`  Succès: ${times.length}/${iterations}`);
      
      if (errors.length > 0) {
        console.log(`  Erreurs: ${errors.length}`);
      }
      
      return {
        mode,
        avgTime,
        minTime,
        maxTime,
        successRate: times.length / iterations,
        errors: errors.length
      };
    }
    
    return {
      mode,
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
      successRate: 0,
      errors: errors.length
    };
  }

  async testAllModes() {
    console.log('🚀 Test de performance des modes de chargement par Match ID');
    console.log('='.repeat(60));
    
    const modes = ['ultrafast', 'optimized', 'full'];
    const results = [];
    
    for (const mode of modes) {
      const result = await this.testLoadingMode(mode, 3);
      results.push(result);
    }
    
    // Comparaison des résultats
    console.log('\n🏆 COMPARAISON DES MODES');
    console.log('='.repeat(60));
    
    results.forEach(result => {
      const speed = result.avgTime < 1000 ? '⚡' : result.avgTime < 3000 ? '🚀' : '🐌';
      const reliability = result.successRate === 1 ? '✅' : result.successRate > 0.8 ? '⚠️' : '❌';
      
      console.log(`${speed} ${result.mode.toUpperCase()}:`);
      console.log(`  Temps moyen: ${Math.round(result.avgTime)}ms`);
      console.log(`  Fiabilité: ${Math.round(result.successRate * 100)}% ${reliability}`);
      console.log(`  Erreurs: ${result.errors}`);
      console.log('');
    });
    
    // Recommandations
    console.log('💡 RECOMMANDATIONS');
    console.log('='.repeat(60));
    
    const fastest = results.reduce((prev, current) => 
      prev.avgTime < current.avgTime ? prev : current
    );
    
    const mostReliable = results.reduce((prev, current) => 
      prev.successRate > current.successRate ? prev : current
    );
    
    console.log(`🏃 Mode le plus rapide: ${fastest.mode} (${Math.round(fastest.avgTime)}ms)`);
    console.log(`🛡️ Mode le plus fiable: ${mostReliable.mode} (${Math.round(mostReliable.successRate * 100)}%)`);
    
    if (fastest.mode === 'ultrafast') {
      console.log('\n🎯 RECOMMANDATION: Utiliser le mode "ultrafast" pour une expérience utilisateur optimale');
      console.log('   - Chargement instantané (< 500ms)');
      console.log('   - Données minimales mais suffisantes');
      console.log('   - Stats lifetime chargées en arrière-plan');
    } else if (fastest.mode === 'optimized') {
      console.log('\n🎯 RECOMMANDATION: Utiliser le mode "optimized" pour un bon équilibre');
      console.log('   - Chargement rapide (1-2s)');
      console.log('   - Données essentielles incluses');
      console.log('   - Pré-chargement intelligent en arrière-plan');
    }
    
    return results;
  }

  async testCachePerformance() {
    console.log('\n📊 Test de performance du cache');
    console.log('='.repeat(50));
    
    // Premier appel (pas de cache)
    console.log('Premier appel (pas de cache):');
    const start1 = Date.now();
    await axios.get(`${this.baseURL}/api/match/${this.testMatchId}/teams?mode=optimized`);
    const time1 = Date.now() - start1;
    console.log(`  Temps: ${time1}ms`);
    
    // Deuxième appel (avec cache)
    console.log('\nDeuxième appel (avec cache):');
    const start2 = Date.now();
    await axios.get(`${this.baseURL}/api/match/${this.testMatchId}/teams?mode=optimized`);
    const time2 = Date.now() - start2;
    console.log(`  Temps: ${time2}ms`);
    
    const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
    console.log(`\n🚀 Amélioration grâce au cache: ${improvement}%`);
    
    if (time2 < 100) {
      console.log('✅ Cache très efficace (< 100ms)');
    } else if (time2 < 500) {
      console.log('✅ Cache efficace (< 500ms)');
    } else {
      console.log('⚠️ Cache peu efficace (> 500ms)');
    }
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tester = new MatchLoadingTester();
  
  async function runTests() {
    try {
      await tester.testAllModes();
      await tester.testCachePerformance();
    } catch (error) {
      console.error('Erreur lors des tests:', error.message);
    }
  }
  
  runTests();
}

module.exports = MatchLoadingTester;
