'use client'

import { useState, useEffect, useCallback } from 'react'
import { CompassArrow } from './CompassArrow'
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
  image?: string | null
  distance: number
  bearing: number
}

export function PlaneFinder() {
  const [userPosition, setUserPosition] = useState<Position | null>(null)
  const [userHeading, setUserHeading] = useState<number>(0)
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [updateInterval, setUpdateInterval] = useState(10)
  const [showSettings, setShowSettings] = useState(false)
  const [isRealData, setIsRealData] = useState<boolean | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expandedAircraft, setExpandedAircraft] = useState<string | null>(null)
  const [orientationPermission, setOrientationPermission] = useState<'granted' | 'denied' | 'not-requested'>('not-requested')

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setLoading(false)
      return
    }

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
        setError(`Location error: ${error.message}`)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        setOrientationPermission(permission)
        if (permission === 'granted') {
          watchOrientation()
        }
      } catch (error) {
        console.error('Error requesting orientation permission:', error)
        setOrientationPermission('denied')
      }
    } else {
      // For non-iOS devices or older browsers
      setOrientationPermission('granted')
      watchOrientation()
    }
  }

  const watchOrientation = () => {
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          // Convert compass heading to match true north
          let heading = event.alpha
          if (event.webkitCompassHeading) {
            heading = event.webkitCompassHeading // iOS gives us true north
          } else {
            heading = 360 - heading // Android gives us magnetic north, convert to true north
          }
          setUserHeading(heading)
        }
      }

      window.addEventListener('deviceorientation', handleOrientation)
      return () => window.removeEventListener('deviceorientation', handleOrientation)
    }
  }

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

  const bearingToCompass = (bearing: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(bearing / 22.5) % 16
    return directions[index]
  }

  const fetchAircraft = useCallback(async () => {
    if (!userPosition) return

    try {
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

      aircraftWithDistance.sort((a: Aircraft, b: Aircraft) => a.distance - b.distance)
      setAircraft(aircraftWithDistance.slice(0, 5))
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching aircraft:', err)
      setError('Failed to fetch aircraft data')
    }
  }, [userPosition])

  useEffect(() => {
    getUserLocation()
    if (orientationPermission === 'not-requested') {
      requestOrientationPermission()
    }
  }, [orientationPermission])

  useEffect(() => {
    if (!userPosition) return

    fetchAircraft()
    const interval = setInterval(fetchAircraft, updateInterval * 1000)
    return () => clearInterval(interval)
  }, [userPosition, updateInterval, fetchAircraft])

  const closestAircraft = aircraft[0]

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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={getUserLocation}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Try Again
          </button>
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
          <CompassArrow
            targetBearing={closestAircraft?.bearing || 0}
            userHeading={userHeading}
            distance={closestAircraft?.distance || 0}
          />

          {closestAircraft && (
            <div className="text-center text-sm text-gray-300 mt-4">
              <div className="font-semibold">
                {bearingToCompass(closestAircraft.bearing)} • {closestAircraft.bearing.toFixed(0)}°
              </div>
              <div className="text-xs text-gray-400">
                Relativ riktning från din position
              </div>
            </div>
          )}

          {orientationPermission === 'not-requested' && (
            <div className="text-center mt-4">
              <button
                onClick={requestOrientationPermission}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                Aktivera kompass
              </button>
            </div>
          )}

          {orientationPermission === 'denied' && (
            <div className="text-center text-xs text-yellow-400 mt-4">
              Kompassbehörighet nekad - kompass visar norr
            </div>
          )}

          {lastUpdate && (
            <div className="text-center text-xs text-gray-500 mt-4">
              Senast uppdaterad: {lastUpdate.toLocaleTimeString('sv-SE')}
            </div>
          )}
        </div>

        {closestAircraft ? (
          <AircraftInfo aircraft={closestAircraft} />
        ) : (
          <div className="text-center text-gray-400">
            <p>No aircraft found nearby</p>
            <p className="text-sm mt-2">Searching for planes...</p>
          </div>
        )}

        {aircraft.length > 1 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Other nearby aircraft:</h3>
            <div className="space-y-2">
              {aircraft.slice(1).map((plane) => (
                <div key={plane.id} className="bg-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedAircraft(expandedAircraft === plane.id ? null : plane.id)}
                    className="w-full p-3 text-left hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-mono text-blue-400">{plane.callsign || plane.id}</div>
                        <div className="text-xs text-gray-400">
                          {bearingToCompass(plane.bearing)} • {plane.bearing.toFixed(0)}°
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{plane.distance.toFixed(1)} km</div>
                        <div className="text-xs text-gray-400">
                          {expandedAircraft === plane.id ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                  </button>

                  {expandedAircraft === plane.id && (
                    <div className="px-3 pb-3 border-t border-slate-700">
                      {plane.image && (
                        <div className="flex justify-center py-3">
                          <img
                            src={plane.image}
                            alt={plane.aircraftType || 'Aircraft'}
                            className="max-w-full h-24 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                        <div>
                          <div className="text-gray-400">Aircraft</div>
                          <div className="font-mono text-white">
                            {plane.aircraftType || plane.aircraft || 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Registration</div>
                          <div className="font-mono text-white">
                            {plane.registration || 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Altitude</div>
                          <div className="font-mono text-white">
                            {plane.altitude ? `${plane.altitude.toLocaleString()} ft` : 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Speed</div>
                          <div className="font-mono text-white">
                            {plane.speed ? `${Math.round(plane.speed)} kts` : 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Heading</div>
                          <div className="font-mono text-white">
                            {plane.heading ? `${Math.round(plane.heading)}°` : 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Route</div>
                          <div className="font-mono text-white text-xs">
                            {(plane.origin || 'Unknown')} → {(plane.destination || 'Unknown')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}