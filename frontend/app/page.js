'use client';

import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../utils/api';

// Mock data for initial display
const mockSensorData = [
  { id: 1, node_id: 'floodnode_01', rain_analog: 2180, rain_intensity: 'HEAVY RAIN', water_distance_cm: 9.5, flood_status: 'CRITICAL FLOOD', timestamp: '2026-01-12T10:30:00Z' },
  { id: 2, node_id: 'floodnode_01', rain_analog: 2200, rain_intensity: 'HEAVY RAIN', water_distance_cm: 10.2, flood_status: 'CRITICAL FLOOD', timestamp: '2026-01-12T10:25:00Z' },
  { id: 3, node_id: 'floodnode_01', rain_analog: 2350, rain_intensity: 'MODERATE RAIN', water_distance_cm: 15.8, flood_status: 'FLOOD RISK', timestamp: '2026-01-12T10:20:00Z' },
  { id: 4, node_id: 'floodnode_01', rain_analog: 2800, rain_intensity: 'LIGHT RAIN', water_distance_cm: 25.3, flood_status: 'RAIN ALERT', timestamp: '2026-01-12T10:15:00Z' },
  { id: 5, node_id: 'floodnode_01', rain_analog: 3200, rain_intensity: 'NO RAIN', water_distance_cm: 35.0, flood_status: 'NORMAL', timestamp: '2026-01-12T10:10:00Z' },
];

const floodStatusColors = {
  'NORMAL': '#10b981',      // Green
  'RAIN ALERT': '#f59e0b',  // Amber
  'FLOOD RISK': '#ef4444',  // Red
  'CRITICAL FLOOD': '#8b0000' // Dark Red
};

export default function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const [floodRiskData, setFloodRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real data from the backend API
        const sensorDataResponse = await api.getLatestReadings();
        setSensorData(sensorDataResponse);
        
        if (sensorDataResponse.length > 0) {
          setLatestReading(sensorDataResponse[0]);
        }
        
        // Fetch flood risk data
        const floodRiskResponse = await api.getFloodRisk();
        setFloodRiskData(floodRiskResponse.map(item => ({
          name: item.node_id,
          risk: Math.min(100, Math.floor(item.avg_rain_analog / 40)), // Convert rain analog to risk percentage
          status: item.max_flood_status_level >= 4 ? 'CRITICAL FLOOD' : 
                  item.max_flood_status_level >= 3 ? 'FLOOD RISK' : 
                  item.max_flood_status_level >= 2 ? 'RAIN ALERT' : 'NORMAL'
        })));
        
        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // In case of error, we'll continue showing the mock data
        if (sensorData.length === 0) {
          setSensorData(mockSensorData);
          setLatestReading(mockSensorData[0]);
          setFloodRiskData([
            { name: 'floodnode_01', risk: 85, status: 'CRITICAL FLOOD' },
            { name: 'floodnode_02', risk: 45, status: 'FLOOD RISK' },
            { name: 'floodnode_03', risk: 20, status: 'NORMAL' },
          ]);
        }
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Prepare data for charts
  const chartData = sensorData.map(item => ({
    time: formatDate(item.timestamp),
    rain: item.rain_analog,
    distance: item.water_distance_cm,
    status: item.flood_status
  })).reverse(); // Reverse to show oldest first in the chart

  // Count status occurrences for pie chart
  const statusCounts = sensorData.reduce((acc, item) => {
    acc[item.flood_status] = (acc[item.flood_status] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">FloodNode Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Latest Reading Card */}
        {latestReading && (
          <div className="mb-8">
            <div className={`rounded-lg shadow-lg p-6 card-hover ${
              latestReading.flood_status === 'NORMAL' ? 'bg-flood-normal/10 border-l-4 border-flood-normal' :
              latestReading.flood_status === 'RAIN ALERT' ? 'bg-flood-alert/10 border-l-4 border-flood-alert' :
              latestReading.flood_status === 'FLOOD RISK' ? 'bg-flood-risk/10 border-l-4 border-flood-risk' :
              'bg-flood-critical/10 border-l-4 border-flood-critical'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Latest Reading</h2>
                  <p className="text-gray-600">{formatDate(latestReading.timestamp)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  latestReading.flood_status === 'NORMAL' ? 'bg-flood-normal text-white' :
                  latestReading.flood_status === 'RAIN ALERT' ? 'bg-flood-alert text-white' :
                  latestReading.flood_status === 'FLOOD RISK' ? 'bg-flood-risk text-white' :
                  'bg-flood-critical text-white'
                }`}>
                  {latestReading.flood_status}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Node ID</p>
                  <p className="text-lg font-semibold">{latestReading.node_id}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Rain Analog</p>
                  <p className="text-lg font-semibold">{latestReading.rain_analog}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Rain Intensity</p>
                  <p className="text-lg font-semibold">{latestReading.rain_intensity}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Water Distance</p>
                  <p className="text-lg font-semibold">{latestReading.water_distance_cm} cm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Rain Analog Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rain Intensity Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="rain" stroke="#8884d8" fill="#8884d8" name="Rain Analog" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Distance Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Water Distance Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="distance" stroke="#00C49F" fill="#00C49F" name="Distance (cm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flood Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Flood Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={floodStatusColors[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flood Risk by Node */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Flood Risk by Node</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floodRiskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Risk']} />
                  <Legend />
                  <Bar dataKey="risk" name="Flood Risk (%)" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}