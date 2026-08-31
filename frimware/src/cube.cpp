#include "cube.h"

VoxelColor cube[8][8][8];

static VoxelColor &voxel(uint8_t x, uint8_t y, uint8_t z)
{
  return cube[z][y][x];
}

void cube_init()
{
  cube_clear();
  cube_refresh();
}

void set_voxel(uint8_t x, uint8_t y, uint8_t z, bool state)
{
  if (x > 7 || y > 7 || z > 7)
    return;

  set_voxel_color(x, y, z, state ? 255 : 0, state ? 255 : 0, state ? 255 : 0);
}

void set_voxel_color(uint8_t x, uint8_t y, uint8_t z, uint8_t r, uint8_t g, uint8_t b)
{
  if (x > 7 || y > 7 || z > 7)
    return;

  voxel(x, y, z) = {r, g, b};
}

bool cube_set_frame(const uint8_t *data, size_t length)
{
  if (data == nullptr || length != 8 * 8 * 8 * 3)
    return false;

  size_t offset = 0;
  for (uint8_t z = 0; z < 8; z++)
  {
    for (uint8_t y = 0; y < 8; y++)
    {
      for (uint8_t x = 0; x < 8; x++)
      {
        set_voxel_color(x, y, z, data[offset], data[offset + 1], data[offset + 2]);
        offset += 3;
      }
    }
  }

  cube_refresh();
  return true;
}

void cube_clear()
{
  for (int z = 0; z < 8; z++)
  {
    for (int y = 0; y < 8; y++)
    {
      for (int x = 0; x < 8; x++)
      {
        voxel(x, y, z) = {0, 0, 0};
      }
    }
  }
}

void cube_refresh()
{
  // Connect the RGB driver here. The framebuffer is ready in cube[z][y][x].
}
