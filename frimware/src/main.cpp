#include <Arduino.h>
#include "cube.h"
#include "wifi_controller.h"

void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32-S3 LED Cube Initializing...");

  cube_init();
  wifi_init_ap();
  wifi_server_begin();
}

void loop()
{
  wifi_server_handle();
}
