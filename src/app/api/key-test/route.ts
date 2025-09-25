import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.FLIGHTRADAR24_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' })
    }

    // Test multiple API endpoints with different auth methods
    const tests = [
      {
        name: 'RapidAPI format',
        url: 'https://fr24api.flightradar24.com/common/v1/search.json?query=test&limit=1',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'fr24api.flightradar24.com'
        }
      },
      {
        name: 'Bearer token',
        url: 'https://fr24api.flightradar24.com/common/v1/search.json?query=test&limit=1',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      },
      {
        name: 'Simple API Key',
        url: 'https://api.flightradar24.com/common/v1/search.json?query=test&limit=1',
        headers: {
          'X-API-Key': apiKey
        }
      },
      {
        name: 'Data-live with auth',
        url: 'https://data-live.flightradar24.com/zones/fcgi?bounds=52,50,0,2&limit=1',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        }
      }
    ]

    const results = []

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}:`, test.url)

        const response = await fetch(test.url, {
          headers: {
            ...test.headers,
            'User-Agent': 'PlaneFinder/1.0'
          }
        })

        const text = await response.text()
        let parsed = null
        try {
          parsed = JSON.parse(text)
        } catch (e) {
          parsed = { parseError: 'Could not parse JSON', raw: text.substring(0, 200) }
        }

        results.push({
          name: test.name,
          url: test.url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responseLength: text.length,
          response: parsed,
          success: response.ok
        })

      } catch (error) {
        results.push({
          name: test.name,
          url: test.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    }

    return NextResponse.json({
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      tests: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Key test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}