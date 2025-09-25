import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.FR24_API_TOKEN

    return NextResponse.json({
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Test failed', message: error })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude } = body

    // Test coordinates
    const testLat = latitude || 59.3293
    const testLon = longitude || 18.0686

    const apiKey = process.env.FR24_API_TOKEN

    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key',
        testData: [
          {
            id: 'test-1',
            latitude: testLat + 0.01,
            longitude: testLon + 0.01,
            callsign: 'TEST123'
          }
        ],
        isRealData: false
      })
    }

    // Try to make a simple API call
    const testEndpoint = `https://data-live.flightradar24.com/zones/fcgi?bounds=${testLat + 0.1},${testLat - 0.1},${testLon - 0.1},${testLon + 0.1}&faa=1`

    const response = await fetch(testEndpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'PlaneFinder/1.0',
      },
    })

    const responseText = await response.text()

    return NextResponse.json({
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'none',
      endpoint: testEndpoint,
      status: response.status,
      headers: Object.fromEntries(response.headers),
      responseLength: responseText.length,
      responseSample: responseText.substring(0, 500),
      isRealData: response.ok
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}