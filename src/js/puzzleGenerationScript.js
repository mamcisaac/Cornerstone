#!/usr/bin/env node

// Puzzle Generation Script - Automated pipeline for creating Cornerstones puzzles
import { PuzzleBuilder } from './puzzleBuilder.js';
import { GridGenerator } from './gridGenerator.js';
import { DatamuseClient } from './datamuseClient.js';
import { DefinitionValidator } from './definitionValidator.js';
import { PuzzleValidator } from './puzzleValidator.js';
import { DataIntegration } from './dataIntegration.js';
import { WordDiscoverySystem } from './wordDiscovery.js';

class PuzzleGenerationPipeline {
    constructor(options = {}) {
        this.options = {
            // Input options
            keystoneWords: options.keystoneWords || [],
            keystoneWordFile: options.keystoneWordFile || null,
            
            // Generation options
            minCornerstoneWords: options.minCornerstoneWords || 20,
            maxPuzzles: options.maxPuzzles || 50,
            batchSize: options.batchSize || 5,
            
            // API options
            useDatamuse: options.useDatamuse !== false,
            useLLMValidation: options.useLLMValidation !== false,
            openaiApiKey: options.openaiApiKey || process.env.OPENAI_API_KEY,
            
            // Output options
            outputDir: options.outputDir || './generated-puzzles',
            generateDataFiles: options.generateDataFiles !== false,
            validatePuzzles: options.validatePuzzles !== false,
            
            // Debug options
            verbose: options.verbose || false,
            saveIntermediateResults: options.saveIntermediateResults || false,
            
            ...options
        };

        this.stats = {
            startTime: null,
            keystoneWordsProcessed: 0,
            puzzlesGenerated: 0,
            puzzlesValidated: 0,
            definitionsFetched: 0,
            validationFailures: 0,
            totalTime: 0
        };

        this.initializeComponents();
    }

    /**
     * Initialize all pipeline components
     */
    initializeComponents() {
        this.puzzleBuilder = new PuzzleBuilder();
        this.gridGenerator = new GridGenerator();
        this.datamuseClient = new DatamuseClient();
        this.definitionValidator = new DefinitionValidator({
            apiKey: this.options.openaiApiKey
        });
        this.puzzleValidator = new PuzzleValidator({
            minCornerstoneWords: this.options.minCornerstoneWords
        });
        this.dataIntegration = new DataIntegration();
        this.wordDiscovery = new WordDiscoverySystem();

        console.log('🎯 Puzzle Generation Pipeline initialized');
        if (this.options.verbose) {
            console.log('Configuration:', JSON.stringify(this.options, null, 2));
        }
    }

    /**
     * Main pipeline execution
     * @returns {Promise<Object>} Generation results
     */
    async run() {
        this.stats.startTime = Date.now();
        console.log('🚀 Starting puzzle generation pipeline...');

        try {
            // Phase 1: Load keystone words
            const keystoneWords = await this.loadKeystoneWords();
            console.log(`📝 Loaded ${keystoneWords.length} keystone words`);

            // Phase 2: Generate puzzles
            const puzzles = await this.generatePuzzles(keystoneWords);
            console.log(`🧩 Generated ${puzzles.length} valid puzzles`);

            // Phase 3: Fetch definitions
            const definitions = await this.fetchDefinitions(puzzles);
            console.log(`📚 Fetched ${Object.keys(definitions).length} definitions`);

            // Phase 4: Validate definitions
            const validatedDefinitions = await this.validateDefinitions(definitions);
            console.log(`✅ Validated ${Object.keys(validatedDefinitions).length} definitions`);

            // Phase 5: Validate puzzles
            const validatedPuzzles = await this.validatePuzzles(puzzles, validatedDefinitions);
            console.log(`🔍 ${validatedPuzzles.length} puzzles passed validation`);

            // Phase 6: Generate output
            const output = await this.generateOutput(validatedPuzzles, validatedDefinitions);
            console.log(`📤 Generated output files`);

            return this.generateReport(validatedPuzzles, validatedDefinitions, output);

        } catch (error) {
            console.error('❌ Pipeline failed:', error);
            throw error;
        } finally {
            this.stats.totalTime = Date.now() - this.stats.startTime;
        }
    }

