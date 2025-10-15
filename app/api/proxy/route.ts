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

    // Handle create
    if (action === 'create') {
      const { model, values } = body;
      const url = new URL(`${API_BASE_URL}/create`);
      url.searchParams.append('model', model);

      console.log(`📝 Creating record in ${model}`);
      console.log('📋 Values received:', JSON.stringify(values, null, 2));
      console.log('📤 Sending to:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create failed:', response.status, errorText);
        console.error('Request was:', { model, values });
        return NextResponse.json(
          { error: `Create failed: ${response.status}`, details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log(`✅ Created record with ID: ${data}`);
      return NextResponse.json(data);
    }

    // Handle write (update)
    if (action === 'write') {
      const { model, recordId, values } = body;
      const url = new URL(`${API_BASE_URL}/write`);
      url.searchParams.append('model', model);

      console.log(`✏️ Updating record ${recordId} in ${model}`);

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: recordId, values }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', response.status, errorText);
        return NextResponse.json(
          { error: `Update failed: ${response.status}` },
          { status: response.status }
        );
      }

      console.log(`✅ Updated record ${recordId}`);
      return NextResponse.json({ success: true });
    }

    // Handle unlink (delete)
    if (action === 'unlink') {
      const { model, recordId } = body;
      const url = new URL(`${API_BASE_URL}/unlink`);
      url.searchParams.append('model', model);

      console.log(`🗑️ Deleting record ${recordId} from ${model}`);

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: recordId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed:', response.status, errorText);
        return NextResponse.json(
          { error: `Delete failed: ${response.status}` },
          { status: response.status }
        );
      }

      console.log(`✅ Deleted record ${recordId}`);
      return NextResponse.json({ success: true });
    }

    if (action === 'validate_api_key') {
      const { provider, apiKey } = body;
      const url = provider === 'openai' ? 'https://api.openai.com/v1/models' : 'https://openrouter.ai/api/v1/models';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
      };

      try {
        const response = await fetch(url, { headers });
        if (response.ok) {
          return NextResponse.json({ isValid: true });
        } else {
          return NextResponse.json({ isValid: false, error: `API key is invalid. Status: ${response.status}` });
        }
      } catch (error) {
        return NextResponse.json({ isValid: false, error: 'A connection error occurred.' });
      }
    }

    if (action === 'chat_completion') {
      const { provider, model, messages, temperature, max_tokens, apiKey } = body;
      const url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      const payload = {
        model,
        messages,
        temperature,
        max_tokens,
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json({ error: `Chat completion failed: ${response.status}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        return NextResponse.json({ error: 'A connection error occurred.' }, { status: 500 });
      }
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
