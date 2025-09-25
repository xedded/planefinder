# PlaneFinder 🛩️

Mobile web application that helps you find nearby aircraft using FlightRadar24 data with compass navigation.

## Features

- 📍 **Real-time Location Tracking** - Uses device GPS to find your position
- 🧭 **Compass Navigation** - Shows direction to the nearest aircraft with an interactive compass
- ✈️ **Aircraft Information** - Displays flight details including callsign, aircraft type, altitude, speed, and route
- ⚙️ **Configurable Updates** - Adjustable refresh interval from 1-120 seconds (default: 10s)
- 📱 **Mobile Optimized** - Fully responsive design optimized for mobile devices
- 🌐 **Device Orientation** - Uses device compass for accurate directional guidance

## Demo

Visit the live demo: https://planefinder-q4qafq545-xeddeds-projects.vercel.app

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your FlightRadar24 API key:
   ```
   FLIGHTRADAR24_API_KEY=your_api_key_here
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `FLIGHTRADAR24_API_KEY` - Your FlightRadar24 API subscription key

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **FlightRadar24 API** - Real-time aircraft data
- **Geolocation API** - Device location tracking
- **Device Orientation API** - Compass functionality

## Usage

1. Allow location and device orientation permissions when prompted
2. Point your device toward the sky and follow the compass arrow
3. View detailed information about the nearest aircraft
4. Adjust update frequency in settings if needed

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

The app is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add the `FLIGHTRADAR24_API_KEY` environment variable in Vercel dashboard
3. Deploy automatically on push to main branch

## License

MIT License
