// Direct analysis of puzzle grids

const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],
    [5, 1, 2, 6, 10, 14, 13, 9, 8, 4, 7, 11],
    [11, 7, 2, 1, 5, 9, 13, 14, 10, 6, 4, 8],
    [8, 4, 5, 1, 6, 2, 7, 11, 14, 10, 9, 13],
    [9, 5, 4, 8, 13, 14, 10, 6, 1, 2, 7, 11],
    [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],
    [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]
];

const SAMPLE_PUZZLES = {
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "ARCHITECTURE": { seedWord: "ARCHITECTURE", pathIndex: 1 },
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "TECHNOLOGIES": { seedWord: "TECHNOLOGIES", pathIndex: 3 },
    "CHAMPIONSHIP": { seedWord: "CHAMPIONSHIP", pathIndex: 4 },
    "INTELLIGENCE": { seedWord: "INTELLIGENCE", pathIndex: 5 },
    "NEIGHBORHOOD": { seedWord: "NEIGHBORHOOD", pathIndex: 6 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 8 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 }
};

// Show each puzzle's grid
Object.entries(SAMPLE_PUZZLES).forEach(([name, puzzle]) => {
    console.log(`\n${name}:`);
    const grid = new Array(16).fill(' ');
    const path = HAMILTONIAN_PATHS[puzzle.pathIndex];
    const letters = puzzle.seedWord.split('');
    
    path.forEach((position, index) => {
        grid[position] = letters[index];
    });
    
    // Display as 4x4 grid
    console.log(`  ${grid[0]} ${grid[1]} ${grid[2]} ${grid[3]}`);
    console.log(`  ${grid[4]} ${grid[5]} ${grid[6]} ${grid[7]}`);
    console.log(`  ${grid[8]} ${grid[9]} ${grid[10]} ${grid[11]}`);
    console.log(`  ${grid[12]} ${grid[13]} ${grid[14]} ${grid[15]}`);
});