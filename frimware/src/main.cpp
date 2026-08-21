#include <Arduino.h>

void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32 dev board is alive and connected!");
}

void loop()
{
  delay(1000);
}
