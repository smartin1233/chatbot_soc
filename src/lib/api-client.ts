/**
 * Zentere API Client for fetching Business Units and Lines of Business
 */

const API_BASE_URL = "https://app-api-dev.zentere.com/api/v2";
const CLIENT_ID = "kLPrcbXlsHYelbpm5HzKg8ZgDE2rVXRhGyJ0GdqH";
const CLIENT_SECRET = "IbqUkvq1hWTuc6jK7X6xGClTLThshJhfU6nf7uYm";

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface DataFeedRecord {
  id: number;
  business_unit_id: [number, string] | false;
  lob_id: [number, string] | false;
  [key: string]: any;
}

export class ZentereAPIClient {
  private accessToken: string | null = null;
  private tokenType: string = "Bearer";

  async authenticate(username: string, password: string): Promise<void> {
    try {
      // Use Next.js API proxy to avoid CORS issues
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'authenticate',
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Authentication failed:', errorData);
        throw new Error(errorData.error || `Authentication failed: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenType = data.token_type || "Bearer";
      
      console.log('✅ Authentication successful, token received');
      console.log('🔑 Token set:', this.accessToken ? 'Yes (length: ' + this.accessToken.length + ')' : 'No');
    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the API. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  private getHeaders(): HeadersInit {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    return {
      'Authorization': `${this.tokenType} ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async searchRead(
    model: string,
    fields?: string[],
    domain?: any[],
    limit: number = 100,
    offset: number = 0,
    order?: string
  ): Promise<any[]> {
    try {
      // Use Next.js API proxy to avoid CORS issues
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search_read',
          token: this.accessToken,
          model,
          fields,
          domain,
          limit,
          offset,
          order,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Search failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Fetch all Business Units from business.unit model
   */
  async getBusinessUnits(): Promise<Array<{ id: string; name: string; code: string; displayName: string }>> {
    const records = await this.searchRead(
      'business.unit',
      ['id', 'name', 'code', 'display_name'],
      [],
      1000
    );

    return records.map((record: any) => ({
      id: record.id.toString(),
      name: record.name || '',
      code: record.code || '',
      displayName: record.display_name || record.name || '',
    }));
  }

  /**
   * Fetch all Lines of Business from line_business_lob model
   */
  async getLinesOfBusiness(): Promise<Array<{ id: string; name: string; code: string; businessUnitId: string }>> {
    const records = await this.searchRead(
      'line_business_lob',
      ['id', 'name', 'code', 'business_unit_id'],
      [],
      1000
    );

    return records.map((record: any) => ({
      id: record.id.toString(),
      name: record.name || '',
      code: record.code || '',
      businessUnitId: record.business_unit_id && Array.isArray(record.business_unit_id)
        ? record.business_unit_id[0].toString()
        : '',
    }));
  }

  /**
   * Fetch ALL data_feeds records for a specific LOB (no limit)
   */
  async getDataForLOB(lobId: string): Promise<any[]> {
    // Fetch all records for this LOB - use high limit
    const records = await this.searchRead(
      'data_feeds',
      ['id', 'date', 'value', 'parameter_id', 'business_unit_id', 'lob_id'],
      [['lob_id', '=', parseInt(lobId)]],
      10000, // High limit to get all records
      0,
      'date asc'
    );

    return records.map(record => ({
      id: record.id,
      date: new Date(record.date),
      value: record.value || 0,
      parameter: record.parameter_id && Array.isArray(record.parameter_id) 
        ? record.parameter_id[1] 
        : 'Unknown',
    }));
  }

  /**
   * Get record count for a specific LOB
   */
  async getRecordCountForLOB(lobId: string): Promise<number> {
    const records = await this.searchRead(
      'data_feeds',
      ['id'],
      [['lob_id', '=', parseInt(lobId)]],
      1
    );
    
    // Since we can't use search_count, we'll estimate from the query
    // In production, you'd want to implement proper counting
    return records.length > 0 ? 1000 : 0; // Placeholder
  }

  /**
   * Fetch complete Business Units with their Lines of Business and ALL data
   * Optimized: Fetch all data at once, then organize by BU/LOB
   */
  async getBusinessUnitsWithLOBs() {
    console.log('🔄 Fetching ALL data from data_feeds...');
    
    // Fetch ALL data_feeds records at once (more efficient than per-LOB queries)
    const allRecords = await this.searchRead(
      'data_feeds',
      ['id', 'date', 'value', 'business_unit_id', 'lob_id', 'parameter_id'],
      [], // No filter - get everything
      50000, // Very high limit to get all records
      0,
      'date asc'
    );

    console.log(`✅ Fetched ${allRecords.length} total records from data_feeds`);

    // Organize data by BU and LOB
    const buMap = new Map<string, { name: string; lobs: Map<string, { name: string; records: any[] }> }>();

    allRecords.forEach(record => {
      // Extract BU info
      if (record.business_unit_id && Array.isArray(record.business_unit_id)) {
        const [buId, buName] = record.business_unit_id;
        const buIdStr = buId.toString();

        // Initialize BU if not exists
        if (!buMap.has(buIdStr)) {
          buMap.set(buIdStr, { name: buName, lobs: new Map() });
        }

        const bu = buMap.get(buIdStr)!;

        // Extract LOB info (if exists)
        if (record.lob_id && Array.isArray(record.lob_id)) {
          const [lobId, lobName] = record.lob_id;
          const lobIdStr = lobId.toString();

          // Initialize LOB if not exists
          if (!bu.lobs.has(lobIdStr)) {
            bu.lobs.set(lobIdStr, { name: lobName, records: [] });
          }

          // Add record to LOB
          bu.lobs.get(lobIdStr)!.records.push({
            id: record.id,
            date: new Date(record.date),
            value: record.value || 0,
            parameter: record.parameter_id && Array.isArray(record.parameter_id) 
              ? record.parameter_id[1] 
              : 'Unknown',
          });
        }
      }
    });

    console.log(`📊 Organized into ${buMap.size} Business Units`);

    // Transform to frontend format
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const now = new Date();

    const businessUnits = Array.from(buMap.entries()).map(([buId, buData], index) => {
      const lobs = Array.from(buData.lobs.entries()).map(([lobId, lobData]) => ({
        id: lobId,
        name: lobData.name,
        description: `Line of Business: ${lobData.name}`,
        code: `LOB${lobId}`,
        businessUnitId: buId,
        startDate: now,
        hasData: lobData.records.length > 0,
        dataUploaded: lobData.records.length > 0 ? now : null,
        recordCount: lobData.records.length,
        timeSeriesData: lobData.records.map(r => ({
          Date: r.date,
          Value: r.value,
          Orders: 0, // Not available in current data
        })),
        dataQuality: { 
          trend: 'stable' as const, 
          seasonality: lobData.records.length > 50 ? 'moderate' as const : 'none' as const 
        },
        createdDate: now,
        updatedDate: now,
        status: 'active' as const,
      }));

      console.log(`  📁 ${buData.name}: ${lobs.length} LOBs, ${lobs.reduce((sum, lob) => sum + lob.recordCount, 0)} total records`);

      return {
        id: buId,
        name: buData.name,
        description: `Business Unit: ${buData.name}`,
        code: `BU${buId}`,
        startDate: now,
        displayName: buData.name,
        color: colors[index % colors.length],
        createdDate: now,
        updatedDate: now,
        status: 'active' as const,
        lobs,
      };
    });

    console.log(`✅ Final result: ${businessUnits.length} BUs with complete data`);
    return businessUnits;
  }

  /**
   * Create a new data_feeds record
   */
  async createDataFeed(data: {
    business_unit_id: number;
    lob_id: number;
    date: string;
    value: number;
    parameter_id?: number;
  }): Promise<number> {
    const url = `${API_BASE_URL}/create`;
    const params = new URLSearchParams({ model: 'data_feeds' });

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Create failed: ${response.statusText}`);
    }

    const result = await response.json();
    return typeof result === 'number' ? result : result.id;
  }

  /**
   * Update a data_feeds record
   */
  async updateDataFeed(recordId: number, values: any): Promise<boolean> {
    const url = `${API_BASE_URL}/write`;
    const params = new URLSearchParams({ model: 'data_feeds' });

    const response = await fetch(`${url}?${params}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ id: recordId, values }),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    return true;
  }

  /**
   * Delete a data_feeds record
   */
  async deleteDataFeed(recordId: number): Promise<boolean> {
    const url = `${API_BASE_URL}/unlink`;
    const params = new URLSearchParams({ model: 'data_feeds' });

    const response = await fetch(`${url}?${params}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ id: recordId }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return true;
  }

  // ============================================================================
  // BUSINESS UNIT CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new Business Unit
   */
  async createBusinessUnit(data: {
    name: string;
    display_name: string;
    code: string;
    start_date?: string;
    description?: string;
  }): Promise<number> {
    try {
      console.log('📤 Creating BU with data:', data);
      console.log('🔑 Using token:', this.accessToken ? 'Yes (length: ' + this.accessToken.length + ')' : 'NO TOKEN!');
      
      if (!this.accessToken) {
        throw new Error('No access token available. Authentication may have failed.');
      }
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          token: this.accessToken,
          model: 'business.unit',
          values: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details || errorData.error || `Create failed: ${response.status}`;
        console.error('❌ Create BU failed:', errorMsg);
        console.error('📋 Data sent:', data);
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('✅ BU created, result:', result);
      return typeof result === 'number' ? result : result.id;
    } catch (error) {
      console.error('Create Business Unit error:', error);
      throw error;
    }
  }

  /**
   * Update a Business Unit
   */
  async updateBusinessUnit(recordId: number, values: any): Promise<boolean> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write',
          token: this.accessToken,
          model: 'business.unit',
          recordId,
          values,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Update failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Update Business Unit error:', error);
      throw error;
    }
  }

  /**
   * Delete a Business Unit
   */
  async deleteBusinessUnit(recordId: number): Promise<boolean> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlink',
          token: this.accessToken,
          model: 'business.unit',
          recordId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Delete Business Unit error:', error);
      throw error;
    }
  }

  // ============================================================================
  // LINE OF BUSINESS CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new Line of Business
   */
  async createLOB(data: {
    name: string;
    code: string;
    business_unit_id: number;
    start_date?: string;
    description?: string;
  }): Promise<number> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          token: this.accessToken,
          model: 'line_business_lob',
          values: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Create failed: ${response.status}`);
      }

      const result = await response.json();
      return typeof result === 'number' ? result : result.id;
    } catch (error) {
      console.error('Create LOB error:', error);
      throw error;
    }
  }

  /**
   * Update a Line of Business
   */
  async updateLOB(recordId: number, values: any): Promise<boolean> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write',
          token: this.accessToken,
          model: 'line_business_lob',
          recordId,
          values,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Update failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Update LOB error:', error);
      throw error;
    }
  }

  /**
   * Delete a Line of Business
   */
  async deleteLOB(recordId: number): Promise<boolean> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlink',
          token: this.accessToken,
          model: 'line_business_lob',
          recordId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Delete LOB error:', error);
      throw error;
    }
  }
}

// Singleton instance
let apiClientInstance: ZentereAPIClient | null = null;

export function getAPIClient(): ZentereAPIClient {
  if (!apiClientInstance) {
    apiClientInstance = new ZentereAPIClient();
  }
  return apiClientInstance;
}
