const axios = require('axios');
const cache = require('./cache');

class APIManager {
  constructor() {
    this.baseURL = 'https://open.faceit.com/data/v4';
    this.rateLimitDelay = 100; // 100ms entre les requêtes
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 seconde
    this.requestQueue = [];
    this.isProcessing = false;
  }

  // Rate limiting avec queue
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const { url, options, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await this.executeRequest(url, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Délai entre les requêtes
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }
    
    this.isProcessing = false;
  }

  async executeRequest(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios({
          url: `${this.baseURL}${url}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.FACEIT_API_KEY}`,
            ...options.headers
          },
          timeout: 10000, // 10 secondes timeout
          ...options
        });
        
        return response.data;
      } catch (error) {
        lastError = error;
        
        if (error.response?.status === 429) {
          // Rate limit hit, attendre plus longtemps
          const waitTime = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (error.response?.status >= 500) {
          // Erreur serveur, retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          continue;
        }
        
        // Erreur client (4xx), ne pas retry
        throw error;
      }
    }
    
    throw lastError;
  }

  // Méthodes spécialisées avec cache
  async getPlayer(nickname) {
    const cacheKey = cache.generateKey('player', nickname);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/players?nickname=${encodeURIComponent(nickname)}&game=cs2`);
    }, 3600); // 1 heure
  }

  async getPlayerStats(playerId) {
    const cacheKey = cache.generateKey('playerStats', playerId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/players/${playerId}/stats/cs2`);
    }, 1800); // 30 minutes
  }

  async getPlayerHistory(playerId, from, to, limit = 30) {
    const cacheKey = cache.generateKey('playerHistory', playerId, { from, to, limit });
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/players/${playerId}/history?game=cs2&from=${from}&to=${to}&offset=0&limit=${limit}`);
    }, 300); // 5 minutes
  }

  async getMatchStats(matchId) {
    const cacheKey = cache.generateKey('matchStats', matchId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/matches/${matchId}/stats`);
    }, 3600); // 1 heure (les stats de match ne changent pas)
  }

  async getMatchDetails(matchId) {
    const cacheKey = cache.generateKey('matchDetails', matchId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/matches/${matchId}`);
    }, 3600); // 1 heure
  }

  // Nouvelles méthodes exploitant la doc Faceit
  async getPlayerMatches(playerId, limit = 20) {
    const cacheKey = cache.generateKey('playerMatches', playerId, { limit });
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/players/${playerId}/history?game=cs2&offset=0&limit=${limit}`);
    }, 300); // 5 minutes
  }

  async getChampionshipDetails(championshipId) {
    const cacheKey = cache.generateKey('championship', championshipId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/championships/${championshipId}`);
    }, 1800); // 30 minutes
  }

  async getChampionshipMatches(championshipId) {
    const cacheKey = cache.generateKey('championshipMatches', championshipId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/championships/${championshipId}/matches`);
    }, 300); // 5 minutes
  }

  async getChampionshipSubscriptions(championshipId) {
    const cacheKey = cache.generateKey('championshipSubs', championshipId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/championships/${championshipId}/subscriptions`);
    }, 300); // 5 minutes
  }

  async getChampionshipBrackets(championshipId) {
    const cacheKey = cache.generateKey('championshipBrackets', championshipId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/championships/${championshipId}/brackets`);
    }, 300); // 5 minutes
  }

  async getChampionshipResults(championshipId) {
    const cacheKey = cache.generateKey('championshipResults', championshipId);
    return cache.getOrSet(cacheKey, async () => {
      return this.makeRequest(`/championships/${championshipId}/results`);
    }, 300); // 5 minutes
  }

  // Invalidation intelligente
  async invalidatePlayerData(playerId) {
    await cache.invalidate(`player:${playerId}`);
    await cache.invalidate(`playerStats:${playerId}`);
    await cache.invalidate(`playerHistory:${playerId}`);
    await cache.invalidate(`playerMatches:${playerId}`);
  }

  async invalidateMatchData(matchId) {
    await cache.invalidate(`matchStats:${matchId}`);
    await cache.invalidate(`matchDetails:${matchId}`);
  }
}

module.exports = new APIManager();
