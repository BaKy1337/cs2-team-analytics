const axios = require('axios');

class PerformanceTester {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.results = [];
  }

  async testTeamAnalysis(nicknames, iterations = 5) {
    console.log(`🧪 Test de performance: Analyse d'équipe (${iterations} itérations)`);
    console.log(`👥 Joueurs: ${nicknames.join(', ')}`);
    
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await axios.post(`${this.baseURL}/api/team/analyze`, {
          nicknames: nicknames
        });
        
        const duration = Date.now() - start;
        times.push(duration);
        
        console.log(`  Iteration ${i + 1}: ${duration}ms (${response.status})`);
        
        // Attendre 1 seconde entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  Iteration ${i + 1}: ERREUR - ${error.message}`);
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`📊 Résultats:`);
      console.log(`  Temps moyen: ${Math.round(avgTime)}ms`);
      console.log(`  Temps min: ${minTime}ms`);
      console.log(`  Temps max: ${maxTime}ms`);
      console.log(`  Succès: ${times.length}/${iterations}`);
      
      this.results.push({
        test: 'team_analysis',
        avg_time: avgTime,
        min_time: minTime,
        max_time: maxTime,
        success_rate: times.length / iterations
      });
    }
  }

  async testCacheStats() {
    console.log(`📊 Test des statistiques de cache`);
    
    try {
      const response = await axios.get(`${this.baseURL}/api/cache/stats`);
      console.log(`  Cache stats:`, response.data);
    } catch (error) {
      console.error(`  Erreur cache stats: ${error.message}`);
    }
  }

  async testHealth() {
    console.log(`🏥 Test de santé du serveur`);
    
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      console.log(`  Status: ${response.data.status}`);
      console.log(`  Uptime: ${Math.round(response.data.uptime)}s`);
      console.log(`  Cache: ${response.data.cache.redis}`);
    } catch (error) {
      console.error(`  Erreur health check: ${error.message}`);
    }
  }

  async runFullTest() {
    console.log(`🚀 Démarrage des tests de performance\n`);
    
    await this.testHealth();
    console.log('');
    
    await this.testCacheStats();
    console.log('');
    
    // Test avec différents nombres de joueurs
    await this.testTeamAnalysis(['FARIDZ', 'Cugiiii', 'MelMA'], 3);
    console.log('');
    
    await this.testTeamAnalysis(['FARIDZ', 'Cugiiii', 'MelMA', 'Tomassenz', 'deratisatioN'], 3);
    console.log('');
    
    console.log(`📋 Résumé des tests:`);
    this.results.forEach(result => {
      console.log(`  ${result.test}: ${Math.round(result.avg_time)}ms (${Math.round(result.success_rate * 100)}% succès)`);
    });
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runFullTest().catch(console.error);
}

module.exports = PerformanceTester;
