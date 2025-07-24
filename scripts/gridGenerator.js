// Grid Generator - Advanced algorithms for finding Hamiltonian paths in cross-shaped grids
import { CROSS_POSITIONS, ADJACENCY, HAMILTONIAN_PATHS } from '../src/js/constants.js';

export class GridGenerator {
    constructor() {
        this.crossPositions = CROSS_POSITIONS;
        this.adjacency = ADJACENCY;
        this.memoizedPaths = new Map();
        this.pathCache = new Map();
    }

    /**
     * Find all possible Hamiltonian paths in the cross-shaped grid
     * @returns {Array} Array of all valid Hamiltonian paths
     */
    findAllHamiltonianPaths() {
        console.log('Generating all possible Hamiltonian paths for cross-shaped grid...');
        
        const allPaths = [];
        const visited = new Array(16).fill(false);
        
        // Try starting from each cross position
        for (const startPos of this.crossPositions) {
            const currentPath = [startPos];
            visited[startPos] = true;
            
            this.findPathsRecursive(startPos, currentPath, visited, allPaths);
            
            visited[startPos] = false;
        }
        
        // Remove duplicates and sort
        const uniquePaths = this.removeDuplicatePaths(allPaths);
        console.log(`Found ${uniquePaths.length} unique Hamiltonian paths`);
        
        return uniquePaths;
    }

    /**
     * Recursively find Hamiltonian paths using backtracking
     * @param {number} currentPos - Current position in the grid
     * @param {Array} currentPath - Path built so far
     * @param {Array} visited - Visited positions tracker
     * @param {Array} allPaths - Array to store found complete paths
     */
    findPathsRecursive(currentPos, currentPath, visited, allPaths) {
        // If we've visited all 12 cross positions, we have a complete path
        if (currentPath.length === 12) {
            allPaths.push([...currentPath]);
            return;
        }

        // Try each adjacent position
        const neighbors = this.adjacency[currentPos] || [];
        for (const nextPos of neighbors) {
            // Only consider cross positions that haven't been visited
            if (this.crossPositions.includes(nextPos) && !visited[nextPos]) {
                // Add to path and mark as visited
                currentPath.push(nextPos);
                visited[nextPos] = true;
                
                // Recursively continue from this position
                this.findPathsRecursive(nextPos, currentPath, visited, allPaths);
                
                // Backtrack
                currentPath.pop();
                visited[nextPos] = false;
            }
        }
    }

    /**
     * Remove duplicate paths (paths that are the same sequence)
     * @param {Array} paths - Array of paths to deduplicate
     * @returns {Array} Array of unique paths
     */
    removeDuplicatePaths(paths) {
        const seen = new Set();
        const unique = [];
        
        for (const path of paths) {
            const pathStr = path.join(',');
            if (!seen.has(pathStr)) {
                seen.add(pathStr);
                unique.push(path);
            }
        }
        
        return unique;
    }

