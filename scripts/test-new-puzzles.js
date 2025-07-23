// Test the new puzzles to ensure they work correctly

const HAMILTONIAN_PATHS = [
    [1, 5, 4, 8, 9, 13, 14, 10, 6, 2, 7, 11],  // Path 0
    [4, 5, 9, 8, 13, 14, 11, 7, 6, 10, 2, 1],  // Path 1
    [1, 2, 7, 11, 14, 13, 8, 4, 5, 6, 10, 9],  // Path 2
    [8, 13, 14, 10, 9, 5, 6, 11, 7, 2, 1, 4],  // Path 3
    [11, 10, 14, 13, 9, 8, 4, 5, 1, 2, 6, 7],  // Path 4
    [1, 2, 6, 5, 4, 8, 9, 10, 14, 13, 11, 7],  // Path 5
    [14, 13, 8, 9, 4, 5, 1, 2, 7, 6, 11, 10],  // Path 6
    [14, 13, 9, 10, 11, 7, 6, 2, 1, 5, 4, 8],  // Path 7
    [2, 1, 4, 5, 9, 8, 13, 14, 11, 10, 6, 7],  // Path 8
    [7, 11, 10, 14, 9, 13, 8, 4, 5, 1, 2, 6]   // Path 9
];

const ADJACENCY = {
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

const UPDATED_PUZZLES = {
    "CORNERSTONES": { seedWord: "CORNERSTONES", pathIndex: 0 },
    "AVAILABILITY": { seedWord: "AVAILABILITY", pathIndex: 1 },  // Replaced ARCHITECTURE
    "EXPERIMENTAL": { seedWord: "EXPERIMENTAL", pathIndex: 2 },
    "TECHNOLOGIES": { seedWord: "TECHNOLOGIES", pathIndex: 3 },
    "CHAMPIONSHIP": { seedWord: "CHAMPIONSHIP", pathIndex: 4 },
    "UNIVERSITIES": { seedWord: "UNIVERSITIES", pathIndex: 5 },  // Replaced INTELLIGENCE
    "NEIGHBORHOOD": { seedWord: "NEIGHBORHOOD", pathIndex: 6 },
    "THANKSGIVING": { seedWord: "THANKSGIVING", pathIndex: 7 },
    "ENCYCLOPEDIA": { seedWord: "ENCYCLOPEDIA", pathIndex: 8 },
    "BREAKTHROUGH": { seedWord: "BREAKTHROUGH", pathIndex: 9 }
};

function canFindWord(grid, adjacency, targetWord) {
    const firstLetter = targetWord[0];
    const startPositions = [];
    
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === firstLetter) {
            startPositions.push(i);
        }
    }
    
    for (const start of startPositions) {
        const visited = new Array(16).fill(false);
        const path = [];
        
        if (dfs(start, 0, visited, path)) {
            return { found: true, path };
        }
    }
    
    function dfs(pos, letterIndex, visited, path) {
        if (grid[pos] !== targetWord[letterIndex]) {
            return false;
        }
        
        visited[pos] = true;
        path.push(pos);
        
        if (letterIndex === targetWord.length - 1) {
            return true;
        }
        
        const neighbors = adjacency[pos] || [];
        for (const neighbor of neighbors) {
            if (!visited[neighbor]) {
                if (dfs(neighbor, letterIndex + 1, visited, path)) {
                    return true;
                }
            }
        }
        
        visited[pos] = false;
        path.pop();
        return false;
    }
    
    return { found: false, path: [] };
}

console.log('TESTING ALL UPDATED PUZZLES:\n');
console.log('✓ = Working puzzle (seed word can be found)');
console.log('✗ = Broken puzzle (seed word cannot be found)\n');

let workingCount = 0;
let brokenCount = 0;

Object.entries(UPDATED_PUZZLES).forEach(([name, puzzle]) => {
    const path = HAMILTONIAN_PATHS[puzzle.pathIndex];
    const grid = new Array(16).fill('');
    
    path.forEach((position, index) => {
        grid[position] = puzzle.seedWord[index];
    });
    
    const result = canFindWord(grid, ADJACENCY, puzzle.seedWord);
    const status = result.found ? '✓' : '✗';
    
    if (result.found) {
        workingCount++;
    } else {
        brokenCount++;
    }
    
    console.log(`${status} ${name.padEnd(15)} (${puzzle.seedWord})`);
    
    if (name === 'AVAILABILITY' || name === 'UNIVERSITIES') {
        // Show grid for new puzzles
        console.log('  Grid:');
        for (let row = 0; row < 4; row++) {
            const rowStr = [];
            for (let col = 0; col < 4; col++) {
                const index = row * 4 + col;
                const letter = grid[index] || ' ';
                rowStr.push(letter);
            }
            console.log('    ' + rowStr.join(' '));
        }
        if (result.found) {
            console.log(`  Path: ${result.path.join(' -> ')}`);
        }
        console.log('');
    }
});

console.log(`\nSUMMARY:`);
console.log(`Working puzzles: ${workingCount}/10`);
console.log(`Broken puzzles: ${brokenCount}/10`);

if (brokenCount === 0) {
    console.log('\n🎉 All puzzles are now working correctly!');
} else {
    console.log('\n⚠️  Some puzzles are still broken and need to be fixed.');
}