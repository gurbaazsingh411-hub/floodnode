'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Waves, AlertTriangle, CheckCircle2,
  Clock, MapPin, Activity, Navigation, Info
} from 'lucide-react';
import { api } from '../utils/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet styles (must be imported in a client component or global CSS)
import 'leaflet/dist/leaflet.css';

// We'll create the icon inside the component after mounting to avoid SSR issues
const ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Mock data for initial display
const mockSensorData = [
  { id: 1, node_id: 'floodnode_01', rain_analog: 2180, rain_intensity: 'HEAVY RAIN', water_distance_cm: 9.5, flood_status: 'CRITICAL FLOOD', timestamp: new Date().toISOString() },
  { id: 2, node_id: 'floodnode_01', rain_analog: 2200, rain_intensity: 'HEAVY RAIN', water_distance_cm: 10.2, flood_status: 'CRITICAL FLOOD', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, node_id: 'floodnode_01', rain_analog: 2350, rain_intensity: 'MODERATE RAIN', water_distance_cm: 15.8, flood_status: 'FLOOD RISK', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 4, node_id: 'floodnode_01', rain_analog: 2800, rain_intensity: 'LIGHT RAIN', water_distance_cm: 25.3, flood_status: 'RAIN ALERT', timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 5, node_id: 'floodnode_01', rain_analog: 3200, rain_intensity: 'NO RAIN', water_distance_cm: 35.0, flood_status: 'NORMAL', timestamp: new Date(Date.now() - 1200000).toISOString() },
];

const statusConfig = {
  'NORMAL': { color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', text: 'text-emerald-500', icon: CheckCircle2 },
  'RAIN ALERT': { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-500', icon: Info },
  'FLOOD RISK': { color: '#ef4444', bg: 'bg-rose-500/10', border: 'border-rose-500/50', text: 'text-rose-500', icon: AlertTriangle },
  'CRITICAL FLOOD': { color: '#8b0000', bg: 'bg-red-900/20', border: 'border-red-900/50', text: 'text-red-700', icon: Droplets }
};

export default function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const [floodRiskData, setFloodRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Default coordinates (approx center of a city, e.g., Mumbai)
  const defaultPosition = [19.0760, 72.8777];

  // Leaflet icon fix
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.icon({
      iconUrl: ICON_URL,
      shadowUrl: SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const sensorDataResponse = await api.getLatestReadings();
        if (sensorDataResponse && sensorDataResponse.length > 0) {
          setSensorData(sensorDataResponse);
          setLatestReading(sensorDataResponse[0]);
        } else {
          setSensorData(mockSensorData);
          setLatestReading(mockSensorData[0]);
        }

        const floodRiskResponse = await api.getFloodRisk();
        if (floodRiskResponse && floodRiskResponse.length > 0) {
          setFloodRiskData(floodRiskResponse.map(item => ({
            name: item.node_id,
            risk: Math.min(100, Math.max(0, 100 - (item.avg_water_distance * 2))), // Custom risk calculation
            status: item.max_flood_status_level >= 4 ? 'CRITICAL FLOOD' :
              item.max_flood_status_level >= 3 ? 'FLOOD RISK' :
                item.max_flood_status_level >= 2 ? 'RAIN ALERT' : 'NORMAL'
          })));
        } else {
          setFloodRiskData([
            { name: 'floodnode_01', risk: 85, status: 'CRITICAL FLOOD' },
            { name: 'floodnode_02', risk: 45, status: 'FLOOD RISK' },
          ]);
        }

        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSensorData(mockSensorData);
        setLatestReading(mockSensorData[0]);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Faster polling for real-time feel
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const chartData = useMemo(() => {
    return sensorData.map(item => ({
      time: formatDate(item.created_at || item.timestamp),
      rain: item.rain_analog,
      distance: item.water_distance_cm,
      status: item.flood_status
    })).reverse();
  }, [sensorData]);

  const pieChartData = useMemo(() => {
    const counts = sensorData.reduce((acc, item) => {
      acc[item.flood_status] = (acc[item.flood_status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sensorData]);

  const activeStatus = latestReading ? statusConfig[latestReading.flood_status] : statusConfig['NORMAL'];
  const StatusIcon = activeStatus.icon;

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FloodNode</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Smart Urban Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-400 uppercase">Last Sync</span>
            <span className="text-sm font-mono flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-500" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <div className={cn(
            "w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
            loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500 shadow-emerald-500/40"
          )} />
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 space-y-8">

        {/* Hero Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Main Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "xl:col-span-2 rounded-3xl p-8 border shadow-2xl relative overflow-hidden transition-all duration-500",
              activeStatus.bg,
              activeStatus.border
            )}
          >
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-6">
                <div>
                  <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border mb-4", activeStatus.bg, activeStatus.border, activeStatus.text)}>
                    <StatusIcon className="w-4 h-4" />
                    {latestReading?.flood_status}
                  </div>
                  <h2 className="text-5xl font-extrabold tracking-tight md:text-6xl">
                    Live Status Conditions
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {[
                    { label: 'Rain Level', value: latestReading?.rain_analog, icon: Droplets, sub: latestReading?.rain_intensity },
                    { label: 'Water Height', value: `${latestReading?.water_distance_cm}cm`, icon: Activity, sub: 'Distance to Sensor' },
                    { label: 'Active Node', value: latestReading?.node_id, icon: Navigation, sub: 'mumbai_zone_01' },
                    { label: 'Sync Time', value: formatDate(latestReading?.created_at || latestReading?.timestamp), icon: Clock, sub: 'Real-time update' }
                  ].map((stat, i) => (
                    <div key={i} className="glass rounded-2xl p-4 border border-white/20 dark:border-white/5">
                      <stat.icon className="w-5 h-5 mb-2 text-slate-400" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">{stat.label}</p>
                      <p className="text-xl font-bold truncate">{stat.value}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Background design elements */}
            <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
              <StatusIcon className="w-80 h-80" />
            </div>
          </motion.div>

          {/* GIS Map Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border bg-white dark:bg-slate-900 shadow-xl overflow-hidden min-h-[400px]"
          >
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-bold">Spatial GIS Overview</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded uppercase">Live Nodes</span>
            </div>

            <div className="w-full h-full relative">
              {mounted && (
                <MapContainer
                  center={defaultPosition}
                  zoom={10}
                  scrollWheelZoom={false}
                  className="z-10"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {latestReading && (
                    <Marker position={defaultPosition} icon={customIcon}>
                      <Popup>
                        <div className="p-1">
                          <p className="font-bold">{latestReading.node_id}</p>
                          <p className="text-xs text-rose-500 font-bold">{latestReading.flood_status}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-6 border border-white/30"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Water & Rain Dynamics
              </h3>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                  />
                  <Area type="monotone" dataKey="rain" stroke="#818cf8" fillOpacity={1} fill="url(#colorRain)" name="Rain Intensity" strokeWidth={3} />
                  <Area type="monotone" dataKey="distance" stroke="#10b981" fillOpacity={1} fill="url(#colorDist)" name="Water Clearance" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-6 border border-white/30"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Risk Probabilities
              </h3>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floodRiskData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="risk"
                    fill="#3b82f6"
                    radius={[10, 10, 0, 0]}
                    barSize={40}
                  >
                    {floodRiskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusConfig[entry.status]?.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