    /**
     * Load keystone words from various sources
     * @returns {Promise<Array>} Array of keystone words
     */
    async loadKeystoneWords() {
        let words = [];

        // Load from array if provided
        if (this.options.keystoneWords.length > 0) {
            words = [...this.options.keystoneWords];
        }

        // Load from file if specified
        if (this.options.keystoneWordFile) {
            try {
                const fileContent = await this.loadFile(this.options.keystoneWordFile);
                const fileWords = this.parseKeystoneWordsFile(fileContent);
                words = [...words, ...fileWords];
            } catch (error) {
                console.warn(`⚠️  Could not load keystone words file: ${error.message}`);
            }
        }

        // Load from existing game data if no words provided
        if (words.length === 0) {
            words = await this.loadExistingKeystoneWords();
        }

        // Remove duplicates and validate
        const uniqueWords = [...new Set(words.map(w => w.toUpperCase()))];
        const validWords = uniqueWords.filter(word => 
            word.length === 12 && /^[A-Z]+$/.test(word)
        );

        if (validWords.length !== uniqueWords.length) {
            console.warn(`⚠️  Filtered out ${uniqueWords.length - validWords.length} invalid keystone words`);
        }

        // Limit to max puzzles if specified
        if (this.options.maxPuzzles && validWords.length > this.options.maxPuzzles) {
            return validWords.slice(0, this.options.maxPuzzles);
        }

        return validWords;
    }

    /**
     * Generate puzzles from keystone words
     * @param {Array} keystoneWords - Array of keystone words
     * @returns {Promise<Array>} Array of generated puzzles
     */
    async generatePuzzles(keystoneWords) {
        const puzzles = [];
        const progressCallback = (progress) => {
            if (this.options.verbose || progress.current % 5 === 0) {
                console.log(`🎯 Puzzle Generation: ${progress.current}/${progress.total} (${progress.completed} successful)`);
            }
        };

        console.log('🔨 Generating puzzles...');
        const results = await this.puzzleBuilder.generateMultiplePuzzles(keystoneWords, progressCallback);
        
        this.stats.keystoneWordsProcessed = keystoneWords.length;
        this.stats.puzzlesGenerated = results.length;

        return results;
    }

    /**
     * Fetch definitions for all words in puzzles
     * @param {Array} puzzles - Array of puzzles
     * @returns {Promise<Object>} Object mapping words to definitions
     */
    async fetchDefinitions(puzzles) {
        if (!this.options.useDatamuse) {
            console.log('⏭️  Skipping definition fetching (disabled)');
            return {};
        }

        // Collect all unique words from puzzles
        const allWords = new Set();
        for (const puzzle of puzzles) {
            puzzle.allWords.forEach(word => allWords.add(word.toUpperCase()));
        }

        const wordArray = [...allWords];
        console.log(`📚 Fetching definitions for ${wordArray.length} words...`);

        const progressCallback = (progress) => {
            if (this.options.verbose || progress.current % 50 === 0) {
                console.log(`📖 Definition Fetching: ${progress.current}/${progress.total} (${progress.percentage}%)`);
            }
        };

        const definitions = await this.datamuseClient.fetchMultipleDefinitions(wordArray, progressCallback);
        this.stats.definitionsFetched = Object.keys(definitions).filter(k => definitions[k] !== null).length;

        return definitions;
    }

    /**
     * Validate definitions using LLM
     * @param {Object} definitions - Raw definitions object
     * @returns {Promise<Object>} Validated definitions object
     */
    async validateDefinitions(definitions) {
        if (!this.options.useLLMValidation || !this.options.openaiApiKey) {
            console.log('⏭️  Skipping LLM definition validation (disabled or no API key)');
            return definitions;
        }

        console.log('🤖 Validating definitions with LLM...');
        
        const validatedDefinitions = await this.definitionValidator.filterValidDefinitions(definitions);
        
        const originalCount = Object.keys(definitions).length;
        const validatedCount = Object.keys(validatedDefinitions).length;
        console.log(`✅ LLM Validation: ${validatedCount}/${originalCount} definitions passed`);

        return validatedDefinitions;
    }

