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
          {/* Compass rings */}
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

          {/* Cardinal directions */}
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

          {/* Rotating airplane pointing toward target */}
          <g transform={`rotate(${relativeBearing} 128 128)`}>
            {/* Distance line */}
            <line
              x1="128"
              y1="128"
              x2="128"
              y2="60"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="4,2"
              strokeOpacity="0.6"
            />

            {/* Airplane icon */}
            <g transform="translate(128, 50)">
              {/* Airplane body */}
              <path
                d="M0,-15 L-12,-8 L-10,3 L-3,6 L0,18 L3,6 L10,3 L12,-8 Z"
                fill="#60A5FA"
                stroke="#3B82F6"
                strokeWidth="1"
              />

              {/* Airplane details */}
              <path
                d="M0,-15 L0,-10 M-6,-3 L6,-3 M0,6 L0,12"
                stroke="#1D4ED8"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Wing details */}
              <path
                d="M-8,-1 L-3,1 M8,-1 L3,1"
                stroke="#1D4ED8"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* Center point (your position) */}
          <circle
            cx="128"
            cy="128"
            r="6"
            fill="#10B981"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* Red center dot */}
          <circle
            cx="128"
            cy="128"
            r="2"
            fill="#ffffff"
          />
        </svg>

        {/* Distance display overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white bg-slate-800 bg-opacity-90 rounded-lg p-2 mt-16 border border-slate-600">
            <div className="text-xs text-gray-400">AVSTÅND</div>
            <div className="text-lg font-bold text-blue-400">{distance.toFixed(1)} km</div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-1">
        <div className="text-sm text-gray-400">
          Flygplanets riktning: {targetBearing.toFixed(0)}°
        </div>
        <div className="text-sm text-gray-400">
          Din kompassriktning: {userHeading.toFixed(0)}°
        </div>
      </div>
    </div>
  )
}