// 3-Tier Definition System
// Tier 1: Free Dictionary API
// Tier 2: LLM Fallback (via Groq/HuggingFace)
// Tier 3: Minimal fallback

console.log('Loading definition system...');

class DefinitionManager {
    constructor() {
        this.cache = new Map(); // Word -> definition cache
        this.batchQueue = new Set(); // Words waiting for definitions
        this.processing = false;
    }

    // Main method to get definition for a word
    async getDefinition(word) {
        const upperWord = word.toUpperCase();
        
        // Check cache first
        if (this.cache.has(upperWord)) {
            return this.cache.get(upperWord);
        }

        // Try the 3-tier system
        let definition = await this.tryTier1(upperWord);
        if (!definition) {
            definition = await this.tryTier2(upperWord);
        }
        if (!definition) {
            definition = this.tryTier3(upperWord);
        }

        // Cache the result
        this.cache.set(upperWord, definition);
        return definition;
    }

    // Tier 1: Free Dictionary API
    async tryTier1(word) {
        try {
            console.log(`Tier 1: Fetching definition for ${word}`);
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
            
            if (!response.ok) {
                console.log(`Tier 1 failed for ${word}: ${response.status}`);
                return null;
            }

            const data = await response.json();
            
            // Extract up to 5 definitions and check quality
            for (const entry of data.slice(0, 1)) { // Usually just one entry
                for (const meaning of entry.meanings.slice(0, 3)) { // Try multiple parts of speech
                    for (const definition of meaning.definitions.slice(0, 5)) { // Try up to 5 definitions
                        const def = definition.definition;
                        if (this.isQualityDefinition(def, word)) {
                            console.log(`✅ Tier 1 success for ${word}: ${def}`);
                            return def;
                        }
                    }
                }
            }

            console.log(`Tier 1: No quality definition found for ${word}`);
            return null;
        } catch (error) {
            console.log(`Tier 1 error for ${word}:`, error.message);
            return null;
        }
    }

    // Tier 2: LLM Fallback using HuggingFace Inference API
    async tryTier2(word) {
        try {
            console.log(`Tier 2: Generating definition for ${word}`);
            
            // Use HuggingFace's free inference API
            const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: `Define the word "${word}" in 8-12 words without using "${word}" or its root forms. Definition:`,
                    parameters: {
                        max_length: 50,
                        temperature: 0.3
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0].generated_text) {
                    const fullText = data[0].generated_text;
                    // Extract just the definition part after "Definition:"
                    const definitionMatch = fullText.match(/Definition:\s*(.+)/);
                    if (definitionMatch) {
                        const definition = definitionMatch[1].trim();
                        if (this.isQualityDefinition(definition, word)) {
                            console.log(`✅ Tier 2 success for ${word}: ${definition}`);
                            return definition;
                        }
                    }
                }
            }
            
            console.log(`Tier 2 failed for ${word}`);
            return null;
        } catch (error) {
            console.log(`Tier 2 error for ${word}:`, error.message);
            return null;
        }
    }

    // Tier 3: Minimal fallback
    tryTier3(word) {
        console.log(`Tier 3: Fallback definition for ${word}`);
        
        // Basic part-of-speech based definitions
        const fallbacks = {
            // Common word patterns
            'S$': 'Multiple items or plural form',
            'ING$': 'Action or ongoing activity', 
            'ED$': 'Past action or completed state',
            'ER$': 'Person who performs an action',
            'LY$': 'In a particular manner',
            'TION$': 'Process or result of action',
            'NESS$': 'State or quality of being'
        };

        for (const [pattern, definition] of Object.entries(fallbacks)) {
            if (new RegExp(pattern).test(word)) {
                return definition;
            }
        }

        // Generic fallback
        return `Word found in puzzle (definition unavailable)`;
    }

    // Check if definition is high quality (no circular references)
    isQualityDefinition(definition, word) {
        if (!definition || definition.length < 10) return false;
        
        const lowerDef = definition.toLowerCase();
        const lowerWord = word.toLowerCase();
        
        // Reject if definition contains the word itself
        if (lowerDef.includes(lowerWord)) return false;
        
        // Reject if definition contains obvious root forms
        const rootForms = this.generateRootForms(lowerWord);
        for (const root of rootForms) {
            if (lowerDef.includes(root)) return false;
        }
        
        // Reject overly short or generic definitions
        if (lowerDef.includes('plural of') || lowerDef.includes('past tense of')) return false;
        
        return true;
    }

    // Generate common root forms to avoid in definitions
    generateRootForms(word) {
        const roots = [word];
        
        // Remove common suffixes to find root
        const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly'];
        for (const suffix of suffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                roots.push(word.slice(0, -suffix.length));
            }
        }
        
        return roots;
    }

    // Batch process definitions for multiple words
    async batchGetDefinitions(words, onProgress) {
        const results = new Map();
        const total = words.length;
        let completed = 0;

        console.log(`Starting batch definition fetch for ${total} words...`);

        for (const word of words) {
            const definition = await this.getDefinition(word);
            results.set(word, definition);
            completed++;
            
            if (onProgress) {
                onProgress(completed, total, word);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ Completed batch definition fetch: ${completed}/${total} words`);
        return results;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('Definition cache cleared');
    }

    // Get cache stats
    getCacheStats() {
        return {
            size: this.cache.size,
            words: Array.from(this.cache.keys())
        };
    }
}

// Global instance
window.definitionManager = new DefinitionManager();