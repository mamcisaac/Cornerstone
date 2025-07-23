// Game constants and configuration

// Cross-shaped grid layout and adjacency
export const CROSS_POSITIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14];

export const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
    [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],  // Path 3
    [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8],  // Path 4
    [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],  // Path 5
    [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11],  // Path 6
    [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],  // Path 7
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],  // Path 8
    [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]   // Path 9
];

export const SAMPLE_PUZZLES = {
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "TECHNOLOGIES": { seedWord: "TECHNOLOGIES", pathIndex: 3 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 2 },
    "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 9 },
    "DEVELOPMENTS": { seedWord: "DEVELOPMENTS", pathIndex: 2 },
    "RELATIONSHIP": { seedWord: "RELATIONSHIP", pathIndex: 0 },
    "CONVERSATION": { seedWord: "CONVERSATION", pathIndex: 3 }
};

export const ADJACENCY = {
    1: [2, 4, 5, 6],
    2: [1, 5, 6, 7],
    4: [1, 5, 8, 9],
    5: [1, 2, 4, 6, 8, 9, 10],
    6: [1, 2, 5, 7, 9, 10, 11],
    7: [2, 6, 10, 11],
    8: [4, 5, 9, 13],
    9: [4, 5, 6, 8, 10, 13, 14],
    10: [5, 6, 7, 9, 11, 13, 14],
    11: [6, 7, 10, 14],
    13: [8, 9, 10, 14],
    14: [9, 10, 11, 13]
};