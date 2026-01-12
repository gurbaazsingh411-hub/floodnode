// ===== ESP32 SMART FLOOD NODE =====
// YL-83 Rain Sensor + HC-SR04 Ultrasonic
// Output via Serial Monitor only

#include <WiFiClientSecure.h>

#define RAIN_AO 34
#define RAIN_DO 5
#define TRIG 25
#define ECHO 33

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://floodnode-production.up.railway.app/api/sensor-data";
const char* nodeID = "floodnode_01";

long duration;
float distanceCM;
int rainAnalog;
String rainIntensity;
String floodStatus;

void setup() {
  Serial.begin(115200);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(RAIN_DO, INPUT);

  digitalWrite(TRIG, LOW);

  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.localIP());

  Serial.println("\nSMART URBAN FLOOD NODE STARTED");
  delay(2000);
}

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nReconnected!");
    } else {
      Serial.println("\nReconnection failed.");
    }
  }
}

// -------- Ultrasonic with No-Echo Fix --------
float getUltrasonic() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(5);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH, 30000);   // 30ms timeout

  if (duration == 0) return 400;           // no echo → far distance

  return (duration * 0.034) / 2.0;
}

void loop() {

  // ---- Read Sensors ----
  rainAnalog = analogRead(RAIN_AO);
  distanceCM = getUltrasonic();

  // ---- Rain Intensity (YL-83 calibrated) ----
  if (rainAnalog > 3600)
    rainIntensity = "NO RAIN";
  else if (rainAnalog > 3000)
    rainIntensity = "LIGHT RAIN";
  else if (rainAnalog > 2400)
    rainIntensity = "MODERATE RAIN";
  else if (rainAnalog > 1800)
    rainIntensity = "HEAVY RAIN";
  else
    rainIntensity = "TORRENTIAL RAIN";

  // ---- Flood Logic ----
  if (rainAnalog < 2400 && distanceCM < 10)
    floodStatus = "CRITICAL FLOOD";
  else if (rainAnalog < 2400 && distanceCM < 20)
    floodStatus = "FLOOD RISK";
  else if (rainAnalog < 2400)
    floodStatus = "RAIN ALERT";
  else
    floodStatus = "NORMAL";

  // ---- Serial Output ----
  Serial.println("\n==============================");
  Serial.println("SMART URBAN FLOOD NODE");

  Serial.print("Rain Sensor: ");
  Serial.println(rainAnalog);

  Serial.print("Rain Intensity: ");
  Serial.println(rainIntensity);

  Serial.print("Water Distance: ");
  Serial.print(distanceCM);
  Serial.println(" cm");

  Serial.print("Flood Status: ");
  Serial.println(floodStatus);

  Serial.println("==============================");

  // Send data to backend if WiFi is connected
  checkWiFi();
  
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure *client = new WiFiClientSecure;
    if (client) {
      client->setInsecure(); // This allows the connection without checking the certificate chain
      
      HTTPClient http;
      http.begin(*client, serverUrl);
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"node_id\":\"" + String(nodeID) + "\",\"rain_analog\":" + String(rainAnalog) + ",\"rain_intensity\":\"" + rainIntensity + "\",\"water_distance_cm\":" + String(distanceCM) + ",\"flood_status\":\"" + floodStatus + "\"}";

      int httpResponseCode = http.POST(payload);

      Serial.print("HTTP Response: ");
      Serial.println(httpResponseCode);

      http.end();
      delete client;
    }
  }

  delay(4000);
}