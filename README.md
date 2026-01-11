# FloodNode - Smart Urban Flood Monitoring System

## Project Overview

FloodNode is a smart urban flood management solution that integrates:
- Embedded sensor nodes (ESP32) for real-time rainfall and water-level monitoring
- Cloud backend for data ingestion and storage
- Interactive dashboard for visualization and alerts
- AI/ML-based predictive analytics to assess flood risk and monsoon preparedness
- GIS-based location mapping for area-wise comparison

## System Architecture

```
[ Rain & Water Sensors ]
          ↓
[ ESP32 Embedded Node ]
          ↓ (WiFi / HTTP)
[ Backend API (Node.js) ]
          ↓
[ Supabase Database ]
          ↓
[ Dashboard (React / Next.js) ]
          ↓
[ AI/ML Prediction Engine ]
```

## Project Structure

```
├── smartnode.c                 # ESP32 firmware code
├── server.js                   # Backend API server
├── db_schema.sql               # Database schema
├── package.json                # Backend dependencies
├── .env                        # Backend environment variables
├── frontend/                   # Dashboard frontend
│   ├── package.json           # Frontend dependencies
│   ├── .env.local             # Frontend environment variables
│   ├── app/                   # Next.js pages and components
│   └── utils/                 # Utility functions
└── prd.md                     # Product Requirements Document
```

## How to Run the Backend

1. Install backend dependencies:
```bash
npm install
```

2. Set up the database:
```sql
# Execute the schema file in your Supabase SQL editor:
# Copy and paste the content of db_schema.sql into the SQL editor
```

3. Create a `.env` file with your Supabase configuration:
```env
PORT=8000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Install dependencies:
```bash
npm install
```

5. Start the backend server:
```bash
npm start
# or for development:
npm run dev
```

The backend will be available at your Railway deployment URL (e.g., `https://floodnode-production.up.railway.app`)

## How to Run the Frontend

### Option 1: Separate Development Servers
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
# When deployed to Railway, this will automatically use the Railway URL:
# NEXT_PUBLIC_API_BASE_URL=https://floodnode-production.up.railway.app/api
# If you want to use Supabase directly in the frontend (optional):
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Build the frontend for production:
```bash
npm run build
```

5. Export the static files:
```bash
npm run export
```

### Option 2: Single Server (Backend serves frontend)
The backend server is configured to serve the frontend as static files. Once you build the frontend with `npm run build` and `npm run export`, place the contents of the `frontend/out` directory in your project, and the backend will serve the dashboard automatically at the root URL (https://floodnode-production.up.railway.app when deployed to Railway).

## API Endpoints

- `POST /api/sensor-data` - Receive sensor data from ESP32 nodes
- `GET /api/latest-readings` - Get the latest sensor readings
- `GET /api/node-history/:nodeId` - Get historical data for a specific node
- `GET /api/flood-risk` - Get flood risk analysis

## ESP32 Configuration

To configure your ESP32 to send data to this backend:

1. Update the WiFi credentials in `smartnode.c`:
```c
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

2. Update the server URL in `smartnode.c`:
```c
const char* serverUrl = "https://floodnode-production.up.railway.app/api/sensor-data";
```

3. Upload the code to your ESP32

## Receiving Data from Remote ESP32

To receive data from an ESP32 at a different location, you have two options:

### Option 1: Deploy Backend to Public Server
Deploy the Node.js backend to a cloud platform (like Railway, which is recommended) and update the ESP32's server URL to point to your deployed backend. Your deployed URL is https://floodnode-production.up.railway.app

### Option 2: Use ngrok for Local Testing
If you want to test with a local backend, use ngrok to create a public tunnel:

1. Install ngrok: https://ngrok.com/
2. Start your backend server: `npm start`
3. Create a tunnel: `ngrok http 3000`
4. Update the ESP32 server URL to use the ngrok URL (e.g., `https://abc123.ngrok.io/api/sensor-data`)

## Data Schema

The ESP32 sends JSON data in this format:
```json
{
  "node_id": "floodnode_01",
  "rain_analog": 2180,
  "rain_intensity": "HEAVY RAIN",
  "water_distance_cm": 9.5,
  "flood_status": "CRITICAL FLOOD",
  "timestamp": "2026-01-12T10:30:00Z"
}
```

## Database Schema

To set up the database in Supabase:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `db_schema.sql` file
4. Paste and run the SQL commands

### sensor_readings table
- id: SERIAL PRIMARY KEY
- node_id: TEXT NOT NULL
- rain_analog: INTEGER NOT NULL
- rain_intensity: TEXT NOT NULL
- water_distance_cm: FLOAT NOT NULL
- flood_status: TEXT NOT NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### nodes table
- node_id: TEXT PRIMARY KEY
- latitude: FLOAT
- longitude: FLOAT
- area_name: TEXT
- drainage_score: INTEGER CHECK (drainage_score >= 1 AND drainage_score <= 5)
- installation_date: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- status: TEXT DEFAULT 'ACTIVE'

## Dashboard Features

1. **Live Sensor Panel** - Real-time display of rain intensity, water level, and flood status
2. **Historical Graphs** - Rain vs time and water level vs time charts
3. **Map View (GIS)** - City map with sensor node markers
4. **Alerts & Notifications** - Visual alerts for critical flood conditions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request