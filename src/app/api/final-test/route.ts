import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rawApiKey = process.env.FR24_API_TOKEN
    // Extract the token part after the pipe separator
    const apiKey = rawApiKey?.includes('|') ? rawApiKey.split('|')[1] : rawApiKey

    if (!apiKey) {
      return NextResponse.json({
        error: 'No FR24_API_TOKEN environment variable found',
        success: false
      })
    }

    // Test the exact endpoint from FR24 documentation
    const bounds = "52.4700,50.4700,-1.4543,0.5457" // N,S,W,E around London
    const testUrl = `https://fr24api.flightradar24.com/api/live/flight-positions/light?bounds=${bounds}`

    console.log('=== FR24 API TEST ===')
    console.log('URL:', testUrl)
    console.log('API Key length:', apiKey.length)
    console.log('API Key prefix:', apiKey.substring(0, 15))

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'API-Version': 'v1',
        'Accept': 'application/json',
        'User-Agent': 'PlaneFinder/1.0'
      }
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Response length:', responseText.length)
    console.log('Response sample:', responseText.substring(0, 500))

    let responseData = null
    let isJson = false

    try {
      responseData = JSON.parse(responseText)
      isJson = true
      console.log('Successfully parsed JSON response')
      if (responseData && typeof responseData === 'object') {
        console.log('Response keys:', Object.keys(responseData))
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e)
      responseData = responseText
    }

    return NextResponse.json({
      success: response.ok && isJson,
      status: response.status,
      statusText: response.statusText,
      url: testUrl,
      isJson,
      responseLength: responseText.length,
      contentType: response.headers.get('content-type'),
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 15) + '...',
      response: isJson ? responseData : responseText.substring(0, 1000),
      headers: Object.fromEntries(response.headers.entries())
    })

  } catch (error) {
    console.error('Test failed with error:', error)
    return NextResponse.json({
      success: false,
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}