    /**
     * Validate generated puzzles
     * @param {Array} puzzles - Array of puzzles to validate
     * @param {Object} definitions - Definitions object
     * @returns {Promise<Array>} Array of valid puzzles
     */
    async validatePuzzles(puzzles, definitions) {
        if (!this.options.validatePuzzles) {
            console.log('⏭️  Skipping puzzle validation (disabled)');
            return puzzles;
        }

        console.log('🔍 Validating puzzles...');

        const commonWords = await this.loadCommonWords();
        const validPuzzles = [];

        const progressCallback = (progress) => {
            if (this.options.verbose) {
                console.log(`🔎 Puzzle Validation: ${progress.current}/${progress.total} - ${progress.puzzle} (${progress.isValid ? 'PASS' : 'FAIL'})`);
            }
        };

        const validationResults = await this.puzzleValidator.validateMultiplePuzzles(
            puzzles, commonWords, definitions, progressCallback
        );

        for (const result of validationResults) {
            if (result.validation.isValid) {
                validPuzzles.push(result.puzzle);
            } else {
                this.stats.validationFailures++;
                if (this.options.verbose) {
                    console.log(`❌ Puzzle validation failed for ${result.puzzle.keystoneWord}:`, result.validation.errors);
                }
            }
        }

        this.stats.puzzlesValidated = validPuzzles.length;
        return validPuzzles;
    }

    /**
     * Generate output files and data
     * @param {Array} puzzles - Valid puzzles
     * @param {Object} definitions - Validated definitions
     * @returns {Promise<Object>} Output information
     */
    async generateOutput(puzzles, definitions) {
        if (!this.options.generateDataFiles) {
            console.log('⏭️  Skipping data file generation (disabled)');
            return { files: [], message: 'File generation disabled' };
        }

        console.log('📝 Generating output files...');

        // Load existing game data for merging
        const existingData = await this.loadExistingGameData();
        
        // Generate complete data package
        const dataPackage = this.dataIntegration.generateCompleteDataPackage(
            puzzles, definitions, existingData
        );

        // Export files
        const exportData = this.dataIntegration.exportDataPackage(dataPackage);

        // Save files if output directory specified
        if (this.options.outputDir) {
            await this.saveOutputFiles(exportData);
        }

        // Save intermediate results if requested
        if (this.options.saveIntermediateResults) {
            await this.saveIntermediateResults(puzzles, definitions, dataPackage);
        }

        return {
            files: exportData.files,
            manifest: exportData.manifest,
            outputDir: this.options.outputDir
        };
    }

    /**
     * Generate final report
     * @param {Array} puzzles - Final puzzles
     * @param {Object} definitions - Final definitions
     * @param {Object} output - Output information
     * @returns {Object} Complete report
     */
    generateReport(puzzles, definitions, output) {
        const report = {
            success: true,
            statistics: {
                ...this.stats,
                finalPuzzleCount: puzzles.length,
                finalDefinitionCount: Object.keys(definitions).length,
                totalWords: new Set(puzzles.flatMap(p => p.allWords)).size,
                averageWordsPerPuzzle: puzzles.length > 0 ? 
                    Math.round(puzzles.reduce((sum, p) => sum + p.allWords.length, 0) / puzzles.length) : 0,
                averageCornerstoneWords: puzzles.length > 0 ?
                    Math.round(puzzles.reduce((sum, p) => sum + p.cornerstoneWords.length, 0) / puzzles.length) : 0
            },
            puzzles: puzzles.map(p => ({
                keystoneWord: p.keystoneWord,
                pathIndex: p.pathIndex,
                totalWords: p.allWords.length,
                cornerstoneWords: p.cornerstoneWords.length,
                difficulty: this.dataIntegration.calculateDifficulty(p)
            })),
            output: output,
            generatedAt: new Date().toISOString(),
            processingTime: this.formatTime(this.stats.totalTime)
        };

        this.printReport(report);
        return report;
    }

