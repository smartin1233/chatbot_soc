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
    const url = `${API_BASE_URL}/authentication/oauth2/token`;
    
    const formData = new URLSearchParams({
      grant_type: 'password',
      client_id: CLIENT_ID,
      username: username,
      password: password,
      client_secret: CLIENT_SECRET
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data: AuthResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenType = data.token_type || "Bearer";
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
    const url = new URL(`${API_BASE_URL}/search_read`);
    url.searchParams.append('model', model);
    
    if (fields) {
      url.searchParams.append('fields', JSON.stringify(fields));
    }
    if (domain) {
      url.searchParams.append('domain', JSON.stringify(domain));
    }
    if (limit) {
      url.searchParams.append('limit', limit.toString());
    }
    if (offset) {
      url.searchParams.append('offset', offset.toString());
    }
    if (order) {
      url.searchParams.append('order', order);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch all unique Business Units from data_feeds
   */
  async getBusinessUnits(): Promise<Array<{ id: string; name: string }>> {
    const records = await this.searchRead(
      'data_feeds',
      ['business_unit_id'],
      undefined,
      1000
    );

    const buMap = new Map<number, string>();
    
    records.forEach((record: DataFeedRecord) => {
      if (record.business_unit_id && Array.isArray(record.business_unit_id)) {
        const [id, name] = record.business_unit_id;
        buMap.set(id, name);
      }
    });

    return Array.from(buMap.entries()).map(([id, name]) => ({
      id: id.toString(),
      name,
    }));
  }

  /**
   * Fetch all unique Lines of Business from data_feeds
   */
  async getLinesOfBusiness(): Promise<Array<{ id: string; name: string; businessUnitId: string }>> {
    const records = await this.searchRead(
      'data_feeds',
      ['lob_id', 'business_unit_id'],
      undefined,
      1000
    );

    const lobMap = new Map<number, { name: string; businessUnitId: string }>();
    
    records.forEach((record: DataFeedRecord) => {
      if (record.lob_id && Array.isArray(record.lob_id)) {
        const [lobId, lobName] = record.lob_id;
        const buId = record.business_unit_id && Array.isArray(record.business_unit_id) 
          ? record.business_unit_id[0].toString() 
          : '';
        
        if (!lobMap.has(lobId)) {
          lobMap.set(lobId, { name: lobName, businessUnitId: buId });
        }
      }
    });

    return Array.from(lobMap.entries()).map(([id, data]) => ({
      id: id.toString(),
      name: data.name,
      businessUnitId: data.businessUnitId,
    }));
  }

  /**
   * Fetch complete Business Units with their Lines of Business
   */
  async getBusinessUnitsWithLOBs() {
    const [businessUnits, linesOfBusiness] = await Promise.all([
      this.getBusinessUnits(),
      this.getLinesOfBusiness(),
    ]);

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const now = new Date();

    return businessUnits.map((bu, index) => ({
      id: bu.id,
      name: bu.name,
      description: `Business Unit: ${bu.name}`,
      code: `BU${bu.id}`,
      startDate: now,
      displayName: bu.name,
      color: colors[index % colors.length],
      createdDate: now,
      updatedDate: now,
      status: 'active' as const,
      lobs: linesOfBusiness
        .filter(lob => lob.businessUnitId === bu.id)
        .map(lob => ({
          id: lob.id,
          name: lob.name,
          description: `Line of Business: ${lob.name}`,
          code: `LOB${lob.id}`,
          businessUnitId: bu.id,
          startDate: now,
          hasData: true,
          dataUploaded: now,
          recordCount: 0,
          dataQuality: { trend: 'stable' as const, seasonality: 'moderate' as const },
          createdDate: now,
          updatedDate: now,
          status: 'active' as const,
        })),
    }));
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
