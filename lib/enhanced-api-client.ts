/**
 * Enhanced API Client with OpenAI/OpenRouter support and UI key management
 */

import OpenAI from 'openai';

// API Configuration
interface APIConfig {
  openaiKey: string;
  openrouterKey: string;
  preferredProvider: 'openai' | 'openrouter';
  model: string;
}
// Default configuration - Using OpenRouter as primary since it's working
const DEFAULT_CONFIG: APIConfig = {
  openaiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  openrouterKey: '',
  preferredProvider: 'openrouter',
  model: 'gpt-4o-mini'
};

const OPENROUTER_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getCacheStats() {
    const now = Date.now();
    const valid = Array.from(this.cache.values()).filter(entry => now < entry.expires);
    return {
      total: this.cache.size,
      valid: valid.length,
      hitRate: valid.length / Math.max(this.cache.size, 1)
    };
  }
}

// Rate limiter
class RateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs = 60000; // 1 minute
  private maxRequests = 60; // 60 requests per minute

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requestTimes = this.requests.get(identifier)!;
    const validRequests = requestTimes.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    return validRequests.length < this.maxRequests;
  }

  recordRequest(identifier: string): void {
    const now = Date.now();
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    this.requests.get(identifier)!.push(now);
  }
}

export class EnhancedAPIClient {
  private config: APIConfig;
  private openaiClient: OpenAI | null = null;
  private openrouterClient: OpenAI | null = null;
  private cache = new APICache();
  private rateLimiter = new RateLimiter();
  private requestQueue: Array<() => Promise<void>> = [];
  private processing = false;
  private listeners: Array<(config: APIConfig) => void> = [];

  constructor() {
    // Load config from localStorage or use defaults
    this.config = this.loadConfig();
    this.initializeClients();
  }

