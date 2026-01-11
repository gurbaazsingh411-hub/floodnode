-- FloodNode Database Schema

-- Table: sensor_readings
-- Stores all sensor data collected from ESP32 nodes
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    node_id TEXT NOT NULL,
    rain_analog INTEGER NOT NULL,
    rain_intensity TEXT NOT NULL,
    water_distance_cm FLOAT NOT NULL,
    flood_status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on node_id for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_node_id ON sensor_readings(node_id);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings(created_at);

-- Index on flood_status for filtering by status
CREATE INDEX IF NOT EXISTS idx_sensor_readings_flood_status ON sensor_readings(flood_status);

-- Table: nodes
-- Stores information about each sensor node
CREATE TABLE IF NOT EXISTS nodes (
    node_id TEXT PRIMARY KEY,
    latitude FLOAT,
    longitude FLOAT,
    area_name TEXT,
    drainage_score INTEGER CHECK (drainage_score >= 1 AND drainage_score <= 5),
    installation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ACTIVE'  -- ACTIVE, INACTIVE, MAINTENANCE
);

-- Insert default node if needed
INSERT INTO nodes (node_id, area_name, drainage_score) 
VALUES ('floodnode_01', 'Default Location', 3) 
ON CONFLICT (node_id) DO NOTHING;

-- View: latest_readings_per_node
-- Shows the most recent reading from each node
CREATE OR REPLACE VIEW latest_readings_per_node AS
SELECT DISTINCT ON (node_id) 
    node_id, 
    rain_analog, 
    rain_intensity, 
    water_distance_cm, 
    flood_status, 
    created_at
FROM sensor_readings
ORDER BY node_id, created_at DESC;

-- Function: calculate_flood_risk_score
-- Calculates a risk score based on sensor data
CREATE OR REPLACE FUNCTION calculate_flood_risk_score(
    p_rain_intensity TEXT,
    p_water_distance_cm FLOAT,
    p_drainage_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
BEGIN
    -- Base risk from rain intensity
    CASE 
        WHEN p_rain_intensity = 'TORRENTIAL RAIN' THEN risk_score := risk_score + 40;
        WHEN p_rain_intensity = 'HEAVY RAIN' THEN risk_score := risk_score + 30;
        WHEN p_rain_intensity = 'MODERATE RAIN' THEN risk_score := risk_score + 20;
        WHEN p_rain_intensity = 'LIGHT RAIN' THEN risk_score := risk_score + 10;
        ELSE risk_score := risk_score + 0;
    END CASE;
    
    -- Risk from water distance (lower distance = higher risk)
    IF p_water_distance_cm <= 5 THEN 
        risk_score := risk_score + 40;
    ELSIF p_water_distance_cm <= 10 THEN 
        risk_score := risk_score + 30;
    ELSIF p_water_distance_cm <= 20 THEN 
        risk_score := risk_score + 15;
    ELSE 
        risk_score := risk_score + 5;
    END IF;
    
    -- Adjust for drainage (poor drainage increases risk)
    risk_score := risk_score + (5 - COALESCE(p_drainage_score, 3)) * 10;
    
    -- Ensure score is between 0 and 100
    risk_score := GREATEST(LEAST(risk_score, 100), 0);
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate flood risk when inserting sensor data
-- This would be used if we had a column for risk_score in sensor_readings