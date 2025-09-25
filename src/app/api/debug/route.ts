import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json()
    const testLat = latitude || 59.3293  // Stockholm
    const testLon = longitude || 18.0686

    const apiKey = process.env.FLIGHTRADAR24_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' })
    }

    // Test the actual endpoint that should work
    const radius = 2.0
    const testUrl = `https://data-live.flightradar24.com/zones/fcgi?bounds=${testLat + radius},${testLat - radius},${testLon - radius},${testLon + radius}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1`

    console.log('Testing URL:', testUrl)

    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'PlaneFinder/1.0',
      },
    })

    const responseText = await response.text()
    console.log('Raw response:', responseText)

    let parsedData;
    try {
      parsedData = JSON.parse(responseText)
    } catch (parseError) {
      parsedData = { error: 'Could not parse as JSON', raw: responseText.substring(0, 1000) }
    }

    return NextResponse.json({
      url: testUrl,
      status: response.status,
      headers: Object.fromEntries(response.headers),
      rawResponse: responseText.substring(0, 2000),
      parsedData: parsedData,
      dataKeys: parsedData && typeof parsedData === 'object' ? Object.keys(parsedData) : [],
      totalValues: parsedData && typeof parsedData === 'object' ? Object.keys(parsedData).length : 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}