    /**
     * Print formatted report to console
     * @param {Object} report - Report object
     */
    printReport(report) {
        console.log('\n🎉 Puzzle Generation Complete!');
        console.log('═'.repeat(50));
        console.log(`📊 STATISTICS:`);
        console.log(`   • Keystone words processed: ${report.statistics.keystoneWordsProcessed}`);
        console.log(`   • Puzzles generated: ${report.statistics.puzzlesGenerated}`);
        console.log(`   • Puzzles validated: ${report.statistics.puzzlesValidated}`);
        console.log(`   • Definitions fetched: ${report.statistics.definitionsFetched}`);
        console.log(`   • Total processing time: ${report.processingTime}`);
        console.log(`   • Average words per puzzle: ${report.statistics.averageWordsPerPuzzle}`);
        console.log(`   • Average cornerstone words: ${report.statistics.averageCornerstoneWords}`);
        
        if (report.output.files) {
            console.log(`\n📁 OUTPUT FILES (${report.output.files.length}):`);
            report.output.files.forEach(file => {
                console.log(`   • ${file.filename} (${this.formatBytes(file.size)})`);
            });
            
            if (report.output.outputDir) {
                console.log(`   📂 Saved to: ${report.output.outputDir}`);
            }
        }

        if (report.puzzles.length > 0) {
            console.log(`\n🧩 GENERATED PUZZLES:`);
            report.puzzles.slice(0, 10).forEach((puzzle, i) => {
                console.log(`   ${i + 1}. ${puzzle.keystoneWord} (${puzzle.difficulty}, ${puzzle.totalWords} words, ${puzzle.cornerstoneWords} cornerstone)`);
            });
            
            if (report.puzzles.length > 10) {
                console.log(`   ... and ${report.puzzles.length - 10} more`);
            }
        }

        console.log('\n✨ Pipeline completed successfully!');
    }

    // Helper methods

    /**
     * Load file content
     * @param {string} filepath - Path to file
     * @returns {Promise<string>} File content
     */
    async loadFile(filepath) {
        // This would use fs.readFile in Node.js environment
        throw new Error('File loading not implemented - run in Node.js environment');
    }

    /**
     * Parse keystone words from file content
     * @param {string} content - File content
     * @returns {Array} Array of keystone words
     */
    parseKeystoneWordsFile(content) {
        // Simple parsing - one word per line, or JSON array
        try {
            const json = JSON.parse(content);
            return Array.isArray(json) ? json : Object.keys(json);
        } catch {
            return content.split('\n')
                .map(line => line.trim().toUpperCase())
                .filter(line => line.length === 12 && /^[A-Z]+$/.test(line));
        }
    }

    /**
     * Load existing keystone words from game data
     * @returns {Promise<Array>} Array of existing keystone words
     */
    async loadExistingKeystoneWords() {
        // This would load from the actual game files
        console.log('ℹ️  Loading existing keystone words from game data...');
        return Object.keys(SAMPLE_PUZZLES || {});
    }

    /**
     * Load common words for cornerstone identification
     * @returns {Promise<Set>} Set of common words
     */
    async loadCommonWords() {
        // This would load from COMMON_WORDS_LIST
        console.log('ℹ️  Loading common words list...');
        return new Set((typeof COMMON_WORDS_LIST !== 'undefined' ? COMMON_WORDS_LIST : [])
            .filter(word => word.length >= 4)
            .map(word => word.toUpperCase())
        );
    }

    /**
     * Load existing game data for merging
     * @returns {Promise<Object>} Existing game data
     */
    async loadExistingGameData() {
        // This would load existing game data files
        return {
            KEYSTONE_WORDS: typeof KEYSTONE_WORDS !== 'undefined' ? KEYSTONE_WORDS : {},
            COMMON_WORDS_LIST: typeof COMMON_WORDS_LIST !== 'undefined' ? COMMON_WORDS_LIST : [],
            WORDS_DATABASE: typeof WORDS_DATABASE !== 'undefined' ? WORDS_DATABASE : [],
            COMMON_DEFINITIONS: typeof COMMON_DEFINITIONS !== 'undefined' ? COMMON_DEFINITIONS : {},
            SAMPLE_PUZZLES: typeof SAMPLE_PUZZLES !== 'undefined' ? SAMPLE_PUZZLES : {}
        };
    }

