/**
 * Enhanced API Client with OpenAI/OpenRouter support and UI key management
 */

import OpenAI from 'openai';

// API Configuration
interface APIConfig {
  openaiKey: string;
  openrouterKey: string; // Deprecated, kept for backwards compatibility
  preferredProvider: 'openai';
  model: string;
}
// Default configuration - Using OpenAI only
const DEFAULT_CONFIG: APIConfig = {
  openaiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  openrouterKey: '',
  preferredProvider: 'openai',
  model: 'gpt-4.1-mini'
};

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

      // OpenRouter removed - using OpenAI only
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
  async testAPIKey(provider: 'openai', apiKey: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate_api_key',
          provider,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { isValid: false, error: errorData.error || 'Validation request failed' };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { 
        isValid: false, 
        error: error.message || `${provider} API key validation failed`
      };
    }
  }

  private generateCacheKey(messages: any[], model: string, temperature: number): string {
    const content = messages.map(m => m.content).join('|');
    
    // Use a simple hash function that works with all Unicode characters
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Create a cache key with the hash
    const hashString = Math.abs(hash).toString(36);
    const contentPreview = content.replace(/[^\w\s-]/g, '').slice(0, 20); // Safe characters only
    
    return `chat:${model}:${temperature}:${hashString}:${contentPreview}`;
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

      // No fallback - OpenAI only
      throw this.handleError(error);
    }
  }

  private async makeRequest(params: {
    provider: 'openai';
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature: number;
    max_tokens: number;
  }): Promise<any> {
    const { provider, model, messages, temperature, max_tokens } = params;

    try {
      const apiKey = this.config.openaiKey;
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured.');
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat_completion',
          provider,
          model,
          messages,
          temperature,
          max_tokens,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chat completion request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
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
  }> {
    const results = {
      openai: { available: false, error: undefined as string | undefined }
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

/**
 * Clean agent responses by removing Python code blocks and technical details
 * Keep only business-friendly content
 */
export function cleanAgentResponse(response: string): string {
  let cleaned = response;
  
  // Remove REPORT_DATA JSON blocks
  cleaned = cleaned.replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/gi, '');
  
  // Remove Python code blocks
  cleaned = cleaned.replace(/```python[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/gi, '');
  
  // Remove technical stack traces
  cleaned = cleaned.replace(/Traceback[\s\S]*?Error:/gi, '');
  
  // Remove import statements that leaked through
  cleaned = cleaned.replace(/^import\s+.*/gm, '');
  cleaned = cleaned.replace(/^from\s+.*import.*/gm, '');
  
  // Remove excessive newlines (more than 1 blank line)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Optimize spacing - single line break between items
  cleaned = cleaned.replace(/\n\n+/g, '\n');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Create a professional summary for multi-agent workflows
 */
export function createWorkflowSummary(agentResults: Array<{agent: string, result: any}>): string {
  const summary = ['## 📊 Analysis Complete\n'];
  
  // Extract key findings from each agent
  agentResults.forEach(({agent, result}) => {
    if (result && typeof result === 'object') {
      if (result.summary) {
        summary.push(`### ${agent}`);
        summary.push(result.summary);
        summary.push('');
      }
      if (result.keyFindings && Array.isArray(result.keyFindings)) {
        result.keyFindings.forEach((finding: string) => {
          summary.push(`• ${finding}`);
        });
        summary.push('');
      }
    }
  });
  
  return summary.join('\n');
}
