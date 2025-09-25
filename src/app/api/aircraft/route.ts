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
      isRealData: false,
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
      // Try multiple potential API endpoints with very large search radius
      const radius = 2.0  // ~200km radius - should find aircraft anywhere in region
      const endpoints = [
        `https://data-live.flightradar24.com/zones/fcgi?bounds=${latitude + radius},${latitude - radius},${longitude - radius},${longitude + radius}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1`,
        `https://api.flightradar24.com/v1/zones/fcgi?bounds=${latitude + radius},${latitude - radius},${longitude - radius},${longitude + radius}`,
        `https://api.flightradar24.com/v2/aircraft?bounds=${latitude + radius},${latitude - radius},${longitude - radius},${longitude + radius}`
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
      console.log('API Response keys:', Object.keys(data))
      console.log('API Response sample:', JSON.stringify(data, null, 2).substring(0, 1000))

      // Handle different response formats from different endpoints
      let aircraftData = []

      if (data.aircraft && Array.isArray(data.aircraft)) {
        // Standard aircraft array format
        aircraftData = data.aircraft
        console.log('Using aircraft array format, found:', aircraftData.length, 'items')
      } else if (Array.isArray(data)) {
        // Direct array format
        aircraftData = data
        console.log('Using direct array format, found:', aircraftData.length, 'items')
      } else if (data.states && Array.isArray(data.states)) {
        // OpenSky format
        aircraftData = data.states
        console.log('Using OpenSky states format, found:', aircraftData.length, 'items')
      } else if (typeof data === 'object' && data !== null) {
        // FlightRadar24 zones format - extract aircraft from object values
        const allValues = Object.values(data)
        console.log('Object format detected, total values:', allValues.length)

        // Check if any values look like aircraft (have lat/lon or position data)
        aircraftData = allValues.filter((item: unknown) => {
          if (!item || typeof item !== 'object') return false
          const obj = item as Record<string, unknown>

          // Check various possible coordinate field names
          return (obj.lat !== undefined && obj.lon !== undefined) ||
                 (obj.latitude !== undefined && obj.longitude !== undefined) ||
                 (Array.isArray(obj) && obj.length > 2 && typeof obj[1] === 'number' && typeof obj[2] === 'number')
        })
        console.log('Filtered aircraft-like objects:', aircraftData.length)
      }

      console.log('Final aircraftData length:', aircraftData.length)
      if (aircraftData.length > 0) {
        console.log('Sample aircraft object:', JSON.stringify(aircraftData[0], null, 2))
      }

      const aircraft = aircraftData.slice(0, 10).map((plane: Record<string, unknown> | unknown[], index: number) => {
        const planeObj = Array.isArray(plane) ? {} : plane as Record<string, unknown>
        const planeArray = Array.isArray(plane) ? plane : []

        const aircraftId = planeObj.hex || planeObj.icao || planeArray[0] || `aircraft-${index}`
        const lat = parseFloat((planeObj.lat || planeObj.latitude || planeArray[1]) as string)
        const lon = parseFloat((planeObj.lon || planeObj.longitude || planeArray[2]) as string)

        return {
        id: aircraftId,
        latitude: lat || latitude,
        longitude: lon || longitude,
        altitude: parseInt((planeObj.alt || planeObj.altitude || planeArray[3] || 0) as string) || 0,
        speed: parseInt((planeObj.spd || planeObj.speed || planeArray[5] || 0) as string) || 0,
        heading: parseInt((planeObj.hdg || planeObj.heading || planeArray[4] || 0) as string) || 0,
        callsign: (planeObj.call || planeObj.callsign || planeArray[16] || 'Unknown') as string,
        aircraft: (planeObj.type || planeObj.aircraft || planeArray[8] || 'Unknown') as string,
        origin: (planeObj.from || planeObj.origin || 'Unknown') as string,
        destination: (planeObj.to || planeObj.destination || 'Unknown') as string,
        registration: (planeObj.reg || planeObj.registration || 'Unknown') as string,
        aircraftType: (planeObj.aircraft_type || planeObj.type || 'Aircraft') as string,
        // Try to get aircraft image from various possible sources
        image: (planeObj.image || planeObj.photo || planeObj.pic ||
                `https://www.flightradar24.com/aircrafts/${aircraftId}` || null) as string | null
      }}).filter((aircraft: { latitude: number; longitude: number }) =>
        aircraft.latitude !== latitude && aircraft.longitude !== longitude
      )

      console.log(`Found ${aircraft.length} real aircraft from FlightRadar24`)

      // If still no aircraft found, try with an even larger radius (covers most of Europe/continent)
      if (aircraft.length === 0 && response) {
        console.log('No aircraft found, trying with massive radius (~500km)')
        const massiveRadius = 5.0
        const fallbackUrl = `https://data-live.flightradar24.com/zones/fcgi?bounds=${latitude + massiveRadius},${latitude - massiveRadius},${longitude - massiveRadius},${longitude + massiveRadius}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1`

        try {
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'User-Agent': 'PlaneFinder/1.0',
              'Accept': 'application/json',
            },
          })

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            console.log('Fallback API Response keys:', Object.keys(fallbackData))

            if (fallbackData && typeof fallbackData === 'object') {
              const fallbackAircraftData = Object.values(fallbackData).filter((item: unknown) => {
                if (!item || typeof item !== 'object') return false
                const obj = item as Record<string, unknown>
                return (obj.lat !== undefined && obj.lon !== undefined)
              })

              const fallbackAircraft = fallbackAircraftData.slice(0, 10).map((plane: Record<string, unknown> | unknown[], index: number) => {
                const planeObj = Array.isArray(plane) ? {} : plane as Record<string, unknown>
                const planeArray = Array.isArray(plane) ? plane : []

                const aircraftId = planeObj.hex || planeObj.icao || planeArray[0] || `aircraft-${index}`
                const lat = parseFloat((planeObj.lat || planeObj.latitude || planeArray[1]) as string)
                const lon = parseFloat((planeObj.lon || planeObj.longitude || planeArray[2]) as string)

                return {
                  id: aircraftId,
                  latitude: lat || latitude,
                  longitude: lon || longitude,
                  altitude: parseInt((planeObj.alt || planeObj.altitude || planeArray[3] || 0) as string) || 0,
                  speed: parseInt((planeObj.spd || planeObj.speed || planeArray[5] || 0) as string) || 0,
                  heading: parseInt((planeObj.hdg || planeObj.heading || planeArray[4] || 0) as string) || 0,
                  callsign: (planeObj.call || planeObj.callsign || planeArray[16] || 'Unknown') as string,
                  aircraft: (planeObj.type || planeObj.aircraft || planeArray[8] || 'Unknown') as string,
                  origin: (planeObj.from || planeObj.origin || 'Unknown') as string,
                  destination: (planeObj.to || planeObj.destination || 'Unknown') as string,
                  registration: (planeObj.reg || planeObj.registration || 'Unknown') as string,
                  aircraftType: (planeObj.aircraft_type || planeObj.type || 'Aircraft') as string,
                  image: (planeObj.image || planeObj.photo || planeObj.pic || null) as string | null
                }
              }).filter((aircraft: { latitude: number; longitude: number }) =>
                aircraft.latitude !== latitude && aircraft.longitude !== longitude
              )

              aircraft.push(...fallbackAircraft)
              console.log(`Added ${fallbackAircraft.length} aircraft from fallback search`)
            }
          }
        } catch (fallbackError) {
          console.log('Fallback search failed:', fallbackError)
        }
      }

      return NextResponse.json({ aircraft, isRealData: true })
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