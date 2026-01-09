/**
 * Game Data - Factory recipes and items for different games
 */

export const GAMES = {
  SATISFACTORY: 'satisfactory',
  CUSTOM: 'default'
};

export const SATISFACTORY_ITEMS = [
  // Raw Resources (no requirements)
  {
    name: 'Iron Ore',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Copper Ore',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Limestone',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Coal',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Crude Oil',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Caterium Ore',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Raw Quartz',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Sulfur',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Bauxite',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Uranium',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  {
    name: 'Water',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  },
  
  // Basic Ingots
  {
    name: 'Iron Ingot',
    output: 1,
    time: 2,
    required: [{ item: 'Iron Ore', count: 1 }],
    isPlaceholder: false
  },
  {
    name: 'Copper Ingot',
    output: 1,
    time: 2,
    required: [{ item: 'Copper Ore', count: 1 }],
    isPlaceholder: false
  },
  {
    name: 'Steel Ingot',
    output: 3,
    time: 4,
    required: [
      { item: 'Iron Ore', count: 3 },
      { item: 'Coal', count: 3 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Caterium Ingot',
    output: 1,
    time: 4,
    required: [{ item: 'Caterium Ore', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Aluminum Ingot',
    output: 4,
    time: 4,
    required: [
      { item: 'Aluminum Scrap', count: 6 },
      { item: 'Silica', count: 5 }
    ],
    isPlaceholder: false
  },
  
  // Basic Parts
  {
    name: 'Iron Plate',
    output: 2,
    time: 6,
    required: [{ item: 'Iron Ingot', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Iron Rod',
    output: 1,
    time: 4,
    required: [{ item: 'Iron Ingot', count: 1 }],
    isPlaceholder: false
  },
  {
    name: 'Screw',
    output: 4,
    time: 6,
    required: [{ item: 'Iron Rod', count: 1 }],
    isPlaceholder: false
  },
  {
    name: 'Reinforced Iron Plate',
    output: 1,
    time: 12,
    required: [
      { item: 'Iron Plate', count: 6 },
      { item: 'Screw', count: 12 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Concrete',
    output: 1,
    time: 4,
    required: [{ item: 'Limestone', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Wire',
    output: 2,
    time: 4,
    required: [{ item: 'Copper Ingot', count: 1 }],
    isPlaceholder: false
  },
  {
    name: 'Cable',
    output: 1,
    time: 2,
    required: [{ item: 'Wire', count: 2 }],
    isPlaceholder: false
  },
  {
    name: 'Copper Sheet',
    output: 1,
    time: 6,
    required: [{ item: 'Copper Ingot', count: 2 }],
    isPlaceholder: false
  },
  {
    name: 'Steel Beam',
    output: 1,
    time: 4,
    required: [{ item: 'Steel Ingot', count: 4 }],
    isPlaceholder: false
  },
  {
    name: 'Steel Pipe',
    output: 2,
    time: 6,
    required: [{ item: 'Steel Ingot', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Quickwire',
    output: 5,
    time: 5,
    required: [{ item: 'Caterium Ingot', count: 1 }],
    isPlaceholder: false
  },
  
  // Intermediate Parts
  {
    name: 'Rotor',
    output: 1,
    time: 15,
    required: [
      { item: 'Iron Rod', count: 5 },
      { item: 'Screw', count: 25 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Modular Frame',
    output: 2,
    time: 60,
    required: [
      { item: 'Reinforced Iron Plate', count: 3 },
      { item: 'Iron Rod', count: 12 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Smart Plating',
    output: 1,
    time: 30,
    required: [
      { item: 'Reinforced Iron Plate', count: 1 },
      { item: 'Rotor', count: 1 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Stator',
    output: 1,
    time: 12,
    required: [
      { item: 'Steel Pipe', count: 3 },
      { item: 'Wire', count: 8 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Motor',
    output: 1,
    time: 12,
    required: [
      { item: 'Rotor', count: 2 },
      { item: 'Stator', count: 2 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Encased Industrial Beam',
    output: 1,
    time: 10,
    required: [
      { item: 'Steel Beam', count: 4 },
      { item: 'Concrete', count: 5 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Heavy Modular Frame',
    output: 1,
    time: 30,
    required: [
      { item: 'Modular Frame', count: 5 },
      { item: 'Steel Pipe', count: 15 },
      { item: 'Encased Industrial Beam', count: 5 },
      { item: 'Screw', count: 100 }
    ],
    isPlaceholder: false
  },
  
  // Electronics
  {
    name: 'Circuit Board',
    output: 1,
    time: 8,
    required: [
      { item: 'Copper Sheet', count: 2 },
      { item: 'Plastic', count: 4 }
    ],
    isPlaceholder: false
  },
  {
    name: 'AI Limiter',
    output: 1,
    time: 12,
    required: [
      { item: 'Copper Sheet', count: 5 },
      { item: 'Quickwire', count: 20 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Computer',
    output: 1,
    time: 24,
    required: [
      { item: 'Circuit Board', count: 10 },
      { item: 'Cable', count: 9 },
      { item: 'Plastic', count: 18 },
      { item: 'Screw', count: 52 }
    ],
    isPlaceholder: false
  },
  {
    name: 'High-Speed Connector',
    output: 1,
    time: 16,
    required: [
      { item: 'Quickwire', count: 56 },
      { item: 'Cable', count: 10 },
      { item: 'Circuit Board', count: 1 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Supercomputer',
    output: 1,
    time: 32,
    required: [
      { item: 'Computer', count: 2 },
      { item: 'AI Limiter', count: 2 },
      { item: 'High-Speed Connector', count: 3 },
      { item: 'Plastic', count: 28 }
    ],
    isPlaceholder: false
  },
  
  // Oil Products
  {
    name: 'Plastic',
    output: 2,
    time: 6,
    required: [{ item: 'Crude Oil', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Rubber',
    output: 2,
    time: 6,
    required: [{ item: 'Crude Oil', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Fuel',
    output: 4,
    time: 6,
    required: [{ item: 'Crude Oil', count: 6 }],
    isPlaceholder: false
  },
  {
    name: 'Petroleum Coke',
    output: 12,
    time: 6,
    required: [{ item: 'Heavy Oil Residue', count: 4 }],
    isPlaceholder: false
  },
  {
    name: 'Heavy Oil Residue',
    output: 4,
    time: 6,
    required: [{ item: 'Crude Oil', count: 3 }],
    isPlaceholder: false
  },
  
  // Quartz Products
  {
    name: 'Quartz Crystal',
    output: 3,
    time: 8,
    required: [{ item: 'Raw Quartz', count: 5 }],
    isPlaceholder: false
  },
  {
    name: 'Silica',
    output: 5,
    time: 8,
    required: [{ item: 'Raw Quartz', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Crystal Oscillator',
    output: 2,
    time: 120,
    required: [
      { item: 'Quartz Crystal', count: 36 },
      { item: 'Cable', count: 28 },
      { item: 'Reinforced Iron Plate', count: 5 }
    ],
    isPlaceholder: false
  },
  
  // Aluminum Products
  {
    name: 'Aluminum Scrap',
    output: 6,
    time: 1,
    required: [
      { item: 'Bauxite', count: 6 },
      { item: 'Water', count: 10 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Aluminum Casing',
    output: 2,
    time: 2,
    required: [{ item: 'Aluminum Ingot', count: 3 }],
    isPlaceholder: false
  },
  {
    name: 'Alclad Aluminum Sheet',
    output: 3,
    time: 6,
    required: [
      { item: 'Aluminum Ingot', count: 3 },
      { item: 'Copper Ingot', count: 1 }
    ],
    isPlaceholder: false
  },
  
  // Complex Parts
  {
    name: 'Battery',
    output: 1,
    time: 3,
    required: [
      { item: 'Sulfuric Acid', count: 2.5 },
      { item: 'Alumina Solution', count: 2 },
      { item: 'Aluminum Casing', count: 1 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Radio Control Unit',
    output: 2,
    time: 48,
    required: [
      { item: 'Aluminum Casing', count: 32 },
      { item: 'Crystal Oscillator', count: 1 },
      { item: 'Computer', count: 1 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Turbo Motor',
    output: 1,
    time: 32,
    required: [
      { item: 'Motor', count: 4 },
      { item: 'Radio Control Unit', count: 2 },
      { item: 'Rubber', count: 24 },
      { item: 'Stator', count: 7 }
    ],
    isPlaceholder: false
  },
  
  // Additional Oil Products
  {
    name: 'Sulfuric Acid',
    output: 5,
    time: 6,
    required: [{ item: 'Sulfur', count: 5 }],
    isPlaceholder: false
  },
  {
    name: 'Alumina Solution',
    output: 12,
    time: 6,
    required: [
      { item: 'Bauxite', count: 12 },
      { item: 'Water', count: 18 }
    ],
    isPlaceholder: false
  },
  
  // Space Elevator Parts
  {
    name: 'Versatile Framework',
    output: 2,
    time: 24,
    required: [
      { item: 'Modular Frame', count: 1 },
      { item: 'Steel Beam', count: 12 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Automated Wiring',
    output: 1,
    time: 24,
    required: [
      { item: 'Stator', count: 1 },
      { item: 'Cable', count: 20 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Modular Engine',
    output: 1,
    time: 60,
    required: [
      { item: 'Motor', count: 2 },
      { item: 'Rubber', count: 15 },
      { item: 'Smart Plating', count: 2 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Adaptive Control Unit',
    output: 2,
    time: 120,
    required: [
      { item: 'Automated Wiring', count: 15 },
      { item: 'Circuit Board', count: 10 },
      { item: 'Heavy Modular Frame', count: 2 },
      { item: 'Computer', count: 2 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Assembly Director System',
    output: 1,
    time: 80,
    required: [
      { item: 'Adaptive Control Unit', count: 2 },
      { item: 'Supercomputer', count: 1 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Magnetic Field Generator',
    output: 2,
    time: 120,
    required: [
      { item: 'Versatile Framework', count: 5 },
      { item: 'Electromagnetic Control Rod', count: 2 },
      { item: 'Battery', count: 10 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Thermal Propulsion Rocket',
    output: 2,
    time: 120,
    required: [
      { item: 'Modular Engine', count: 5 },
      { item: 'Turbo Motor', count: 2 },
      { item: 'Cooling System', count: 6 },
      { item: 'Fused Modular Frame', count: 2 }
    ],
    isPlaceholder: false
  },
  
  // Nuclear
  {
    name: 'Electromagnetic Control Rod',
    output: 2,
    time: 30,
    required: [
      { item: 'Stator', count: 3 },
      { item: 'AI Limiter', count: 2 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Cooling System',
    output: 1,
    time: 10,
    required: [
      { item: 'Heat Sink', count: 2 },
      { item: 'Rubber', count: 2 },
      { item: 'Water', count: 5 },
      { item: 'Nitrogen Gas', count: 25 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Fused Modular Frame',
    output: 1,
    time: 40,
    required: [
      { item: 'Heavy Modular Frame', count: 1 },
      { item: 'Aluminum Casing', count: 50 },
      { item: 'Nitrogen Gas', count: 25 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Heat Sink',
    output: 1,
    time: 8,
    required: [
      { item: 'Alclad Aluminum Sheet', count: 5 },
      { item: 'Copper Sheet', count: 3 }
    ],
    isPlaceholder: false
  },
  {
    name: 'Nitrogen Gas',
    output: 4,
    time: 6,
    required: [{ item: 'Nitrogen', count: 1 }],
    isPlaceholder: false
  },
  {
    name: 'Nitrogen',
    output: 1,
    time: 1,
    required: [],
    isPlaceholder: false
  }
];

export const GAME_DATA = {
  [GAMES.SATISFACTORY]: {
    name: 'Satisfactory',
    items: SATISFACTORY_ITEMS
  },
  [GAMES.CUSTOM]: {
    name: 'Default',
    items: []
  }
};

/**
 * Get items for a specific game
 */
export function getGameItems(gameId) {
  return GAME_DATA[gameId]?.items || [];
}

/**
 * Get game name
 */
export function getGameName(gameId) {
  return GAME_DATA[gameId]?.name || 'Unknown';
}

/**
 * Get all available games
 */
export function getAvailableGames() {
  return Object.keys(GAME_DATA).map(id => ({
    id,
    name: GAME_DATA[id].name
  }));
}
