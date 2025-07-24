// Definition Manager - Centralized definition management with quality controls
import fs from 'fs/promises';
import { DefinitionValidator } from './definitionValidator.js';
import { DEFINITION_QUALITY_CONFIG, DefinitionQualityChecker } from './definitionQualityConfig.js';

export class DefinitionManager {
    constructor(options = {}) {
        this.options = {
            definitionsFilePath: 'src/data/word-definitions.js',
            backupDirectory: 'backups/definitions',
            enableLLMValidation: true,
            autoCreateBackups: true,
            qualityThreshold: DEFINITION_QUALITY_CONFIG.scoring.minimumAcceptableScore,
            ...options
        };

        // Initialize LLM validator if enabled
        this.llmValidator = this.options.enableLLMValidation ? 
            new DefinitionValidator() : null;

        // Statistics tracking
        this.stats = {
            definitionsProcessed: 0,
            definitionsAccepted: 0,
            definitionsRejected: 0,
            rejectionReasons: {},
            averageQualityScore: 0,
            lastUpdated: null
        };

        // In-memory cache of current definitions
        this.definitionsCache = new Map();
        this.cacheLoaded = false;

        // Audit log for all changes
        this.auditLog = [];
    }

    /**
     * Load existing definitions from file into memory
     * @returns {Promise<Map>} Map of word -> definition data
     */
    async loadDefinitions() {
        try {
            const content = await fs.readFile(this.options.definitionsFilePath, 'utf8');
            
            // Extract the COMMON_DEFINITIONS object
            const objectMatch = content.match(/const COMMON_DEFINITIONS = \{([\s\S]*?)\};/);
            if (!objectMatch) {
                throw new Error('Could not find COMMON_DEFINITIONS object in file');
            }

            // Parse the definitions (this is a simplified parser - in production might use a proper JS parser)
            const definitionsText = objectMatch[1];
            const lines = definitionsText.split('\n');
            const definitions = new Map();

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && trimmed.includes(':')) {
                    const match = trimmed.match(/^"([^"]+)":\s*"([^"]*)"[,]?$/);
                    if (match) {
                        const [, word, definition] = match;
                        definitions.set(word.toUpperCase(), {
                            word: word.toUpperCase(),
                            definition: definition,
                            source: 'file',
                            loadedAt: new Date().toISOString(),
                            validated: false
                        });
                    }
                }
            }

            this.definitionsCache = definitions;
            this.cacheLoaded = true;
            
