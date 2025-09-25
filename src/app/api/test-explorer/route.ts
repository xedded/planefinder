import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.FLIGHTRADAR24_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' })
    }

    // Test Explorer API directly
    const testUrl = 'https://fr24api.flightradar24.com/api/flights/positions?bounds=52,-1,-1,2'

    console.log('Testing Explorer API with URL:', testUrl)
    console.log('API Key (first 8 chars):', apiKey.substring(0, 8))

    const response = await fetch(testUrl, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'fr24api.flightradar24.com',
        'Accept': 'application/json',
      },
    })

    const responseText = await response.text()

    return NextResponse.json({
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 8),
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      response: responseText.substring(0, 2000),
      success: response.ok
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}