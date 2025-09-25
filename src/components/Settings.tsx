'use client'

interface SettingsProps {
  updateInterval: number
  setUpdateInterval: (interval: number) => void
  onClose: () => void
}

export function Settings({ updateInterval, setUpdateInterval, onClose }: SettingsProps) {
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(120, parseInt(e.target.value) || 10))
    setUpdateInterval(value)
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Update Interval (seconds)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={updateInterval}
            onChange={handleIntervalChange}
            className="w-full bg-slate-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            How often to check for new aircraft (1-120 seconds)
          </p>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Point your device toward the aircraft</p>
            <p>• Allow location and orientation permissions</p>
            <p>• Works best outdoors with good GPS signal</p>
          </div>
        </div>
      </div>
    </div>
  )
}