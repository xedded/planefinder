'use client'

import { useState, useEffect, useCallback } from 'react'
import { AircraftInfo } from './AircraftInfo'
import { Settings } from './Settings'

interface Position {
  latitude: number
  longitude: number
}

interface Aircraft {
  id: string
  latitude: number
  longitude: number
  altitude?: number
  speed?: number
  heading?: number
  callsign?: string
  aircraft?: string
  origin?: string
  destination?: string
  registration?: string
  aircraftType?: string
  image?: string
  distance: number
  bearing: number
  lastSeen?: number
}

export function PlaneFinder() {
  const [userPosition, setUserPosition] = useState<Position | null>(null)
  const [userHeading, setUserHeading] = useState<number>(0)
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [lastKnownAircraft, setLastKnownAircraft] = useState<Map<string, Aircraft>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [updateInterval, setUpdateInterval] = useState(10)
  const [showSettings, setShowSettings] = useState(false)
  const [isRealData, setIsRealData] = useState<boolean | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null)
  const [orientationPermission, setOrientationPermission] = useState<'granted' | 'denied' | 'not-requested' | 'prompt'>('not-requested')

  const getUserLocation = useCallback(() => {

    if (!navigator.geolocation) {
      setError('Geolocation stöds inte av denna webbläsare')
      setLoading(false)
      return
    }


    // First try with high accuracy and shorter timeout for iOS Safari
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setError('')
        setLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Kunde inte hämta din position. '

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Du har nekat åtkomst till din position. Aktivera platsåtkomst i Safari-inställningar.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Din position är inte tillgänglig för tillfället.'
            break
          case error.TIMEOUT:
            errorMessage += 'Timeout - försöker igen med lägre noggrannhet.'
            // Try again with lower accuracy
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setUserPosition({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  })
                  setError('')
                  setLoading(false)
                },
                (secondError) => {
                  console.error('Second geolocation attempt failed:', secondError)
                  setError('Kunde inte hämta din position. Kontrollera att platsåtkomst är aktiverat i Safari.')
                  setLoading(false)
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
              )
            }, 1000)
            return
          default:
            errorMessage += `Okänt fel: ${error.message}`
        }

        setError(errorMessage)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const watchOrientation = useCallback(() => {
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null && event.alpha !== undefined) {
          let heading = event.alpha
          const eventWithWebkit = event as DeviceOrientationEvent & { webkitCompassHeading?: number }

          if (eventWithWebkit.webkitCompassHeading !== undefined) {
            // iOS with webkit compass heading (true north)
            heading = eventWithWebkit.webkitCompassHeading
          } else {
            // Android or other devices (magnetic north)
            heading = 360 - heading
          }

          setUserHeading(heading)
        }
      }

      window.addEventListener('deviceorientation', handleOrientation, true)

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true)
      }
    }
  }, [])

  const requestOrientationPermission = useCallback(async () => {
    // Check if we're on iOS and need permission
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isIOS && typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        // For iOS 13+ that requires permission
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<PermissionState> }).requestPermission()
        setOrientationPermission(permission)
        if (permission === 'granted') {
          watchOrientation()
        }
      } catch (error) {
        console.error('Error requesting iOS orientation permission:', error)
        setOrientationPermission('denied')
      }
    } else {
      // For Android and older iOS versions - try to use directly
      setOrientationPermission('granted')
      watchOrientation()
    }
  }, [watchOrientation])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180
    const y = Math.sin(dLon) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
    const bearing = (Math.atan2(y, x) * 180) / Math.PI
    return (bearing + 360) % 360
  }


  const fetchAircraft = useCallback(async () => {
    if (!userPosition) return

    try {
      console.log('🔄 Fetching aircraft...')
      const response = await fetch('/api/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userPosition.latitude,
          longitude: userPosition.longitude,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📊 Received ${data.isRealData ? 'LIVE' : 'DEMO'} data:`, data.aircraft?.length || 0, 'aircraft')

      // Check if this is real data or demo data
      setIsRealData(data.isRealData ?? null)

      const aircraftWithDistance = data.aircraft?.map((plane: Aircraft) => ({
        ...plane,
        distance: calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          plane.latitude,
          plane.longitude
        ),
        bearing: calculateBearing(
          userPosition.latitude,
          userPosition.longitude,
          plane.latitude,
          plane.longitude
        ),
      })) || []


      // Create a map of new aircraft data
      const newAircraftMap = new Map<string, Aircraft>()
      aircraftWithDistance.forEach((plane: Aircraft) => {
        newAircraftMap.set(plane.id, plane)
      })

      // Merge with last known aircraft, preserving aircraft not in current update but within range
      const currentTime = Date.now()
      setLastKnownAircraft(currentLastKnown => {
        const mergedAircraftMap = new Map(currentLastKnown)

        // Update with new data
        newAircraftMap.forEach((plane, id) => {
          mergedAircraftMap.set(id, { ...plane, lastSeen: currentTime })
        })

        // Remove aircraft not seen for more than 60 seconds or outside 100km range
        for (const [id, plane] of mergedAircraftMap.entries()) {
          const timeSinceLastSeen = currentTime - (plane.lastSeen || currentTime)
          if (timeSinceLastSeen > 60000 || plane.distance > 100) {
            mergedAircraftMap.delete(id)
          }
        }

        // Convert to array and filter/sort
        const allAircraft = Array.from(mergedAircraftMap.values())
        const filteredAircraft = allAircraft.filter((plane: Aircraft) => plane.distance <= 100)
        filteredAircraft.sort((a: Aircraft, b: Aircraft) => a.distance - b.distance)

        const finalAircraft = filteredAircraft.slice(0, 10)
        setAircraft(finalAircraft)

        return mergedAircraftMap
      })
      setLastUpdate(new Date())
    } catch (err) {
      console.log('❌ fetchAircraft error:', err instanceof Error ? err.message : err)
      setError('Failed to fetch aircraft data')
    }
  }, [userPosition])

  useEffect(() => {
    getUserLocation()
    if (orientationPermission === 'not-requested') {
      requestOrientationPermission()
    }
  }, [getUserLocation, orientationPermission, requestOrientationPermission])

  useEffect(() => {
    if (!userPosition) return

    fetchAircraft()
    const interval = setInterval(fetchAircraft, updateInterval * 1000)
    return () => clearInterval(interval)
  }, [userPosition, updateInterval, fetchAircraft])


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Getting your location...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-blue-400 mb-4">Platsåtkomst krävs</h2>
          <p className="text-red-400 mb-6 leading-relaxed">{error}</p>

          <div className="space-y-3">
            <button
              onClick={getUserLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Försök igen
            </button>

            <div className="text-sm text-gray-400 border-t border-gray-700 pt-4 mt-4">
              <p className="mb-2"><strong>För iOS Safari:</strong></p>
              <p>1. Gå till Safari → Inställningar → Sekretess & säkerhet</p>
              <p>2. Aktivera &quot;Platsbaserade tjänster&quot;</p>
              <p>3. Ladda om sidan och tillåt platsåtkomst</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">PlaneFinder</h1>
            {isRealData !== null && (
              <div className="flex items-center text-xs mt-1">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isRealData ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                />
                <span className="text-gray-400">
                  {isRealData ? 'Live FlightRadar24 data' : 'Demo data'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white"
          >
            ⚙️
          </button>
        </div>

        {showSettings && (
          <Settings
            updateInterval={updateInterval}
            setUpdateInterval={setUpdateInterval}
            onClose={() => setShowSettings(false)}
          />
        )}

        <div className="mb-8">
          {/* Radar Display */}
          <div className="flex flex-col items-center">
            <div className="relative w-80 h-80 mb-4">
              <svg
                width="320"
                height="320"
                viewBox="0 0 320 320"
                className="absolute inset-0"
              >
                {/* Radar rings */}
                <circle cx="160" cy="160" r="140" fill="none" stroke="#374151" strokeWidth="2"/>
                <circle cx="160" cy="160" r="105" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="4,4"/>
                <circle cx="160" cy="160" r="70" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="2,2"/>
                <circle cx="160" cy="160" r="35" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="2,2"/>

                {/* Cardinal directions */}
                <text x="160" y="25" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold">N</text>
                <text x="295" y="165" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold">E</text>
                <text x="160" y="305" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold">S</text>
                <text x="25" y="165" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold">W</text>

                {/* Aircraft on radar */}
                {aircraft.map((plane) => {
                  const relativeBearing = (plane.bearing - userHeading + 360) % 360
                  const radarDistance = Math.min((plane.distance / 150) * 140, 140) // Scale to radar size, max 150km range
                  const x = 160 + radarDistance * Math.sin((relativeBearing * Math.PI) / 180)
                  const y = 160 - radarDistance * Math.cos((relativeBearing * Math.PI) / 180)

                  // Check if this is stale data (not updated in last 30 seconds)
                  const isStale = plane.lastSeen && (Date.now() - plane.lastSeen) > 30000
                  const isSelected = selectedAircraft?.id === plane.id

                  const fillColor = isSelected ? "#FCD34D" : isStale ? "#94A3B8" : "#60A5FA"
                  const strokeColor = isSelected ? "#F59E0B" : isStale ? "#64748B" : "#3B82F6"

                  return (
                    <g key={plane.id} transform={`translate(${x}, ${y})`}>
                      {/* Aircraft arrow */}
                      <g
                        transform={`rotate(${(plane.heading || 0) - userHeading})`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedAircraft(selectedAircraft?.id === plane.id ? null : plane)}
                      >
                        <path
                          d="M0,-8 L-4,4 L0,2 L4,4 Z"
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="1"
                          opacity={isStale ? 0.6 : 1}
                        />
                      </g>

                      {/* Flight number label */}
                      <text
                        x="0"
                        y="-12"
                        textAnchor="middle"
                        fill={fillColor}
                        fontSize="10"
                        fontWeight="bold"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedAircraft(selectedAircraft?.id === plane.id ? null : plane)}
                        opacity={isStale ? 0.6 : 1}
                      >
                        {plane.callsign || plane.id.slice(0, 6)}
                      </text>

                      {/* Stale data indicator */}
                      {isStale && (
                        <circle
                          cx="8"
                          cy="-8"
                          r="3"
                          fill="#EF4444"
                          stroke="#DC2626"
                          strokeWidth="1"
                        />
                      )}
                    </g>
                  )
                })}

                {/* Center point (user position) */}
                <circle cx="160" cy="160" r="6" fill="#10B981" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="160" cy="160" r="2" fill="#ffffff"/>
              </svg>
            </div>

            <div className="text-center space-y-2">
              <div className="text-sm text-gray-400">
                Visar plan inom 100km • Max räckvidd: 150km • Riktning: {userHeading.toFixed(0)}°
              </div>

              {orientationPermission === 'not-requested' && (
                <button
                  onClick={requestOrientationPermission}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  Aktivera kompass
                </button>
              )}

              {orientationPermission === 'denied' && (
                <div className="text-xs text-yellow-400">
                  Kompassbehörighet nekad - radar visar norr
                </div>
              )}

              {lastUpdate && (
                <div className="text-xs text-gray-500">
                  Senast uppdaterad: {lastUpdate.toLocaleTimeString('sv-SE')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected aircraft info */}
        {selectedAircraft ? (
          <AircraftInfo aircraft={selectedAircraft} />
        ) : aircraft.length > 0 ? (
          <div className="text-center text-gray-400">
            <p>Klicka på ett plan i radarn för mer information</p>
            <p className="text-sm mt-2">Visar {aircraft.length} närmaste plan</p>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>Inga plan hittade i närheten</p>
            <p className="text-sm mt-2">Söker efter plan...</p>
          </div>
        )}
      </div>
    </div>
  )
}