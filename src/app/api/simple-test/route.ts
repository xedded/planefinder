import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.FLIGHTRADAR24_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' })
    }

    // Test the most basic endpoint with your API key
    const testUrl = 'https://fr24api.flightradar24.com/common/v1/search.json?lat=51.4700&lon=-0.4543&radius=50'

    console.log('Testing basic endpoint:', testUrl)
    console.log('API key length:', apiKey.length)
    console.log('API key prefix:', apiKey.substring(0, 10))

    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'PlaneFinder/1.0',
        'Accept': 'application/json',
      }
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Response length:', responseText.length)
    console.log('Response sample:', responseText.substring(0, 500))

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (e) {
      parsedResponse = { error: 'Could not parse JSON', raw: responseText }
    }

    return NextResponse.json({
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseLength: responseText.length,
      response: parsedResponse,
      apiKeyInfo: {
        present: !!apiKey,
        length: apiKey.length,
        prefix: apiKey.substring(0, 10) + '...'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}