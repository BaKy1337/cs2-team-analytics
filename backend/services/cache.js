const NodeCache = require('node-cache');
const Redis = require('redis');

class CacheManager {
  constructor() {
    // Cache mémoire pour les données très fréquentes (5 minutes)
    this.memoryCache = new NodeCache({ 
      stdTTL: 300, // 5 minutes
      checkperiod: 60,
      useClones: false
    });

    // Cache Redis pour les données persistantes (24h)
    this.redisClient = null;
    this.initRedis();
  }

  async initRedis() {
    try {
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      this.redisClient.on('error', (err) => {
        console.warn('Redis connection failed, using memory cache only:', err.message);
        this.redisClient = null;
      });

      await this.redisClient.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.warn('Redis not available, using memory cache only');
      this.redisClient = null;
    }
  }

  // Générer une clé de cache intelligente
  generateKey(type, identifier, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `faceit:${type}:${identifier}${paramString ? `:${paramString}` : ''}`;
  }

  // Get avec fallback Redis -> Memory
  async get(key) {
    // Essayer d'abord le cache mémoire
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue) {
      return memoryValue;
    }

    // Si Redis disponible, essayer Redis
    if (this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          // Mettre en cache mémoire pour les prochaines requêtes
          this.memoryCache.set(key, parsed);
          return parsed;
        }
      } catch (error) {
        console.warn('Redis get error:', error.message);
      }
    }

    return null;
  }

  // Set avec double écriture Memory + Redis
  async set(key, value, ttl = null) {
    // Toujours mettre en cache mémoire
    this.memoryCache.set(key, value, ttl);

    // Si Redis disponible, mettre aussi en Redis
    if (this.redisClient) {
      try {
        const redisTTL = ttl || 86400; // 24h par défaut
        await this.redisClient.setEx(key, redisTTL, JSON.stringify(value));
      } catch (error) {
        console.warn('Redis set error:', error.message);
      }
    }
  }

  // Invalidation intelligente
  async invalidate(pattern) {
    // Invalider le cache mémoire
    const keys = this.memoryCache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    this.memoryCache.del(matchingKeys);

    // Invalider Redis si disponible
    if (this.redisClient) {
      try {
        const redisKeys = await this.redisClient.keys(`*${pattern}*`);
        if (redisKeys.length > 0) {
          await this.redisClient.del(redisKeys);
        }
      } catch (error) {
        console.warn('Redis invalidation error:', error.message);
      }
    }
  }

  // Cache avec fonction de fallback
  async getOrSet(key, fallbackFunction, ttl = null) {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const fresh = await fallbackFunction();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  // Statistiques de cache
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) * 100
      },
      redis: this.redisClient ? 'connected' : 'disconnected'
    };
  }
}

module.exports = new CacheManager();
