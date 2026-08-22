#include <Arduino.h>
#include "cube.h"
#include "wifi.h"

void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32 Dev Board Starting Up...");

  cube_init();

  wifi_init_ap();
}

void loop()
{
  delay(1000);
}