            console.log(`📚 Loaded ${definitions.size} definitions from file`);
            return definitions;

        } catch (error) {
            console.error('❌ Error loading definitions:', error.message);
            this.definitionsCache = new Map();
            this.cacheLoaded = true;
            return this.definitionsCache;
        }
    }

    /**
     * Validate a single definition using comprehensive quality checks
     * @param {string} word - The word being defined
     * @param {string} definition - The definition text
     * @param {string} partOfSpeech - Part of speech (optional)
     * @returns {Promise<Object>} Validation result
     */
    async validateDefinition(word, definition, partOfSpeech = null) {
        const validationResult = {
            word: word.toUpperCase(),
            definition: definition,
            valid: false,
            score: 0,
            issues: [],
            recommendations: [],
            validatedAt: new Date().toISOString()
        };

        try {
            // Step 1: Automatic rejection checks
            const autoCheck = DefinitionQualityChecker.checkAutoReject(word, definition);
            if (autoCheck.shouldReject) {
                validationResult.issues = autoCheck.issues;
                validationResult.score = 0;
                validationResult.recommendations.push('Requires complete rewrite or removal');
                this.recordRejection(word, autoCheck.issues);
                return validationResult;
            }

            // Step 2: Calculate base quality score
            const qualityScore = DefinitionQualityChecker.calculateQualityScore(definition, partOfSpeech);
            validationResult.score = qualityScore;

            // Step 3: LLM validation (if enabled and passes basic checks)
            if (this.llmValidator && qualityScore >= 30) {
                try {
                    const llmResult = await this.llmValidator.validateDefinition(word, definition);
                    
                    // Combine scores (weighted average)
                    const combinedScore = Math.round((qualityScore * 0.4) + (llmResult.score * 0.6));
                    validationResult.score = combinedScore;
                    validationResult.llmValidation = llmResult;
                    
                    if (llmResult.issues) {
                        validationResult.issues.push(...llmResult.issues);
                    }
                } catch (llmError) {
                    console.warn(`⚠️ LLM validation failed for ${word}: ${llmError.message}`);
                    // Fall back to rule-based score only
                }
            }

            // Step 4: Final validation decision
            validationResult.valid = validationResult.score >= this.options.qualityThreshold;

            // Step 5: Generate improvement recommendations
            if (!validationResult.valid) {
                const suggestions = DefinitionQualityChecker.getImprovementSuggestions(word, definition);
                validationResult.recommendations = suggestions.map(s => s.description);
                this.recordRejection(word, validationResult.issues);
            }

            return validationResult;

        } catch (error) {
            console.error(`❌ Error validating definition for ${word}:`, error);
            validationResult.issues.push('validation_error');
            validationResult.recommendations.push('Manual review required due to validation error');
            return validationResult;
        }
    }

    /**
     * Add a new definition with quality validation
     * @param {string} word - The word to define
     * @param {string} definition - The definition text
     * @param {Object} metadata - Additional metadata (source, partOfSpeech, etc.)
     * @returns {Promise<Object>} Result of the addition
     */
    async addDefinition(word, definition, metadata = {}) {
        if (!this.cacheLoaded) {
            await this.loadDefinitions();
        }

        const upperWord = word.toUpperCase();
        
        // Check if definition already exists
        if (this.definitionsCache.has(upperWord)) {
            return {
                success: false,
                reason: 'Definition already exists',
                existing: this.definitionsCache.get(upperWord)
            };
        }

        // Validate the definition
        const validation = await this.validateDefinition(word, definition, metadata.partOfSpeech);
        
        this.stats.definitionsProcessed++;
        
        if (!validation.valid) {
            this.stats.definitionsRejected++;
            return {
                success: false,
                reason: 'Definition failed quality validation',
                validation: validation
            };
        }

        // Add to cache
        const definitionData = {
            word: upperWord,
            definition: definition,
            source: metadata.source || 'api',
            partOfSpeech: metadata.partOfSpeech || 'unknown',
            addedAt: new Date().toISOString(),
            validation: validation,
            ...metadata
        };

        this.definitionsCache.set(upperWord, definitionData);
        this.stats.definitionsAccepted++;
        
        // Update average quality score
        this.updateAverageQualityScore();

        // Add to audit log
        this.auditLog.push({
            action: 'add',
            word: upperWord,
            timestamp: new Date().toISOString(),
            qualityScore: validation.score,
            source: metadata.source
        });

        console.log(`✅ Added high-quality definition for ${upperWord} (score: ${validation.score})`);

        return {
            success: true,
            word: upperWord,
            validation: validation,
            data: definitionData
        };
    }

    /**
     * Update an existing definition with quality validation
     * @param {string} word - The word to update
     * @param {string} newDefinition - The new definition text
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Result of the update
     */
    async updateDefinition(word, newDefinition, metadata = {}) {
        if (!this.cacheLoaded) {
            await this.loadDefinitions();
        }

        const upperWord = word.toUpperCase();
        
        if (!this.definitionsCache.has(upperWord)) {
            return {
                success: false,
                reason: 'Definition does not exist'
            };
        }

        const existingData = this.definitionsCache.get(upperWord);
        
        // Validate the new definition
        const validation = await this.validateDefinition(word, newDefinition, metadata.partOfSpeech);
        
        this.stats.definitionsProcessed++;
        
        if (!validation.valid) {
            this.stats.definitionsRejected++;
            return {
                success: false,
                reason: 'Updated definition failed quality validation',
                validation: validation,
                existing: existingData
            };
        }

        // Update in cache
        const updatedData = {
            ...existingData,
            definition: newDefinition,
            updatedAt: new Date().toISOString(),
            validation: validation,
            previousDefinition: existingData.definition,
            ...metadata
        };

        this.definitionsCache.set(upperWord, updatedData);
        this.stats.definitionsAccepted++;
        
        this.updateAverageQualityScore();

        // Add to audit log
        this.auditLog.push({
            action: 'update',
            word: upperWord,
            timestamp: new Date().toISOString(),
            qualityScore: validation.score,
            previousScore: existingData.validation?.score || 0
        });

        console.log(`🔄 Updated definition for ${upperWord} (score: ${validation.score})`);

        return {
            success: true,
            word: upperWord,
            validation: validation,
            data: updatedData,
            previous: existingData
        };
    }

    /**
     * Remove a definition
     * @param {string} word - The word to remove
     * @returns {Promise<Object>} Result of the removal
     */
    async removeDefinition(word) {
        if (!this.cacheLoaded) {
            await this.loadDefinitions();
        }

        const upperWord = word.toUpperCase();
        
        if (!this.definitionsCache.has(upperWord)) {
            return {
                success: false,
                reason: 'Definition does not exist'
            };
        }

        const existingData = this.definitionsCache.get(upperWord);
        this.definitionsCache.delete(upperWord);

        // Add to audit log
        this.auditLog.push({
            action: 'remove',
            word: upperWord,
            timestamp: new Date().toISOString(),
            reason: 'Manual removal',
            removedData: existingData
        });

        console.log(`🗑️ Removed definition for ${upperWord}`);

        return {
            success: true,
            word: upperWord,
            removedData: existingData
        };
    }

    /**
     * Batch add multiple definitions with quality validation
     * @param {Array} definitions - Array of {word, definition, metadata} objects
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<Object>} Batch processing results
     */
    async batchAddDefinitions(definitions, progressCallback = null) {
        console.log(`🔄 Processing ${definitions.length} definitions in batch...`);
        
        const results = {
            total: definitions.length,
            added: 0,
            rejected: 0,
            errors: 0,
            addedWords: [],
            rejectedWords: [],
            errorWords: []
        };

        for (let i = 0; i < definitions.length; i++) {
            const { word, definition, metadata = {} } = definitions[i];
            
            try {
                const result = await this.addDefinition(word, definition, metadata);
                
                if (result.success) {
                    results.added++;
                    results.addedWords.push(word);
                } else {
                    results.rejected++;
                    results.rejectedWords.push({
                        word: word,
                        reason: result.reason,
                        issues: result.validation?.issues || []
                    });
                }
                
            } catch (error) {
                results.errors++;
                results.errorWords.push({ word: word, error: error.message });
                console.error(`❌ Error processing definition for ${word}:`, error);
            }

            // Progress callback
            if (progressCallback && (i + 1) % 10 === 0) {
                progressCallback({
                    current: i + 1,
                    total: definitions.length,
                    added: results.added,
                    rejected: results.rejected,
                    errors: results.errors,
                    percentage: Math.round(((i + 1) / definitions.length) * 100)
                });
            }
        }

        console.log(`✅ Batch complete: ${results.added} added, ${results.rejected} rejected, ${results.errors} errors`);
        
        return results;
    }

    /**
     * Save all definitions to file with browser compatibility
     * @returns {Promise<boolean>} Success status
     */
    async saveDefinitionsToFile() {
        if (!this.cacheLoaded) {
            console.warn('⚠️ No definitions loaded in cache, skipping save');
            return false;
        }

        try {
            // Create backup if enabled
            if (this.options.autoCreateBackups) {
                await this.createBackup();
            }

            // Sort definitions alphabetically for consistent output
            const sortedEntries = Array.from(this.definitionsCache.entries())
                .sort(([a], [b]) => a.localeCompare(b));

            // Generate file content with browser compatibility
            const definitionEntries = sortedEntries.map(([word, data]) => {
                // Escape quotes in definition
                const escapedDefinition = data.definition.replace(/"/g, '\\"');
                return `    "${word}": "${escapedDefinition}"`;
            }).join(',\n');

            const fileContent = `// Common word definitions for the Cornerstones game (curated)
// Generated: ${new Date().toISOString()}
// Definitions: ${sortedEntries.length}
// Quality managed by DefinitionManager

const COMMON_DEFINITIONS = {
${definitionEntries}
};

// Set up global access for browser compatibility
if (typeof window !== 'undefined') {
    window.COMMON_DEFINITIONS = COMMON_DEFINITIONS;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js compatibility
    module.exports = { COMMON_DEFINITIONS };
}`;

            await fs.writeFile(this.options.definitionsFilePath, fileContent, 'utf8');
            
            this.stats.lastUpdated = new Date().toISOString();
            
            console.log(`💾 Saved ${sortedEntries.length} definitions to file`);
            console.log(`📊 Quality stats: avg score ${this.getAverageQualityScore()}, ${this.stats.definitionsRejected} rejected`);
            
            return true;

        } catch (error) {
            console.error('❌ Error saving definitions to file:', error);
            return false;
        }
    }

    /**
     * Create a backup of the current definitions file
     * @returns {Promise<string>} Backup file path
     */
    async createBackup() {
        try {
            // Ensure backup directory exists
            await fs.mkdir(this.options.backupDirectory, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${this.options.backupDirectory}/word-definitions-${timestamp}.js`;
            
            // Copy current file to backup
            const currentContent = await fs.readFile(this.options.definitionsFilePath, 'utf8');
            await fs.writeFile(backupPath, currentContent, 'utf8');
            
            console.log(`📋 Created backup: ${backupPath}`);
            return backupPath;
            
        } catch (error) {
            console.warn('⚠️ Could not create backup:', error.message);
            return null;
        }
    }

    /**
     * Validate all existing definitions and report quality issues
     * @returns {Promise<Object>} Validation report
     */
    async validateAllDefinitions() {
        if (!this.cacheLoaded) {
            await this.loadDefinitions();
        }

        console.log(`🔍 Validating ${this.definitionsCache.size} existing definitions...`);
        
        const validationResults = [];
        const lowQualityDefinitions = [];
        let processed = 0;

        for (const [word, data] of this.definitionsCache.entries()) {
            try {
                const validation = await this.validateDefinition(word, data.definition);
                validationResults.push(validation);
                
                if (!validation.valid) {
                    lowQualityDefinitions.push({
                        word: word,
                        definition: data.definition,
                        score: validation.score,
                        issues: validation.issues,
                        recommendations: validation.recommendations
                    });
                }
                
                processed++;
                
                if (processed % 100 === 0) {
                    console.log(`   Progress: ${processed}/${this.definitionsCache.size} validated`);
                }
                
            } catch (error) {
                console.error(`❌ Error validating ${word}:`, error);
            }
        }

        const report = {
            totalDefinitions: this.definitionsCache.size,
            validDefinitions: validationResults.filter(v => v.valid).length,
            invalidDefinitions: lowQualityDefinitions.length,
            averageScore: Math.round(validationResults.reduce((sum, v) => sum + v.score, 0) / validationResults.length),
            lowQualityDefinitions: lowQualityDefinitions.slice(0, 50), // Limit to first 50 for readability
            validationCompletedAt: new Date().toISOString()
        };

        console.log(`📊 Validation Report:`);
        console.log(`   Total: ${report.totalDefinitions}`);
        console.log(`   Valid: ${report.validDefinitions} (${Math.round((report.validDefinitions/report.totalDefinitions)*100)}%)`);
        console.log(`   Invalid: ${report.invalidDefinitions} (${Math.round((report.invalidDefinitions/report.totalDefinitions)*100)}%)`);
        console.log(`   Average Score: ${report.averageScore}/100`);

        return report;
    }

    /**
     * Get quality statistics
     * @returns {Object} Quality statistics
     */
    getQualityStats() {
        return {
            ...this.stats,
            cacheSize: this.definitionsCache.size,
            rejectionRate: this.stats.definitionsProcessed > 0 ? 
                Math.round((this.stats.definitionsRejected / this.stats.definitionsProcessed) * 100) : 0,
            averageQualityScore: this.getAverageQualityScore()
        };
    }

    /**
     * Record a rejection reason for statistics
     * @private
     */
    recordRejection(word, issues) {
        for (const issue of issues) {
            this.stats.rejectionReasons[issue] = (this.stats.rejectionReasons[issue] || 0) + 1;
        }
    }

    /**
     * Update average quality score
     * @private
     */
    updateAverageQualityScore() {
        if (this.definitionsCache.size === 0) return;
        
        let totalScore = 0;
        let count = 0;
        
        for (const [, data] of this.definitionsCache.entries()) {
            if (data.validation && data.validation.score) {
                totalScore += data.validation.score;
                count++;
            }
        }
        
        this.stats.averageQualityScore = count > 0 ? Math.round(totalScore / count) : 0;
    }

    /**
     * Get current average quality score
     * @returns {number} Average quality score
     */
    getAverageQualityScore() {
        return this.stats.averageQualityScore;
    }

    /**
     * Export audit log for review
     * @returns {Array} Audit log entries
     */
    exportAuditLog() {
        return [...this.auditLog];
    }

    /**
     * Clear all data and reset
     */
    reset() {
        this.definitionsCache.clear();
        this.cacheLoaded = false;
        this.auditLog = [];
        this.stats = {
            definitionsProcessed: 0,
            definitionsAccepted: 0,
            definitionsRejected: 0,
            rejectionReasons: {},
            averageQualityScore: 0,
            lastUpdated: null
        };
    }
}

export default DefinitionManager;