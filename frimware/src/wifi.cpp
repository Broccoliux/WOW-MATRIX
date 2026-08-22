#include <Arduino.h>
#include <WiFi.h>
#include "wifi.h"

const char *ssid = "LED_Cube_Controller";
const char *password = "password123";

void wifi_init_ap()
{
  Serial.println("Setting up Access Point...");


  ::WiFi.softAP(ssid, password);

  IPAddress myIP = ::WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);
}
