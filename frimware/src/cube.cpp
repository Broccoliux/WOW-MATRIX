#include "cube.h"

uint8_t cube[8][8];
void cube_init()
{
  cube_clear();
}

void set_voxel(uint8_t x, uint8_t y, uint8_t z, bool state)
{
  if (x > 7 || y > 7 || z > 7)
    return;

  if (state)
  {
    cube[z][y] |= (1 << x);
  }
  else
  {
    cube[z][y] &= ~(1 << x);
  }
}

void cube_clear()
{
  for (int z = 0; z < 8; z++)
  {
    for (int y = 0; y < 8; y++)
    {
      cube[z][y] = 0;
    }
  }
}
