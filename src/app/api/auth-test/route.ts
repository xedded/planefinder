import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rawApiKey = process.env.FR24_API_TOKEN
    // Extract the token part after the pipe separator
    const apiKey = rawApiKey?.includes('|') ? rawApiKey.split('|')[1] : rawApiKey

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' })
    }

    // Test one simple endpoint with different authentication methods
    const testEndpoint = 'https://fr24api.flightradar24.com/v1/flights?bounds=52.4700,50.4700,-1.4543,0.5457'

    const authMethods: Array<{
      name: string;
      headers: Record<string, string>;
    }> = [
      {
        name: 'Bearer Token',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'PlaneFinder/1.0'
        }
      },
      {
        name: 'X-API-Key Header',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'PlaneFinder/1.0'
        }
      },
      {
        name: 'Authorization Basic',
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
          'Accept': 'application/json',
          'User-Agent': 'PlaneFinder/1.0'
        }
      },
      {
        name: 'API Key as Token',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'PlaneFinder/1.0'
        }
      },
      {
        name: 'Query Parameter',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PlaneFinder/1.0'
        }
      }
    ]

    const results = []

    for (const method of authMethods) {
      try {
        let url = testEndpoint
        if (method.name === 'Query Parameter') {
          url = `${testEndpoint}&token=${encodeURIComponent(apiKey)}`
        }

        console.log(`Testing ${method.name} authentication...`)

        const response = await fetch(url, {
          headers: method.headers
        })

        const responseText = await response.text()

        let parsed = null
        let isJson = false
        try {
          parsed = JSON.parse(responseText)
          isJson = true
        } catch {
          parsed = responseText.substring(0, 200)
        }

        results.push({
          method: method.name,
          url: method.name === 'Query Parameter' ? url.substring(0, 100) + '...' : testEndpoint,
          status: response.status,
          statusText: response.statusText,
          isJson,
          contentLength: responseText.length,
          contentType: response.headers.get('content-type'),
          response: parsed,
          success: response.ok && isJson
        })

        console.log(`${method.name}: ${response.status} ${response.statusText}`)

        // Stop on first success
        if (response.ok && isJson) {
          console.log(`✅ Found working authentication: ${method.name}`)
          break
        }

      } catch (error) {
        results.push({
          method: method.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    }

    return NextResponse.json({
      testEndpoint,
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 15) + '...',
      results,
      summary: {
        totalMethods: authMethods.length,
        successful: results.filter(r => r.success).length,
        http200: results.filter(r => r.status === 200).length,
        http401: results.filter(r => r.status === 401).length,
        http403: results.filter(r => r.status === 403).length,
        http404: results.filter(r => r.status === 404).length
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Auth test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}