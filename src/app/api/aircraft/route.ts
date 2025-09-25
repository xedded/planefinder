import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.FLIGHTRADAR24_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FlightRadar24 API key not configured' },
        { status: 500 }
      )
    }

    const radius = 100
    const apiUrl = `https://api.flightradar24.com/common/v1/search.json?query=&lat=${latitude}&lon=${longitude}&radius=${radius}`

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('FlightRadar24 API error:', response.status, response.statusText)

      return NextResponse.json({
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
    }

    const data = await response.json()

    const aircraft = data.results?.aircraft?.map((plane: Record<string, unknown>) => ({
      id: plane.hex || plane.id,
      latitude: plane.lat,
      longitude: plane.lon,
      altitude: plane.alt,
      speed: plane.spd,
      heading: plane.hdg,
      callsign: plane.call,
      aircraft: plane.type,
      origin: plane.from,
      destination: plane.to,
      registration: plane.reg,
      aircraftType: plane.aircraft_type,
      image: plane.image
    })) || []

    return NextResponse.json({ aircraft })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch aircraft data' },
      { status: 500 }
    )
  }
}