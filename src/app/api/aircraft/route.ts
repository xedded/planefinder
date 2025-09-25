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
          aircraft: 'Airbus A320',
          origin: 'ARN',
          destination: 'CPH',
          registration: 'SE-ABC',
          aircraftType: 'Airbus A320',
          image: undefined
        },
        {
          id: 'demo-2',
          latitude: latitude - 0.02,
          longitude: longitude + 0.015,
          altitude: 28000,
          speed: 380,
          heading: 225,
          callsign: 'NAX456',
          aircraft: 'Boeing 737-800',
          origin: 'OSL',
          destination: 'STO',
          registration: 'LN-XYZ',
          aircraftType: 'Boeing 737-800',
          image: undefined
        },
        {
          id: 'demo-3',
          latitude: latitude + 0.005,
          longitude: longitude - 0.02,
          altitude: 41000,
          speed: 520,
          heading: 180,
          callsign: 'DLH789',
          aircraft: 'Airbus A350-900',
          origin: 'FRA',
          destination: 'ARN',
          registration: 'D-ADEF',
          aircraftType: 'Airbus A350-900',
          image: undefined
        }
      ]
    })

    const rawApiKey = process.env.FR24_API_TOKEN
    // Extract the token part after the pipe separator
    const apiKey = rawApiKey?.includes('|') ? rawApiKey.split('|')[1] : rawApiKey

    // Try the public FlightRadar24 API first (no auth required)
    console.log('Trying public FlightRadar24 API first...')

    try {
      const publicUrl = `https://data-live.flightradar24.com/zones/fcgi?bounds=${latitude + 1},${latitude - 1},${longitude - 1},${longitude + 1}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1`

      const publicResponse = await fetch(publicUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PlaneFinder/1.0)',
          'Accept': 'application/json',
          'Referer': 'https://www.flightradar24.com/',
        },
      })

      if (publicResponse.ok) {
        const publicData = await publicResponse.json()
        console.log('Public API response keys:', Object.keys(publicData))
        console.log('Public API aircraft count:', publicData.full_count || 0)

        if (publicData && typeof publicData === 'object') {
          // FlightRadar24 public API returns aircraft as object properties, not array
          const aircraftEntries = Object.entries(publicData).filter(([key, value]) =>
            key !== 'full_count' && key !== 'version' && key !== 'stats' &&
            value && typeof value === 'object' && Array.isArray(value)
          )

          console.log('Found aircraft entries:', aircraftEntries.length)

          const aircraft = aircraftEntries.slice(0, 10).map(([id, data]) => {
            const aircraftArray = data as unknown[]

            // Log raw data for debugging and analysis
            console.log(`Aircraft ${id}:`)
            console.log('Full array length:', aircraftArray.length)
            console.log('Array content:', aircraftArray)
            console.log('Index mapping:')
            aircraftArray.forEach((item, index) => {
              if (item !== null && item !== undefined && item !== '') {
                console.log(`  [${index}]: ${item}`)
              }
            })

            const parsedAlt = parseInt(aircraftArray[4] as string)
            const parsedSpeed = parseInt(aircraftArray[5] as string)
            const parsedHeading = parseInt(aircraftArray[3] as string)

            // Try multiple indices for callsign, origin, destination
            const possibleCallsigns = [aircraftArray[16], aircraftArray[13], aircraftArray[17]]
            const possibleOrigins = [aircraftArray[11], aircraftArray[12], aircraftArray[13]]
            const possibleDestinations = [aircraftArray[12], aircraftArray[13], aircraftArray[14]]
            const possibleAircraft = [aircraftArray[8], aircraftArray[9], aircraftArray[10]]
            const possibleRegistrations = [aircraftArray[9], aircraftArray[10], aircraftArray[11]]

            const callsign = possibleCallsigns.find(c => c && typeof c === 'string' && c.trim() && c !== '-' && c !== 'N/A') || 'Unknown'
            const origin = possibleOrigins.find(o => o && typeof o === 'string' && o.trim() && o !== '-' && o !== 'N/A' && o.length >= 3) || 'Unknown'
            const destination = possibleDestinations.find(d => d && typeof d === 'string' && d.trim() && d !== '-' && d !== 'N/A' && d.length >= 3) || 'Unknown'
            const aircraftType = possibleAircraft.find(a => a && typeof a === 'string' && a.trim() && a !== '-' && a !== 'N/A') || 'Aircraft'
            const registration = possibleRegistrations.find(r => r && typeof r === 'string' && r.trim() && r !== '-' && r !== 'N/A') || 'Unknown'

            const result = {
              id: id,
              latitude: parseFloat(aircraftArray[1] as string) || latitude,
              longitude: parseFloat(aircraftArray[2] as string) || longitude,
              altitude: isNaN(parsedAlt) ? undefined : parsedAlt,
              speed: isNaN(parsedSpeed) ? undefined : parsedSpeed,
              heading: isNaN(parsedHeading) ? undefined : parsedHeading,
              callsign: (callsign as string)?.trim() || 'Unknown',
              aircraft: (aircraftType as string)?.trim() || 'Aircraft',
              origin: (origin as string)?.trim() || 'Unknown',
              destination: (destination as string)?.trim() || 'Unknown',
              registration: (registration as string)?.trim() || 'Unknown',
              aircraftType: (aircraftType as string)?.trim() || 'Aircraft',
              image: undefined
            }

            console.log('Parsed result:', result)
            return result
          }).filter(aircraft =>
            aircraft.latitude !== latitude && aircraft.longitude !== longitude &&
            aircraft.latitude !== 0 && aircraft.longitude !== 0
          )

          console.log(`Found ${aircraft.length} aircraft from public API`)
          console.log('Sample aircraft data:', aircraft.length > 0 ? aircraft[0] : 'No aircraft')

          // Log aircraft with missing data
          const missingData = aircraft.filter(a => !a.speed || !a.altitude || a.origin === 'Unknown' || a.destination === 'Unknown')
          if (missingData.length > 0) {
            console.log(`${missingData.length} aircraft missing data:`, missingData.map(a => ({
              id: a.id,
              callsign: a.callsign,
              speed: a.speed,
              altitude: a.altitude,
              origin: a.origin,
              destination: a.destination
            })))
          }

          if (aircraft.length > 0) {
            return NextResponse.json({ aircraft, isRealData: true })
          }
        }
      }
    } catch (publicError) {
      console.log('Public API failed:', publicError)
    }

    if (!apiKey) {
      console.log('No API key configured, returning demo data')
      return NextResponse.json(getDemoData())
    }

    try {
      // Based on API testing, try these working endpoint formats
      const radius = 3.0  // Larger radius for more aircraft

      // Based on official FR24 API documentation - correct base URL and endpoint
      const bounds = `${latitude + radius},${latitude - radius},${longitude - radius},${longitude + radius}` // N,S,W,E
      const endpoints = [
        // Official live flight positions endpoint as per documentation
        `https://fr24api.flightradar24.com/api/live/flight-positions/light?bounds=${bounds}`,
        // Alternative endpoint structure
        `https://fr24api.flightradar24.com/api/live/flight-positions?bounds=${bounds}`,
        // Full flight positions endpoint
        `https://fr24api.flightradar24.com/api/live/flight-positions/full?bounds=${bounds}`
      ]

      let response: Response | null = null

      for (const apiUrl of endpoints) {
        try {
          console.log(`Trying endpoint: ${apiUrl}`)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)

          // Official FR24 API headers as per documentation
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${apiKey}`,
            'Accept-Version': 'v1',
            'Accept': 'application/json',
            'User-Agent': 'PlaneFinder/1.0'
          }

          response = await fetch(apiUrl, {
            headers,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            console.log(`✅ SUCCESS: ${apiUrl} returned ${response.status}`)
            break
          } else {
            const errorText = await response.text()
            console.log(`❌ FAILED: ${apiUrl}`)
            console.log(`   Status: ${response.status} ${response.statusText}`)
            console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`)
            console.log(`   Response: ${errorText.substring(0, 300)}`)
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

      // Handle Explorer API response format
      let aircraftData = []

      if (data.data && Array.isArray(data.data)) {
        // Explorer API format: { data: [...], pagination: {...} }
        aircraftData = data.data
        console.log('Using Explorer API data array format, found:', aircraftData.length, 'items')
      } else if (data.flights && Array.isArray(data.flights)) {
        // Alternative format: { flights: [...] }
        aircraftData = data.flights
        console.log('Using flights array format, found:', aircraftData.length, 'items')
      } else if (data.aircraft && Array.isArray(data.aircraft)) {
        // Standard aircraft array format
        aircraftData = data.aircraft
        console.log('Using aircraft array format, found:', aircraftData.length, 'items')
      } else if (Array.isArray(data)) {
        // Direct array format
        aircraftData = data
        console.log('Using direct array format, found:', aircraftData.length, 'items')
      } else if (typeof data === 'object' && data !== null) {
        // Object format - check for flights in object properties
        const objectValues = Object.values(data)
        console.log('Object format detected, checking', objectValues.length, 'values')

        aircraftData = objectValues.filter((item: unknown) => {
          if (!item || typeof item !== 'object') return false
          const obj = item as Record<string, unknown>

          // Check for flight object properties
          return (obj.latitude !== undefined && obj.longitude !== undefined) ||
                 (obj.lat !== undefined && obj.lon !== undefined) ||
                 (obj.position && typeof obj.position === 'object')
        })
        console.log('Found aircraft objects:', aircraftData.length)
      }

      console.log('Final aircraftData length:', aircraftData.length)
      if (aircraftData.length > 0) {
        console.log('Sample aircraft object:', JSON.stringify(aircraftData[0], null, 2))
      }

      const aircraft = aircraftData.slice(0, 10).map((plane: Record<string, unknown>, index: number) => {
        // Handle Explorer API object format
        const position = plane.position as Record<string, unknown> || plane
        const flight = plane.flight as Record<string, unknown> || plane
        const aircraft_info = plane.aircraft as Record<string, unknown> || plane

        const aircraftId = (plane.id || plane.hex || plane.icao || aircraft_info.hex || `aircraft-${index}`) as string
        const lat = parseFloat((position.latitude || position.lat || plane.latitude || plane.lat || 0) as string)
        const lon = parseFloat((position.longitude || position.lon || plane.longitude || plane.lon || 0) as string)

        return {
          id: aircraftId,
          latitude: lat || latitude,
          longitude: lon || longitude,
          altitude: parseInt((position.altitude || plane.altitude || 0) as string) || 0,
          speed: parseInt((position.speed || plane.speed || 0) as string) || 0,
          heading: parseInt((position.heading || position.track || plane.heading || 0) as string) || 0,
          callsign: (flight.callsign || plane.callsign || 'Unknown') as string,
          aircraft: (aircraft_info.model || aircraft_info.type || plane.aircraft || 'Unknown') as string,
          origin: (flight.origin || plane.origin || 'Unknown') as string,
          destination: (flight.destination || plane.destination || 'Unknown') as string,
          registration: (aircraft_info.registration || plane.registration || 'Unknown') as string,
          aircraftType: (aircraft_info.model || aircraft_info.type || plane.aircraft_type || 'Aircraft') as string,
          image: (aircraft_info.image || plane.image || undefined) as string | undefined
        }
      }).filter((aircraft: { latitude: number; longitude: number }) =>
        aircraft.latitude !== latitude && aircraft.longitude !== longitude &&
        aircraft.latitude !== 0 && aircraft.longitude !== 0
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
              'X-API-Key': apiKey,
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

              const fallbackAircraft = fallbackAircraftData.slice(0, 10).map((plane: unknown, index: number) => {
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
                  image: (planeObj.image || planeObj.photo || planeObj.pic || undefined) as string | undefined
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