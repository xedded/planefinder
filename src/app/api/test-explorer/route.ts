import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.FR24_API_TOKEN

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' })
    }

    // Test multiple Explorer API formats
    const testUrls = [
      'https://api.flightradar24.com/live/v1/zones/fcgi?bounds=52,-1,-1,2',
      'https://api.flightradar24.com/common/v1/search.json?lat=51.47&lon=-0.45&radius=100',
      'https://fr24api.flightradar24.com/v1/flights/positions?bounds=52,-1,-1,2'
    ]

    const results = []

    for (const testUrl of testUrls) {
      try {
        console.log('Testing URL:', testUrl)

        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'PlaneFinder/1.0',
          },
        })

        const responseText = await response.text()

        results.push({
          url: testUrl,
          status: response.status,
          success: response.ok,
          response: responseText.substring(0, 500)
        })

        if (response.ok) {
          break // Stop on first success
        }
      } catch (error) {
        results.push({
          url: testUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 8),
      results: results
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}