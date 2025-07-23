// Word finding logic and grid management
import { ADJACENCY } from './constants.js';
import { GAME_CONFIG } from './config.js';

export class WordFinder {
    constructor(wordSet) {
        this.wordSet = wordSet || new Set();
    }

    // Find all possible words in a grid using DFS
    findAllWords(grid) {
        const validWords = new Set();
        
        // Try starting from each non-empty position
        for (let i = 0; i < grid.length; i++) {
            if (grid[i]) {
                this.dfs(grid, i, '', new Array(grid.length).fill(false), validWords);
            }
        }
        
        return validWords;
    }

    // Depth-first search to find words
    dfs(grid, position, currentWord, visited, validWords) {
        if (!grid[position]) return;
        
        visited[position] = true;
        const newWord = currentWord + grid[position];
        
        // Check if this forms a valid word (4+ letters)
        if (newWord.length >= GAME_CONFIG.MIN_WORD_LENGTH && this.wordSet.has(newWord.toUpperCase())) {
            validWords.add(newWord.toUpperCase());
        }
        
        // Continue searching if word isn't too long
        if (newWord.length < 12) {
            const neighbors = ADJACENCY[position] || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor] && grid[neighbor]) {
                    this.dfs(grid, neighbor, newWord, [...visited], validWords);
                }
            }
        }
    }

    // Check if a specific path spells a valid word
    isValidPath(grid, path) {
        if (path.length < 2) return false;
        
        let word = '';
        for (let i = 0; i < path.length; i++) {
            const position = path[i];
            if (!grid[position]) return false;
            
            word += grid[position];
            
            // Check adjacency between consecutive positions
            if (i > 0) {
                const prevPosition = path[i - 1];
                const neighbors = ADJACENCY[prevPosition] || [];
                if (!neighbors.includes(position)) {
                    return false;
                }
            }
        }
        
        return word.length >= GAME_CONFIG.MIN_WORD_LENGTH && this.wordSet.has(word.toUpperCase());
    }

    // Get word from path
    getWordFromPath(grid, path) {
        let word = '';
        for (const position of path) {
            if (grid[position]) {
                word += grid[position];
            }
        }
        return word.toUpperCase();
    }

    // Find path for a specific word in the grid
    findWordPath(grid, targetWord) {
        const target = targetWord.toUpperCase();
        
        // Try starting from each position
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] && grid[i].toUpperCase() === target[0]) {
                const path = this.findWordPathFromPosition(grid, target, i, []);
                if (path) return path;
            }
        }
        
        return null;
    }

    // Recursive helper to find word path from a specific starting position
    findWordPathFromPosition(grid, targetWord, position, currentPath) {
        if (!grid[position]) return null;
        
        const newPath = [...currentPath, position];
        const currentWord = newPath.map(pos => grid[pos]).join('').toUpperCase();
        
        // If we've built the complete word, return the path
        if (currentWord === targetWord) {
            return newPath;
        }
        
        // If we've gone too far or word doesn't match prefix, backtrack
        if (currentWord.length >= targetWord.length || !targetWord.startsWith(currentWord)) {
            return null;
        }
        
        // Try continuing to adjacent positions
        const neighbors = ADJACENCY[position] || [];
        for (const neighbor of neighbors) {
            if (!newPath.includes(neighbor) && grid[neighbor]) {
                const result = this.findWordPathFromPosition(grid, targetWord, neighbor, newPath);
                if (result) return result;
            }
        }
        
        return null;
    }

    // Validate that a puzzle's seed word can actually be found
    validatePuzzle(seedWord, hamiltonian_path) {
        // Create grid from seed word and path
        const grid = new Array(16).fill('');
        hamiltonian_path.forEach((position, index) => {
            grid[position] = seedWord[index];
        });
        
        // Try to find the seed word in the grid
        const path = this.findWordPath(grid, seedWord);
        return path !== null;
    }

    // Get all cornerstone words from a set of valid words
    getCornerstoneWords(validWords, commonWordsSet) {
        if (!commonWordsSet) return [];
        
        return Array.from(validWords).filter(word => 
            commonWordsSet.has(word.toUpperCase())
        ).sort();
    }
}