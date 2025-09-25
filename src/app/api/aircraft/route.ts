import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let latitude: number = 59.3293 // Stockholm default
  let longitude: number = 18.0686 // Stockholm default

  try {
    const body = await request.json()
    latitude = body.latitude || latitude
    longitude = body.longitude || longitude

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const getDemoData = () => ({
      aircraft: [
        {
          id: 'demo-1',
          latitude: latitude + 0.01,
          longitude: longitude + 0.01,
          altitude: 35000,
          speed: 450,
          heading: 90,
          callsign: 'SAS123',
          aircraft: 'A320',
          origin: 'ARN',
          destination: 'CPH',
          registration: 'SE-ABC',
          aircraftType: 'Airbus A320'
        },
        {
          id: 'demo-2',
          latitude: latitude - 0.02,
          longitude: longitude + 0.015,
          altitude: 28000,
          speed: 380,
          heading: 225,
          callsign: 'NAX456',
          aircraft: 'B737',
          origin: 'OSL',
          destination: 'STO',
          registration: 'LN-XYZ',
          aircraftType: 'Boeing 737-800'
        },
        {
          id: 'demo-3',
          latitude: latitude + 0.005,
          longitude: longitude - 0.02,
          altitude: 41000,
          speed: 520,
          heading: 180,
          callsign: 'DLH789',
          aircraft: 'A350',
          origin: 'FRA',
          destination: 'ARN',
          registration: 'D-ADEF',
          aircraftType: 'Airbus A350-900'
        }
      ]
    })

    const apiKey = process.env.FLIGHTRADAR24_API_KEY
    if (!apiKey) {
      console.log('No API key configured, returning demo data')
      return NextResponse.json(getDemoData())
    }

    try {
      // Try multiple potential API endpoints
      const endpoints = [
        `https://api.flightradar24.com/v1/zones/fcgi?bounds=${latitude + 0.1},${latitude - 0.1},${longitude - 0.1},${longitude + 0.1}`,
        `https://data-live.flightradar24.com/zones/fcgi?bounds=${latitude + 0.1},${latitude - 0.1},${longitude - 0.1},${longitude + 0.1}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1`,
        `https://api.flightradar24.com/v2/aircraft?bounds=${latitude + 0.1},${latitude - 0.1},${longitude - 0.1},${longitude + 0.1}`
      ]

      let response: Response | null = null

      for (const apiUrl of endpoints) {
        try {
          console.log(`Trying endpoint: ${apiUrl}`)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)

          response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'User-Agent': 'PlaneFinder/1.0',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            console.log(`Success with endpoint: ${apiUrl}`)
            break
          } else {
            console.log(`Failed with status ${response.status} for endpoint: ${apiUrl}`)
            response = null
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${apiUrl}:`, endpointError)
          continue
        }
      }

      if (!response || !response.ok) {
        console.error('All FlightRadar24 API endpoints failed')
        return NextResponse.json(getDemoData())
      }

      const data = await response.json()
      console.log('API Response received:', Object.keys(data))

      // Handle different response formats from different endpoints
      let aircraftData = []

      if (data.aircraft) {
        // Standard aircraft array format
        aircraftData = data.aircraft
      } else if (Array.isArray(data)) {
        // Direct array format
        aircraftData = data
      } else if (data.states) {
        // OpenSky format
        aircraftData = data.states
      } else if (typeof data === 'object') {
        // FlightRadar24 zones format - extract aircraft from object values
        aircraftData = Object.values(data).filter((item: any) =>
          item && typeof item === 'object' && item.lat && item.lon
        )
      }

      const aircraft = aircraftData.slice(0, 10).map((plane: any, index: number) => ({
        id: plane.hex || plane.icao || plane[0] || `aircraft-${index}`,
        latitude: parseFloat(plane.lat || plane.latitude || plane[1]) || latitude,
        longitude: parseFloat(plane.lon || plane.longitude || plane[2]) || longitude,
        altitude: plane.alt || plane.altitude || plane[3] || 0,
        speed: plane.spd || plane.speed || plane[5] || 0,
        heading: plane.hdg || plane.heading || plane[4] || 0,
        callsign: plane.call || plane.callsign || plane[16] || 'Unknown',
        aircraft: plane.type || plane.aircraft || plane[8] || 'Unknown',
        origin: plane.from || plane.origin || 'Unknown',
        destination: plane.to || plane.destination || 'Unknown',
        registration: plane.reg || plane.registration || 'Unknown',
        aircraftType: plane.aircraft_type || plane.type || 'Aircraft',
        image: plane.image || null
      })).filter(aircraft =>
        aircraft.latitude !== latitude && aircraft.longitude !== longitude
      )

      console.log(`Found ${aircraft.length} aircraft`)
      return NextResponse.json({ aircraft })
    } catch (apiError) {
      console.error('FlightRadar24 API fetch error:', apiError)
      return NextResponse.json(getDemoData())
    }

  } catch (error) {
    console.error('General API error:', error)

    return NextResponse.json({
      aircraft: [
        {
          id: 'fallback-1',
          latitude: latitude || 59.3293,
          longitude: longitude || 18.0686,
          altitude: 30000,
          speed: 400,
          heading: 180,
          callsign: 'DEMO123',
          aircraft: 'B737',
          origin: 'Unknown',
          destination: 'Unknown',
          registration: 'SE-DEMO',
          aircraftType: 'Demo Aircraft'
        }
      ]
    })
  }
}