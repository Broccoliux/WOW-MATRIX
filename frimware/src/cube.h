#ifndef CUBE_H
#define CUBE_H

#include <Arduino.h>

struct VoxelColor
{
  uint8_t r;
  uint8_t g;
  uint8_t b;
};

void cube_init();
void set_voxel(uint8_t x, uint8_t y, uint8_t z, bool state);
void set_voxel_color(uint8_t x, uint8_t y, uint8_t z, uint8_t r, uint8_t g, uint8_t b);
bool cube_set_frame(const uint8_t *data, size_t length);
void cube_clear();
void cube_refresh();

#endif
