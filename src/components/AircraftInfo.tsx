'use client'

import Image from 'next/image'

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
  distance: number
  bearing: number
  registration?: string
  aircraftType?: string
  image?: string
}

interface AircraftInfoProps {
  aircraft: Aircraft
}

export function AircraftInfo({ aircraft }: AircraftInfoProps) {
  const formatAltitude = (altitude?: number) => {
    if (!altitude) return 'Unknown'
    return `${altitude.toLocaleString()} ft`
  }

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'Unknown'
    return `${Math.round(speed)} kts`
  }

  const formatHeading = (heading?: number) => {
    if (!heading) return 'Unknown'
    return `${Math.round(heading)}°`
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-blue-400">
            {aircraft.callsign || aircraft.id}
          </h2>
          {aircraft.registration && (
            <p className="text-gray-400 text-sm">{aircraft.registration}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {aircraft.distance.toFixed(1)} km
          </div>
          <div className="text-sm text-gray-400">away</div>
        </div>
      </div>

      {aircraft.image && (
        <div className="flex justify-center">
          <Image
            src={aircraft.image}
            alt={aircraft.aircraftType || 'Aircraft'}
            width={200}
            height={128}
            className="max-w-full h-32 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <div className="text-gray-400">Aircraft Type</div>
            <div className="font-mono text-white">
              {aircraft.aircraftType || aircraft.aircraft || 'Unknown'}
            </div>
          </div>

          <div>
            <div className="text-gray-400">Altitude</div>
            <div className="font-mono text-white">
              {formatAltitude(aircraft.altitude)}
            </div>
          </div>

          <div>
            <div className="text-gray-400">Speed</div>
            <div className="font-mono text-white">
              {formatSpeed(aircraft.speed)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-gray-400">Heading</div>
            <div className="font-mono text-white">
              {formatHeading(aircraft.heading)}
            </div>
          </div>

          <div>
            <div className="text-gray-400">Origin</div>
            <div className="font-mono text-white">
              {aircraft.origin || 'Unknown'}
            </div>
          </div>

          <div>
            <div className="text-gray-400">Destination</div>
            <div className="font-mono text-white">
              {aircraft.destination || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Position: {aircraft.latitude.toFixed(4)}°, {aircraft.longitude.toFixed(4)}°
        </div>
      </div>
    </div>
  )
}