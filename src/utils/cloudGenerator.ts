import { CloudNumber } from '../types.js';

// Pre-defined organically distributed positions for 35 chips (1 to 35)
// Designed to look like a scattered tabletop cloud of number tokens.
export const INITIAL_CLOUD_POSITIONS: Array<{ id: number; x: number; y: number; rot: number }> = [
  { id: 17, x: 14, y: 12,  rot: -8  },
  { id: 4,  x: 32, y: 8,   rot: 6   },
  { id: 29, x: 50, y: 11,  rot: -4  },
  { id: 11, x: 68, y: 9,   rot: 12  },
  { id: 22, x: 86, y: 14,  rot: -10 },

  { id: 8,  x: 8,  y: 26,  rot: 5   },
  { id: 35, x: 24, y: 22,  rot: -12 },
  { id: 1,  x: 42, y: 24,  rot: 7   },
  { id: 19, x: 59, y: 23,  rot: -6  },
  { id: 31, x: 77, y: 25,  rot: 10  },
  { id: 6,  x: 92, y: 30,  rot: -5  },

  { id: 25, x: 16, y: 40,  rot: 11  },
  { id: 13, x: 33, y: 38,  rot: -9  },
  { id: 3,  x: 50, y: 39,  rot: 4   },
  { id: 28, x: 67, y: 37,  rot: -7  },
  { id: 15, x: 84, y: 42,  rot: 8   },

  { id: 2,  x: 7,  y: 54,  rot: -6  },
  { id: 21, x: 23, y: 53,  rot: 10  },
  { id: 34, x: 40, y: 52,  rot: -5  },
  { id: 9,  x: 58, y: 52,  rot: 8   },
  { id: 27, x: 76, y: 54,  rot: -11 },
  { id: 12, x: 91, y: 58,  rot: 7   },

  { id: 30, x: 15, y: 68,  rot: -8  },
  { id: 7,  x: 31, y: 67,  rot: 6   },
  { id: 24, x: 49, y: 68,  rot: -4  },
  { id: 16, x: 66, y: 69,  rot: 9   },
  { id: 5,  x: 83, y: 70,  rot: -7  },

  { id: 20, x: 9,  y: 84,  rot: 10  },
  { id: 33, x: 25, y: 82,  rot: -6  },
  { id: 14, x: 41, y: 84,  rot: 8   },
  { id: 26, x: 58, y: 83,  rot: -9  },
  { id: 10, x: 75, y: 84,  rot: 5   },
  { id: 32, x: 91, y: 86,  rot: -10 },

  { id: 23, x: 34, y: 94,  rot: 4   },
  { id: 18, x: 67, y: 95,  rot: -6  },
];

export function createInitialCloud(): CloudNumber[] {
  return INITIAL_CLOUD_POSITIONS.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    rotation: p.rot,
    status: 'available',
  }));
}
