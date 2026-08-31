#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <LittleFS.h>
#include <mbedtls/base64.h>
#include "cube.h"
#include "wifi_controller.h"

const char *ssid = "LED_Cube_Controller";
const char *password = "password123";
WebServer server(80);
DNSServer dnsServer;

static String contentType(const String &path)
{
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "text/plain";
}

static void allowCors()
{
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

static void handleOptions()
{
  allowCors();
  server.send(204);
}

static void handleStatus()
{
  allowCors();
  server.send(200, "application/json", "{\"ok\":true,\"device\":\"ESP32-S3 LED Cube\",\"size\":8}");
}

static void handleFrame()
{
  allowCors();
  if (server.method() != HTTP_POST)
  {
    server.send(400, "application/json", "{\"ok\":false,\"error\":\"Expected a base64 frame POST\"}");
    return;
  }

  const String encoded = server.arg("plain");
  uint8_t frame[8 * 8 * 8 * 3];
  size_t decodedLength = 0;
  const int result = mbedtls_base64_decode(frame, sizeof(frame), &decodedLength,
                                           reinterpret_cast<const uint8_t *>(encoded.c_str()), encoded.length());

  if (result != 0 || decodedLength != sizeof(frame) || !cube_set_frame(frame, decodedLength))
  {
    server.send(400, "application/json", "{\"ok\":false,\"error\":\"Frame must be base64 encoded and contain exactly 1536 bytes\"}");
    return;
  }

  server.send(200, "application/json", "{\"ok\":true}");
}

static void handleClear()
{
  cube_clear();
  cube_refresh();
  allowCors();
  server.send(200, "application/json", "{\"ok\":true}");
}

static void servePortal()
{
  if (LittleFS.exists("/index.html"))
  {
    File file = LittleFS.open("/index.html", "r");
    server.sendHeader("Cache-Control", "no-store");
    server.send(200, "text/html", file.readString());
    file.close();
    return;
  }

  server.send(500, "text/plain", "Controller app is missing from LittleFS data.");
}

static void handleFileRequest()
{
  String path = server.uri();
  if (path == "/") path = "/index.html";

  if (LittleFS.exists(path))
  {
    File file = LittleFS.open(path, "r");
    server.streamFile(file, contentType(path));
    file.close();
    return;
  }

  servePortal();
}

void wifi_init_ap()
{
  Serial.println("Setting up Access Point...");

  if (!LittleFS.begin(true))
  {
    Serial.println("LittleFS mount failed");
  }

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);
  dnsServer.start(53, "*", WiFi.softAPIP());

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);
}

void wifi_server_begin()
{
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/frame", HTTP_POST, handleFrame);
  server.on("/api/clear", HTTP_POST, handleClear);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/frame", HTTP_OPTIONS, handleOptions);
  server.on("/api/clear", HTTP_OPTIONS, handleOptions);
  server.on("/generate_204", HTTP_GET, servePortal);
  server.on("/hotspot-detect.html", HTTP_GET, servePortal);
  server.on("/connecttest.txt", HTTP_GET, servePortal);
  server.on("/ncsi.txt", HTTP_GET, servePortal);
  server.on("/fwlink", HTTP_GET, servePortal);
  server.onNotFound(handleFileRequest);
  server.begin();
  Serial.println("HTTP API started on port 80");
}

void wifi_server_handle()
{
  dnsServer.processNextRequest();
  server.handleClient();
}
