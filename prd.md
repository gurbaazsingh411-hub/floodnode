📄 Product Requirements Document (PRD)
Project Name

FloodNode – Smart Urban Flood Monitoring & Prediction System

1. Problem Statement

Urban areas frequently suffer from water logging and flash floods, especially during monsoon seasons. Existing flood monitoring systems rely heavily on delayed reports, manual observation, or coarse weather forecasts that lack localized, real-time ground data.

Cities require a low-cost, scalable, and data-driven solution that can:

Monitor rainfall and water levels at flood-prone locations

Provide early warnings

Enable area-wise flood risk analysis

Support urban planning and disaster response

2. Solution Overview

FloodNode is a smart urban flood management solution that integrates:

Embedded sensor nodes (ESP32) for real-time rainfall and water-level monitoring

Cloud backend for data ingestion and storage

Interactive dashboard for visualization and alerts

AI/ML-based predictive analytics to assess flood risk and monsoon preparedness

GIS-based location mapping for area-wise comparison

The system is designed to be hardware-driven, with software and AI layers enhancing analysis, prediction, and decision-making.

3. Goals & Objectives
Primary Goals

Collect real-time environmental data from flood-prone locations

Display live flood conditions on a centralized dashboard

Predict flood risk using historical + real-time data

Enable early warning alerts

Secondary Goals

Compare flood risks across different city zones

Provide insights into drainage efficiency and preparedness

Support scalability to multiple sensor nodes

4. Target Users

Municipal corporations / city planners

Disaster management authorities

Smart city project teams

Research and academic institutions

5. System Architecture (High Level)
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

6. Hardware Requirements (Sensor Node)
Components

ESP32 microcontroller

YL-83 Rain Sensor

HC-SR04 Ultrasonic Sensor

Power source (USB / battery)

Hardware Responsibilities

Measure:

Rain intensity (analog values)

Water distance / level

Classify:

Rain intensity level

Flood status (Normal, Risk, Critical)

Transmit data to backend via WiFi

7. Firmware (Embedded Software) Requirements
Language

Embedded C / Arduino C++

Core Functions

Read sensor values periodically

Convert raw values into meaningful classifications

Format sensor data as JSON

Send data to backend using HTTP POST

Handle no-echo and sensor noise cases

Sample Data Payload
{
  "node_id": "floodnode_01",
  "rain_analog": 2180,
  "rain_intensity": "HEAVY RAIN",
  "water_distance_cm": 9.5,
  "flood_status": "CRITICAL FLOOD",
  "timestamp": "2026-01-12T10:30:00Z"
}

8. Backend Requirements
Technology Stack

Node.js

Express.js

Supabase (PostgreSQL)

REST APIs

Backend Responsibilities

Receive sensor data from ESP32 nodes

Validate incoming data

Store readings in database

Expose APIs for dashboard consumption

Forward data to AI/ML prediction service

Core API Endpoints

POST /api/sensor-data

GET /api/latest-readings

GET /api/node-history

GET /api/flood-risk

9. Database Design (Supabase)
Table: sensor_readings
Column	Type
id	UUID
node_id	Text
rain_analog	Integer
rain_intensity	Text
water_distance_cm	Float
flood_status	Text
created_at	Timestamp
Table: nodes
Column	Type
node_id	Text
latitude	Float
longitude	Float
area_name	Text
drainage_score	Integer (1–5)
10. Dashboard (Frontend) Requirements
Technology Stack

React / Next.js

Charting library (Recharts / Chart.js)

Map integration (Leaflet / Mapbox)

Core Features
1. Live Sensor Panel

Real-time rain intensity

Current water level

Flood status (color-coded)

2. Historical Graphs

Rain vs time

Water level vs time

3. Map View (GIS)

City map with sensor node markers

Marker color based on flood risk

Click marker → view node details

4. Alerts & Notifications

Visual alerts for critical flood conditions

Area-wise warnings

11. Predictive Analytics & AI/ML
Objective

Predict flood risk probability and monsoon preparedness for each monitored area.

Inputs

Real-time sensor data

Historical rainfall data

Past flood occurrence records

Area drainage score

ML Approach

Initial rule-based risk assessment

ML models (Python):

Logistic Regression

Random Forest

Decision Tree

Output

Flood risk score (0–100%)

Risk classification:

Low

Medium

High

Integration

ML service runs independently

Backend queries ML service via API

Dashboard displays predictions visually

12. Non-Functional Requirements

Low latency data ingestion

Scalable to multiple sensor nodes

Fault tolerance for sensor failure

Secure API endpoints

Real-time responsiveness

13. Constraints & Assumptions

Hardware nodes are geographically distributed

Developers may not have physical access to hardware

Internet connectivity is required at sensor locations

Historical data may be sourced from public datasets

14. Success Metrics

Accurate real-time data reception

Reliable flood alerts during heavy rainfall

Correct risk prediction trends

Dashboard usability and clarity

Scalability to additional locations

15. Alignment with Hardware Track

FloodNode strongly aligns with the Hardware Track as the core system is built around embedded sensor nodes collecting real-time environmental data. The software and AI layers enhance and amplify the value of the hardware by enabling prediction, visualization, and decision support, making the solution both technically robust and practically deployable.