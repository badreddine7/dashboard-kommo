// Cache utility for Kommo aggregate data
const CACHE_PREFIX = 'kommo_aggregate_';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds (increased from 5 minutes)

export class KommoCache {
  constructor() {
    this.prefix = CACHE_PREFIX;
    this.duration = CACHE_DURATION;
  }

  // Generate cache key for a specific account
  getCacheKey(account) {
    return `${this.prefix}${account}`;
  }

  // Store data in cache with timestamp
  set(account, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        account
      };
      localStorage.setItem(this.getCacheKey(account), JSON.stringify(cacheData));
      console.log('✅ Cache stored for account:', account);
    } catch (error) {
      console.error('❌ Failed to store cache:', error);
    }
  }

  // Get data from cache if valid
  get(account) {
    try {
      const cacheKey = this.getCacheKey(account);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log('❌ No cache found for account:', account);
        return null;
      }

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const isExpired = (now - cacheData.timestamp) > this.duration;

      if (isExpired) {
        console.log('❌ Cache expired for account:', account);
        this.remove(account);
        return null;
      }

      console.log('✅ Cache hit for account:', account);
      return cacheData.data;
    } catch (error) {
      console.error('❌ Failed to read cache:', error);
      this.remove(account);
      return null;
    }
  }

  // Remove cache for specific account
  remove(account) {
    try {
      localStorage.removeItem(this.getCacheKey(account));
      console.log('🗑️ Cache removed for account:', account);
    } catch (error) {
      console.error('❌ Failed to remove cache:', error);
    }
  }

  // Clear all Kommo cache
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ All Kommo cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  // Check if cache exists and is valid
  has(account) {
    return this.get(account) !== null;
  }

  // Get cache age in seconds
  getAge(account) {
    try {
      const cacheKey = this.getCacheKey(account);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      return Math.floor((Date.now() - cacheData.timestamp) / 1000);
    } catch (error) {
      return null;
    }
  }

  // Force refresh cache (remove existing)
  refresh(account) {
    this.remove(account);
    console.log('🔄 Cache refresh requested for account:', account);
  }
}

// Export singleton instance
export const kommoCache = new KommoCache();