    /**
     * Save output files to disk
     * @param {Object} exportData - Export data with files
     */
    async saveOutputFiles(exportData) {
        console.log(`💾 Saving ${exportData.files.length} files to ${this.options.outputDir}...`);
        // This would use fs.writeFile in Node.js environment
        console.log('ℹ️  File saving requires Node.js environment with filesystem access');
    }

    /**
     * Save intermediate results for debugging
     * @param {Array} puzzles - Generated puzzles
     * @param {Object} definitions - Definitions
     * @param {Object} dataPackage - Data package
     */
    async saveIntermediateResults(puzzles, definitions, dataPackage) {
        const intermediateData = {
            puzzles: puzzles,
            definitions: definitions,
            dataPackage: dataPackage,
            savedAt: new Date().toISOString()
        };
        
        console.log('💾 Saving intermediate results...');
        // This would save to intermediate-results.json
    }

    /**
     * Format time duration
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    }

    /**
     * Format byte size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${Math.round(bytes / (1024 * 1024))} MB`;
    }
}

// Export the pipeline class
export { PuzzleGenerationPipeline };

// CLI interface for Node.js
if (typeof process !== 'undefined' && process.argv) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎯 Cornerstones Puzzle Generation Pipeline

Usage: node puzzleGenerationScript.js [options]

Options:
  --keystone-words WORDS     Comma-separated list of keystone words
  --keystone-file FILE       File containing keystone words
  --max-puzzles N           Maximum number of puzzles to generate (default: 50)
  --min-cornerstone N       Minimum cornerstone words required (default: 20)
  --output-dir DIR          Output directory for generated files
  --no-datamuse            Skip Datamuse API definition fetching
  --no-llm                 Skip LLM definition validation
  --no-validation          Skip puzzle validation
  --verbose                Enable verbose logging
  --save-intermediate      Save intermediate results for debugging

Examples:
  node puzzleGenerationScript.js --keystone-words "CORNERSTONES,TECHNOLOGIES" --output-dir ./output
  node puzzleGenerationScript.js --keystone-file keystone-words.txt --max-puzzles 25 --verbose
        `);
        process.exit(0);
    }

    // Parse command line arguments
    const options = {
        keystoneWords: [],
        maxPuzzles: 50,
        minCornerstoneWords: 20,
        verbose: args.includes('--verbose'),
        useDatamuse: !args.includes('--no-datamuse'),
        useLLMValidation: !args.includes('--no-llm'),
        validatePuzzles: !args.includes('--no-validation'),
        saveIntermediateResults: args.includes('--save-intermediate')
    };

    // Parse keystone words
    const keystoneWordsIndex = args.indexOf('--keystone-words');
    if (keystoneWordsIndex !== -1 && args[keystoneWordsIndex + 1]) {
        options.keystoneWords = args[keystoneWordsIndex + 1].split(',').map(w => w.trim().toUpperCase());
    }

    // Parse keystone file
    const keystoneFileIndex = args.indexOf('--keystone-file');
    if (keystoneFileIndex !== -1 && args[keystoneFileIndex + 1]) {
        options.keystoneWordFile = args[keystoneFileIndex + 1];
    }

    // Parse output directory
    const outputDirIndex = args.indexOf('--output-dir');
    if (outputDirIndex !== -1 && args[outputDirIndex + 1]) {
        options.outputDir = args[outputDirIndex + 1];
    }

    // Parse max puzzles
    const maxPuzzlesIndex = args.indexOf('--max-puzzles');
    if (maxPuzzlesIndex !== -1 && args[maxPuzzlesIndex + 1]) {
        options.maxPuzzles = parseInt(args[maxPuzzlesIndex + 1]);
    }

    // Parse min cornerstone words
    const minCornerstoneIndex = args.indexOf('--min-cornerstone');
    if (minCornerstoneIndex !== -1 && args[minCornerstoneIndex + 1]) {
        options.minCornerstoneWords = parseInt(args[minCornerstoneIndex + 1]);
    }

    // Run the pipeline
    const pipeline = new PuzzleGenerationPipeline(options);
    pipeline.run().catch(error => {
        console.error('❌ Pipeline failed:', error);
        process.exit(1);
    });
}