import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = "https://app-api-dev.zentere.com/api/v2";
const CLIENT_ID = "kLPrcbXlsHYelbpm5HzKg8ZgDE2rVXRhGyJ0GdqH";
const CLIENT_SECRET = "IbqUkvq1hWTuc6jK7X6xGClTLThshJhfU6nf7uYm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, token, model, fields, domain, limit, offset, order } = body;

    console.log('🔄 Proxy request:', action);

    // Handle authentication
    if (action === 'authenticate') {
      const formData = new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: username || 'martin@demo.com',
        password: password || 'demo',
        client_secret: CLIENT_SECRET
      });

      const response = await fetch(`${API_BASE_URL}/authentication/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Authentication failed:', response.status, errorText);
        return NextResponse.json(
          { error: `Authentication failed: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('✅ Authentication successful');
      return NextResponse.json(data);
    }

    // Handle search_read
    if (action === 'search_read') {
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

      console.log(`📊 Fetching from ${model}, limit: ${limit || 'default'}, domain: ${domain ? JSON.stringify(domain) : 'none'}`);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed:', response.status, errorText);
        return NextResponse.json(
          { error: `Search failed: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log(`✅ Returned ${Array.isArray(data) ? data.length : 'N/A'} records`);
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
