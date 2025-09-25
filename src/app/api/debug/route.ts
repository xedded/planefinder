import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json()
    const testLat = latitude || 51.4700  // London Heathrow - guaranteed aircraft
    const testLon = longitude || -0.4543

    // Test the public API first (no auth needed)
    const radius = 1.0
    const publicUrl = `https://data-live.flightradar24.com/zones/fcgi?bounds=${testLat + radius},${testLat - radius},${testLon - radius},${testLon + radius}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1`

    console.log('Testing public URL:', publicUrl)

    const publicResponse = await fetch(publicUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlaneFinder/1.0)',
        'Accept': 'application/json',
        'Referer': 'https://www.flightradar24.com/',
      },
    })

    const publicText = await publicResponse.text()
    console.log('Public API response status:', publicResponse.status)
    console.log('Public API response length:', publicText.length)

    let publicData;
    try {
      publicData = JSON.parse(publicText)
    } catch {
      publicData = { error: 'Could not parse as JSON', raw: publicText.substring(0, 1000) }
    }

    // If public API works, return that result
    if (publicResponse.ok && publicData && typeof publicData === 'object' && !publicData.error) {
      const aircraftKeys = Object.keys(publicData).filter(key =>
        key !== 'full_count' && key !== 'version' && key !== 'stats' &&
        typeof publicData[key] === 'object' && Array.isArray(publicData[key])
      )

      return NextResponse.json({
        success: true,
        source: 'public',
        url: publicUrl,
        status: publicResponse.status,
        dataKeys: Object.keys(publicData),
        aircraftCount: aircraftKeys.length,
        fullCount: publicData.full_count || 0,
        sample: aircraftKeys.length > 0 ? { [aircraftKeys[0]]: publicData[aircraftKeys[0]] } : null
      })
    }

    // If public API fails, test with API key
    const apiKey = process.env.FR24_API_TOKEN
    if (!apiKey) {
      return NextResponse.json({
        error: 'Public API failed and no API key available',
        publicResponse: {
          status: publicResponse.status,
          data: publicData
        }
      })
    }

    // Test authenticated API
    const response = await fetch(publicUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'PlaneFinder/1.0',
        'Accept': 'application/json',
      },
    })

    const responseText = await response.text()
    console.log('Raw response:', responseText)

    let parsedData;
    try {
      parsedData = JSON.parse(responseText)
    } catch {
      parsedData = { error: 'Could not parse as JSON', raw: responseText.substring(0, 1000) }
    }

    // Return response with authenticated API results
    return NextResponse.json({
      url: publicUrl,
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