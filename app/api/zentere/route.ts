import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = "https://app-api-dev.zentere.com/api/v2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method = 'POST', data, params } = body;

    // Build URL with params
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // Forward the request to Zentere API
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        ...(body.token ? { 'Authorization': `Bearer ${body.token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