    /**
     * Validate that a path is a valid Hamiltonian path for the cross grid
     * @param {Array} path - Path to validate
     * @returns {boolean} True if valid Hamiltonian path
     */
    isValidHamiltonianPath(path) {
        // Must visit exactly 12 positions (all cross positions)
        if (path.length !== 12) {
            return false;
        }

        // All positions must be cross positions
        for (const pos of path) {
            if (!this.crossPositions.includes(pos)) {
                return false;
            }
        }

        // No position should be repeated
        const uniquePositions = new Set(path);
        if (uniquePositions.size !== 12) {
            return false;
        }

        // Must visit all cross positions exactly once
        for (const crossPos of this.crossPositions) {
            if (!path.includes(crossPos)) {
                return false;
            }
        }

        // Each consecutive pair must be adjacent
        for (let i = 0; i < path.length - 1; i++) {
            const currentPos = path[i];
            const nextPos = path[i + 1];
            const neighbors = this.adjacency[currentPos] || [];
            
            if (!neighbors.includes(nextPos)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Find the optimal Hamiltonian path for a given keystone word
     * This considers letter frequency and common word patterns
     * @param {string} keystoneWord - The 12-letter word to optimize for
     * @param {Set} commonWords - Set of common words for scoring
     * @returns {Object} Best path with score and analysis
     */
    findOptimalPath(keystoneWord, commonWords = new Set()) {
        const word = keystoneWord.toUpperCase();
        console.log(`Finding optimal path for: ${word}`);

        let bestPath = null;
        let bestScore = -1;
        const pathAnalysis = [];

        // Test all known Hamiltonian paths
        const pathsToTest = HAMILTONIAN_PATHS.length > 0 ? HAMILTONIAN_PATHS : this.findAllHamiltonianPaths();

        for (let i = 0; i < pathsToTest.length; i++) {
            const path = pathsToTest[i];
            
            if (!this.isValidHamiltonianPath(path)) {
                console.warn(`Invalid path at index ${i}:`, path);
                continue;
            }

            const score = this.scorePath(word, path, commonWords);
            const analysis = {
                pathIndex: i,
                path: path,
                score: score,
                details: this.analyzePathQuality(word, path, commonWords)
            };

            pathAnalysis.push(analysis);

            if (score > bestScore) {
                bestScore = score;
                bestPath = analysis;
            }
        }

        // Sort analysis by score
        pathAnalysis.sort((a, b) => b.score - a.score);

        console.log(`Best path for ${word}: Index ${bestPath?.pathIndex} with score ${bestScore}`);
        
        return {
            bestPath: bestPath,
            allAnalysis: pathAnalysis,
            totalPathsTested: pathAnalysis.length
        };
    }

    /**
     * Score a path based on how likely it is to generate many valid words
     * @param {string} keystoneWord - The keystone word
     * @param {Array} path - Hamiltonian path to score
     * @param {Set} commonWords - Common words for bonus scoring
     * @returns {number} Path score (higher is better)
     */
    scorePath(keystoneWord, path, commonWords) {
        let score = 0;
        const grid = this.createGridFromPath(keystoneWord, path);
        
        if (!grid) return -1;

        // Score based on letter frequency and positioning
        score += this.scoreLetterFrequency(keystoneWord, path);
        
        // Score based on vowel distribution
        score += this.scoreVowelDistribution(keystoneWord, path);
        
        // Score based on common letter combinations
        score += this.scoreLetterCombinations(keystoneWord, path);
        
        // Bonus for letters that commonly start words
        score += this.scoreWordStartingPositions(keystoneWord, path);

        return score;
    }

    /**
     * Create a grid from keystone word and path (similar to PuzzleBuilder but optimized)
     * @param {string} keystoneWord - 12-letter word
     * @param {Array} path - Hamiltonian path
     * @returns {Array} Grid array or null if invalid
     */
    createGridFromPath(keystoneWord, path) {
        if (keystoneWord.length !== 12 || path.length !== 12) {
            return null;
        }

        const grid = new Array(16).fill('');
        
        for (let i = 0; i < 12; i++) {
            const position = path[i];
            const letter = keystoneWord[i];
            
            if (!this.crossPositions.includes(position)) {
                return null;
            }
            
            grid[position] = letter;
        }

        return grid;
    }

    /**
     * Score based on letter frequency in English
     * @param {string} word - Keystone word
     * @param {Array} path - Path arrangement
     * @returns {number} Frequency score
     */
    scoreLetterFrequency(word, path) {
        // English letter frequencies (approximate)
        const frequencies = {
            'E': 12.7, 'T': 9.1, 'A': 8.2, 'O': 7.5, 'I': 7.0, 'N': 6.7,
            'S': 6.3, 'H': 6.1, 'R': 6.0, 'D': 4.3, 'L': 4.0, 'C': 2.8,
            'U': 2.8, 'M': 2.4, 'W': 2.4, 'F': 2.2, 'G': 2.0, 'Y': 2.0,
            'P': 1.9, 'B': 1.3, 'V': 1.0, 'K': 0.8, 'J': 0.15, 'X': 0.15,
            'Q': 0.10, 'Z': 0.07
        };

        let score = 0;
        for (const letter of word) {
            score += frequencies[letter] || 0;
        }
        
        return score;
    }

    /**
     * Score based on vowel distribution throughout the grid
     * @param {string} word - Keystone word
     * @param {Array} path - Path arrangement
     * @returns {number} Vowel distribution score
     */
    scoreVowelDistribution(word, path) {
        const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
        const vowelPositions = [];
        
        for (let i = 0; i < word.length; i++) {
            if (vowels.has(word[i])) {
                vowelPositions.push(i);
            }
        }

        // Better score for well-distributed vowels
        if (vowelPositions.length === 0) return 0;
        
        let distribution = 0;
        for (let i = 1; i < vowelPositions.length; i++) {
            distribution += Math.abs(vowelPositions[i] - vowelPositions[i-1]);
        }
        
        return vowelPositions.length * 10 + distribution;
    }

    /**
     * Score based on common 2-letter and 3-letter combinations
     * @param {string} word - Keystone word
     * @param {Array} path - Path arrangement
     * @returns {number} Combination score
     */
    scoreLetterCombinations(word, path) {
        // Common English digrams and trigrams
        const goodCombos = new Set([
            'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ND', 'ON', 'EN',
            'AT', 'OU', 'IT', 'ES', 'OR', 'TE', 'OF', 'BE', 'TO', 'AR',
            'THE', 'AND', 'ING', 'HER', 'HAT', 'HIS', 'THA', 'ERE', 'FOR', 'ENT'
        ]);

        let score = 0;
        
        // Check 2-letter combinations
        for (let i = 0; i < word.length - 1; i++) {
            const combo = word.substr(i, 2);
            if (goodCombos.has(combo)) {
                score += 5;
            }
        }
        
        // Check 3-letter combinations
        for (let i = 0; i < word.length - 2; i++) {
            const combo = word.substr(i, 3);
            if (goodCombos.has(combo)) {
                score += 10;
            }
        }
        
        return score;
    }

    /**
     * Score based on letters that commonly start English words
     * @param {string} word - Keystone word
     * @param {Array} path - Path arrangement
     * @returns {number} Word-starting score
     */
    scoreWordStartingPositions(word, path) {
        // Letters that commonly start words
        const goodStarters = new Set(['S', 'T', 'C', 'P', 'A', 'B', 'F', 'M', 'D', 'R', 'L', 'W', 'H']);
        
        let score = 0;
        for (const letter of word) {
            if (goodStarters.has(letter)) {
                score += 3;
            }
        }
        
        return score;
    }

    /**
     * Analyze the quality of a specific path arrangement
     * @param {string} word - Keystone word
     * @param {Array} path - Path to analyze
     * @param {Set} commonWords - Common words set
     * @returns {Object} Detailed analysis
     */
    analyzePathQuality(word, path, commonWords) {
        const grid = this.createGridFromPath(word, path);
        if (!grid) return { error: 'Invalid grid' };

        const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
        const vowelCount = [...word].filter(letter => vowels.has(letter)).length;
        const consonantCount = word.length - vowelCount;

        return {
            vowelCount: vowelCount,
            consonantCount: consonantCount,
            vowelRatio: vowelCount / word.length,
            uniqueLetters: new Set(word).size,
            letterFrequencyScore: this.scoreLetterFrequency(word, path),
            vowelDistributionScore: this.scoreVowelDistribution(word, path),
            combinationScore: this.scoreLetterCombinations(word, path),
            starterScore: this.scoreWordStartingPositions(word, path)
        };
    }

    /**
     * Generate new Hamiltonian paths using genetic algorithm optimization
     * @param {number} populationSize - Size of genetic algorithm population
     * @param {number} generations - Number of generations to evolve
     * @returns {Array} Best evolved paths
     */
    generateOptimizedPaths(populationSize = 50, generations = 100) {
        console.log(`Generating optimized paths using genetic algorithm (${populationSize} population, ${generations} generations)`);
        
        // Initialize random population
        let population = this.generateRandomPathPopulation(populationSize);
        
        for (let gen = 0; gen < generations; gen++) {
            // Evaluate fitness of each path
            const fitness = population.map(path => this.evaluatePathFitness(path));
            
            // Select best performers
            const selected = this.selectBestPaths(population, fitness, populationSize / 2);
            
            // Generate offspring through crossover and mutation
            const offspring = this.generateOffspring(selected, populationSize - selected.length);
            
            // Combine for next generation
            population = [...selected, ...offspring];
            
            if (gen % 20 === 0) {
                const bestFitness = Math.max(...fitness);
                console.log(`Generation ${gen}: Best fitness = ${bestFitness}`);
            }
        }
        
        // Return best paths
        const finalFitness = population.map(path => this.evaluatePathFitness(path));
        const sortedPaths = population
            .map((path, i) => ({ path, fitness: finalFitness[i] }))
            .sort((a, b) => b.fitness - a.fitness);
            
        return sortedPaths.slice(0, 10).map(item => item.path);
    }

    /**
     * Generate random population of valid Hamiltonian paths
     * @param {number} size - Population size
     * @returns {Array} Array of random valid paths
     */
    generateRandomPathPopulation(size) {
        const population = [];
        const maxAttempts = size * 10;
        let attempts = 0;
        
        while (population.length < size && attempts < maxAttempts) {
            const path = this.generateRandomHamiltonianPath();
            if (path && this.isValidHamiltonianPath(path)) {
                population.push(path);
            }
            attempts++;
        }
        
        // Fill remaining with known good paths if needed
        while (population.length < size && population.length < HAMILTONIAN_PATHS.length) {
            population.push([...HAMILTONIAN_PATHS[population.length]]);
        }
        
        return population;
    }

    /**
     * Generate a single random Hamiltonian path
     * @returns {Array|null} Random valid path or null if failed
     */
    generateRandomHamiltonianPath() {
        const unvisited = [...this.crossPositions];
        const path = [];
        
        // Start from random position
        let current = unvisited[Math.floor(Math.random() * unvisited.length)];
        path.push(current);
        unvisited.splice(unvisited.indexOf(current), 1);
        
        // Build path by randomly selecting valid adjacent positions
        while (unvisited.length > 0) {
            const neighbors = this.adjacency[current] || [];
            const validNeighbors = neighbors.filter(pos => unvisited.includes(pos));
            
            if (validNeighbors.length === 0) {
                return null; // Dead end, path failed
            }
            
            current = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
            path.push(current);
            unvisited.splice(unvisited.indexOf(current), 1);
        }
        
        return path.length === 12 ? path : null;
    }

    /**
     * Evaluate fitness of a path for genetic algorithm
     * @param {Array} path - Path to evaluate
     * @returns {number} Fitness score
     */
    evaluatePathFitness(path) {
        if (!this.isValidHamiltonianPath(path)) {
            return -1000;
        }
        
        // Use connectivity and flexibility as fitness measures
        let fitness = 0;
        
        // Reward paths that have good connectivity options
        for (let i = 0; i < path.length; i++) {
            const pos = path[i];
            const neighbors = this.adjacency[pos] || [];
            const crossNeighbors = neighbors.filter(n => this.crossPositions.includes(n));
            fitness += crossNeighbors.length * 10;
        }
        
        // Bonus for paths that traverse different regions of the cross
        const regions = this.classifyPositionsByRegion(path);
        fitness += Object.keys(regions).length * 50;
        
        return fitness;
    }

    /**
     * Classify positions by their region in the cross shape
     * @param {Array} path - Path to classify
     * @returns {Object} Regions with their positions 
     */
    classifyPositionsByRegion(path) {
        const regions = {
            top: [],
            center: [],
            bottom: [],
            left: [],
            right: []
        };
        
        for (const pos of path) {
            if ([1, 2].includes(pos)) regions.top.push(pos);
            else if ([4, 5, 6, 7].includes(pos)) regions.center.push(pos);
            else if ([13, 14].includes(pos)) regions.bottom.push(pos);
            else if ([8, 9].includes(pos)) regions.left.push(pos);
            else if ([10, 11].includes(pos)) regions.right.push(pos);
        }
        
        return regions;
    }

    /**
     * Select best paths from population based on fitness
     * @param {Array} population - Population of paths
     * @param {Array} fitness - Fitness scores
     * @param {number} count - Number to select
     * @returns {Array} Selected best paths
     */
    selectBestPaths(population, fitness, count) {
        const combined = population.map((path, i) => ({ path, fitness: fitness[i] }));
        combined.sort((a, b) => b.fitness - a.fitness);
        return combined.slice(0, count).map(item => item.path);
    }

    /**
     * Generate offspring through crossover and mutation
     * @param {Array} parents - Parent paths
     * @param {number} count - Number of offspring to generate
     * @returns {Array} Generated offspring paths
     */
    generateOffspring(parents, count) {
        const offspring = [];
        
        for (let i = 0; i < count; i++) {
            const parent1 = parents[Math.floor(Math.random() * parents.length)];
            const parent2 = parents[Math.floor(Math.random() * parents.length)];
            
            let child = this.crossoverPaths(parent1, parent2);
            if (Math.random() < 0.1) { // 10% mutation rate
                child = this.mutatePath(child);
            }
            
            if (child && this.isValidHamiltonianPath(child)) {
                offspring.push(child);
            } else {
                // If crossover/mutation failed, use a parent
                offspring.push([...parent1]);
            }
        }
        
        return offspring;
    }

    /**
     * Crossover two parent paths to create offspring
     * @param {Array} parent1 - First parent path
     * @param {Array} parent2 - Second parent path  
     * @returns {Array|null} Offspring path or null if failed
     */
    crossoverPaths(parent1, parent2) {
        // Simple order crossover: take a segment from parent1, fill rest from parent2
        const crossoverPoint = Math.floor(Math.random() * (parent1.length - 2)) + 1;
        const segment = parent1.slice(0, crossoverPoint);
        const remaining = parent2.filter(pos => !segment.includes(pos));
        
        const child = [...segment, ...remaining];
        return child.length === 12 ? child : null;
    }

    /**
     * Mutate a path by swapping two random positions
     * @param {Array} path - Path to mutate
     * @returns {Array} Mutated path
     */
    mutatePath(path) {
        if (path.length < 2) return path;
        
        const mutated = [...path];
        const pos1 = Math.floor(Math.random() * mutated.length);
        const pos2 = Math.floor(Math.random() * mutated.length);
        
        // Swap positions
        [mutated[pos1], mutated[pos2]] = [mutated[pos2], mutated[pos1]];
        
        return mutated;
    }
}