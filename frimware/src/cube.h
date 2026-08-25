#ifndef CUBE_H
#define CUBE_H

#include <Arduino.h>

void cube_init();
void set_voxel(uint8_t x, uint8_t y, uint8_t z, bool state);
void cube_clear();

#endif
