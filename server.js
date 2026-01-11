require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
supabase.from('sensor_readings').select('id').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error.message);
  } else {
    console.log('Supabase connected successfully');
  }
});

// API Routes

// POST endpoint to receive sensor data from ESP32
app.post('/api/sensor-data', [
  body('node_id').notEmpty().isLength({ min: 1, max: 50 }),
  body('rain_analog').isNumeric(),
  body('rain_intensity').notEmpty().isLength({ min: 1, max: 50 }),
  body('water_distance_cm').isNumeric(),
  body('flood_status').notEmpty().isLength({ min: 1, max: 50 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { node_id, rain_analog, rain_intensity, water_distance_cm, flood_status } = req.body;

  try {
    // Insert sensor data into Supabase
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert([{
        node_id,
        rain_analog,
        rain_intensity,
        water_distance_cm,
        flood_status
      }]);
    
    if (error) throw error;
    
    console.log(`New sensor reading stored from node ${node_id}`);
    
    res.status(200).json({ 
      message: 'Sensor data received and stored successfully'
    });
  } catch (error) {
    console.error('Error storing sensor data:', error);
    res.status(500).json({ error: 'Failed to store sensor data' });
  }
});

// GET endpoint to fetch latest readings
app.get('/api/latest-readings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching latest readings:', error);
    res.status(500).json({ error: 'Failed to fetch latest readings' });
  }
});

// GET endpoint to fetch readings for a specific node
app.get('/api/node-history/:nodeId', async (req, res) => {
  const nodeId = req.params.nodeId;
  
  try {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching node history:', error);
    res.status(500).json({ error: 'Failed to fetch node history' });
  }
});

// GET endpoint to fetch flood risk analysis
app.get('/api/flood-risk', async (req, res) => {
  try {
    // Simple flood risk calculation based on recent readings
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .select(`
        node_id,
        count(*) as total_readings,
        avg(rain_analog) as avg_rain_analog,
        avg(water_distance_cm) as avg_water_distance,
        max(created_at) as last_reading_time
      `)
      .gte('created_at', twentyFourHoursAgo)
      .group('node_id');
    
    if (error) throw error;
    
    // Calculate max flood status level manually since Supabase doesn't support CASE in select
    const processedData = data.map(item => {
      // Estimate max flood status based on average values
      let maxFloodStatusLevel = 1;
      if (item.avg_rain_analog < 1800) maxFloodStatusLevel = 4; // TORRENTIAL RAIN
      else if (item.avg_rain_analog < 2400) maxFloodStatusLevel = 3; // HEAVY RAIN
      else if (item.avg_rain_analog < 3000) maxFloodStatusLevel = 2; // MODERATE RAIN
      
      return {
        ...item,
        max_flood_status_level: maxFloodStatusLevel,
        avg_rain_analog: parseFloat(item.avg_rain_analog),
        avg_water_distance: parseFloat(item.avg_water_distance)
      };
    }).sort((a, b) => b.max_flood_status_level - a.max_flood_status_level);
    
    res.json(processedData);
  } catch (error) {
    console.error('Error fetching flood risk data:', error);
    res.status(500).json({ error: 'Failed to fetch flood risk data' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'FloodNode Backend API - Ready to receive sensor data' });
});

// Start server
app.listen(PORT, () => {
  console.log(`FloodNode Backend server running on port ${PORT}`);
  console.log(`Ready to receive data from ESP32 nodes`);
});

module.exports = { app, supabase };