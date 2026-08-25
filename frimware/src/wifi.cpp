#include <Arduino.h>
#include <WiFiType.h>
#include <WiFi.h>
#include "wifi.h"

const char *ssid = "LED_Cube_Controller";
const char *password = "password123";

void wifi_init_ap()
{
  Serial.println("Setting up Access Point...");

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);
}
