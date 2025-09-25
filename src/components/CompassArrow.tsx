'use client'

interface CompassArrowProps {
  targetBearing: number
  userHeading: number
  distance: number
}

export function CompassArrow({ targetBearing, userHeading, distance }: CompassArrowProps) {
  const relativeBearing = (targetBearing - userHeading + 360) % 360

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 mb-4">
        <svg
          width="256"
          height="256"
          viewBox="0 0 256 256"
          className="absolute inset-0"
        >
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="#374151"
            strokeWidth="2"
          />

          <circle
            cx="128"
            cy="128"
            r="90"
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          <circle
            cx="128"
            cy="128"
            r="60"
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          <text
            x="128"
            y="20"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="14"
            fontWeight="bold"
          >
            N
          </text>

          <text
            x="236"
            y="133"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="14"
            fontWeight="bold"
          >
            E
          </text>

          <text
            x="128"
            y="246"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="14"
            fontWeight="bold"
          >
            S
          </text>

          <text
            x="20"
            y="133"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="14"
            fontWeight="bold"
          >
            W
          </text>

          <g
            transform={`rotate(${relativeBearing} 128 128)`}
          >
            <line
              x1="128"
              y1="128"
              x2="128"
              y2="40"
              stroke="#3B82F6"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <polygon
              points="128,35 135,50 121,50"
              fill="#3B82F6"
            />

            <circle
              cx="128"
              cy="128"
              r="8"
              fill="#3B82F6"
            />
          </g>

          <circle
            cx="128"
            cy="128"
            r="4"
            fill="#EF4444"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white bg-slate-800 bg-opacity-80 rounded-lg p-2 mt-16">
            <div className="text-xs text-gray-400">DISTANCE</div>
            <div className="text-lg font-bold">{distance.toFixed(1)} km</div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="text-sm text-gray-400">
          Bearing: {targetBearing.toFixed(0)}°
        </div>
        <div className="text-sm text-gray-400">
          Your heading: {userHeading.toFixed(0)}°
        </div>
      </div>
    </div>
  )
}