  private loadConfig(): APIConfig {
    if (typeof window === 'undefined') {
      return DEFAULT_CONFIG;
    }

    try {
      const saved = localStorage.getItem('api-config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load API config from localStorage:', error);
    }

    return DEFAULT_CONFIG;
  }

  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('api-config', JSON.stringify(this.config));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save API config to localStorage:', error);
    }
  }

  private initializeClients(): void {
    try {
      if (this.config.openaiKey) {
        this.openaiClient = new OpenAI({
          apiKey: this.config.openaiKey,
          dangerouslyAllowBrowser: true,
        });
      }

      if (this.config.openrouterKey) {
        this.openrouterClient = new OpenAI({
          baseURL: OPENROUTER_BASE_URL,
          apiKey: this.config.openrouterKey,
          dangerouslyAllowBrowser: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize API clients:', error);
    }
  }

  // Public configuration methods
  updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.initializeClients();
  }

  getConfig(): APIConfig {
    return { ...this.config };
  }

  onConfigChange(callback: (config: APIConfig) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }

  // Test API key validity
  async testAPIKey(provider: 'openai' | 'openrouter', apiKey: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const testClient = new OpenAI({
        apiKey,
        baseURL: provider === 'openrouter' ? OPENROUTER_BASE_URL : undefined,
        dangerouslyAllowBrowser: true,
      });

      const testModel = provider === 'openrouter' ? OPENROUTER_MODEL : 'gpt-4o-mini';

      const response = await testClient.chat.completions.create({
        model: testModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      return { isValid: true };
    } catch (error: any) {
      return { 
        isValid: false, 
        error: error.message || `${provider} API key validation failed`
      };
    }
  }

  private generateCacheKey(messages: any[], model: string, temperature: number): string {
    const content = messages.map(m => m.content).join('|');
    return `chat:${model}:${temperature}:${btoa(content).slice(0, 50)}`;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await request();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  async createChatCompletion(params: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    max_tokens?: number;
    useCache?: boolean;
    retryWithFallback?: boolean;
  }): Promise<any> {
    const {
      model,
      messages,
      temperature = 0.7,
      max_tokens = 800,
      useCache = true,
      retryWithFallback = true
    } = params;

    // Check cache first
    const cacheKey = this.generateCacheKey(messages, model || this.config.model, temperature);
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { fromCache: true, ...cached };
      }
    }

    // Try primary provider first
    try {
      const result = await this.makeRequest({
        provider: this.config.preferredProvider,
        model: model || this.config.model,
        messages,
        temperature,
        max_tokens
      });

      if (useCache) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.warn(`${this.config.preferredProvider} request failed:`, error);

      // Try fallback provider if enabled
      if (retryWithFallback) {
        const fallbackProvider = this.config.preferredProvider === 'openai' ? 'openrouter' : 'openai';
        const fallbackModel = fallbackProvider === 'openrouter' ? OPENROUTER_MODEL : 'gpt-4o-mini';

        try {
          console.log(`Falling back to ${fallbackProvider}...`);
          const result = await this.makeRequest({
            provider: fallbackProvider,
            model: fallbackModel,
            messages,
            temperature,
            max_tokens
          });

          if (useCache) {
            this.cache.set(cacheKey, result);
          }

          return { ...result, fallbackUsed: true, fallbackProvider };
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw this.handleError(fallbackError);
        }
      } else {
        throw this.handleError(error);
      }
    }
  }

  private async makeRequest(params: {
    provider: 'openai' | 'openrouter';
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature: number;
    max_tokens: number;
  }): Promise<any> {
    const { provider, model, messages, temperature, max_tokens } = params;
    
    const client = provider === 'openai' ? this.openaiClient : this.openrouterClient;
    if (!client) {
      throw new Error(`${provider} client not initialized. Please check your API key.`);
    }

    // Rate limiting check
    const identifier = `${provider}-chat`;
    if (!this.rateLimiter.canMakeRequest(identifier)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          this.rateLimiter.recordRequest(identifier);
          
          const completion = await client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens,
          });

          const response = {
            id: completion.id,
            choices: completion.choices,
            usage: completion.usage,
            model: completion.model,
            provider
          };

          resolve(response);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(request);
      this.processQueue();
    });
  }

  private handleError(error: any): Error {
    if (error.status === 429) {
      return new Error('Rate limit exceeded. Please wait a moment before trying again.');
    } else if (error.status === 401) {
      return new Error('Invalid API key. Please check your configuration in settings.');
    } else if (error.status >= 500) {
      return new Error('AI service temporarily unavailable. Please try again later.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('Network connection failed. Please check your internet connection.');
    }
    
    return new Error(error.message || 'An unexpected error occurred with the AI service.');
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }

  clearCache(): void {
    this.cache.clear();
  }

  getQueueSize(): number {
    return this.requestQueue.length;
  }

  // Health check for both providers
  async healthCheck(): Promise<{
    openai: { available: boolean; error?: string };
    openrouter: { available: boolean; error?: string };
  }> {
    const results = {
      openai: { available: false, error: undefined as string | undefined },
      openrouter: { available: false, error: undefined as string | undefined }
    };

    // Test OpenAI
    if (this.config.openaiKey) {
      const openaiTest = await this.testAPIKey('openai', this.config.openaiKey);
      results.openai.available = openaiTest.isValid;
      if (!openaiTest.isValid) {
        results.openai.error = openaiTest.error;
      }
    } else {
      results.openai.error = 'No API key configured';
    }

    // Test OpenRouter
    if (this.config.openrouterKey) {
      const openrouterTest = await this.testAPIKey('openrouter', this.config.openrouterKey);
      results.openrouter.available = openrouterTest.isValid;
      if (!openrouterTest.isValid) {
        results.openrouter.error = openrouterTest.error;
      }
    } else {
      results.openrouter.error = 'No API key configured';
    }

    return results;
  }
}

// Singleton instance
export const enhancedAPIClient = new EnhancedAPIClient();

// Utility functions
export function validateChatMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message must be a non-empty string' };
  }
  
  if (message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 10000) {
    return { isValid: false, error: 'Message is too long (max 10,000 characters)' };
  }
  
  return { isValid: true };
}

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
