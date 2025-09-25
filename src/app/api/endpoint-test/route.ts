import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.FR24_API_TOKEN

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' })
    }

    // Test multiple potential endpoints
    const endpoints = [
      'https://fr24api.flightradar24.com/common/v1/search.json?lat=51.4700&lon=-0.4543&radius=50',
      'https://fr24api.flightradar24.com/api/v1/search?lat=51.4700&lon=-0.4543&radius=50',
      'https://fr24api.flightradar24.com/flights/search?lat=51.4700&lon=-0.4543&radius=50',
      'https://fr24api.flightradar24.com/v1/flights?bounds=52.4700,50.4700,-1.4543,0.5457',
      'https://fr24api.flightradar24.com/common/v1/search?lat=51.4700&lon=-0.4543&radius=50',
      'https://fr24api.flightradar24.com/flights/list?bounds=52.4700,50.4700,-1.4543,0.5457'
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'PlaneFinder/1.0',
            'Accept': 'application/json',
          }
        })

        const responseText = await response.text()

        let parsed = null
        let isJson = false
        try {
          parsed = JSON.parse(responseText)
          isJson = true
        } catch {
          parsed = responseText.substring(0, 300)
        }

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          isJson,
          contentLength: responseText.length,
          headers: Object.fromEntries(response.headers.entries()),
          response: parsed,
          success: response.ok && isJson
        })

        // Stop on first success
        if (response.ok && isJson) {
          console.log(`✅ Found working endpoint: ${endpoint}`)
          break
        }

      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    }

    return NextResponse.json({
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      totalEndpoints: endpoints.length,
      results: results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        http404: results.filter(r => r.status === 404).length,
        http403: results.filter(r => r.status === 403).length
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}