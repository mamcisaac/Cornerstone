// Definition Quality Configuration - Centralized quality standards and rules
export const DEFINITION_QUALITY_CONFIG = {
    // Minimum and maximum definition lengths
    length: {
        minimum: 15,
        maximum: 500,
        optimal: {
            min: 25,
            max: 200
        }
    },

    // Quality scoring thresholds
    scoring: {
        minimumAcceptableScore: 70,
        excellentScore: 85,
        preferredScore: 80
    },

    // Patterns that automatically disqualify definitions
    rejectionPatterns: {
        // Personal names and surnames
        personalNames: [
            /\b(A|An)\s+surname\b/i,
            /\bsurname\s+(from|originating|common)/i,
            /\b(male|female)\s+given\s+name\b/i,
            /\bgiven\s+name\s+(from|of|derived)/i,
            /\bdiminutive\s+of\s+the\s+(male|female)\s+given\s+name\b/i,
            /\bpatronymi[cn]\b/i
        ],

        // Single letters and alphabet references
        singleLetters: [
            /^[A-Z],?\s+the\s+\d+(st|nd|rd|th)\s+letter/i,
            /\bletter\s+of\s+the\s+(Greek|Latin|Hebrew|Arabic)\s+alphabet/i
        ],

        // Generic location descriptions without context
        genericLocations: [
            /^A\s+(city|town|village|municipality)\s+in\s+\w+\.?\s*$/i,
            /^A\s+(city|town)\s+and\s+commune\s+in\s+\w+\.?\s*$/i
        ],

        // Circular definitions (contains the word being defined)
        circular: [
            /someone\s+who\s+\w+s?\b/i,
            /something\s+that\s+\w+s?\b/i,
            /the\s+act\s+of\s+\w+ing\b/i
        ],

        // Overly technical without explanation
        overlyTechnical: [
            /^\([A-Z]+[,\s]+[A-Z]+\)/,  // Starts with technical abbreviations
            /^[A-Z]{3,}\s+abbreviation/i // Technical abbreviation definitions
        ],

        // Inappropriate content markers
        inappropriate: [
            /\b(vulgar|slang|colloquial|informal|offensive|derogatory)\b/i,
            /\b(slur|pejorative|disparaging|insulting)\b/i,
            /\bnsfw\b/i
        ],

        // Incomplete or fragmented definitions
        incomplete: [
            /\.{3,}$/,  // Ends with ellipsis
            /^\w+\s*[:\-]\s*$/,  // Just word followed by colon/dash
            /^["']?\w*["']?\s*,?\s*$/  // Just a single word in quotes
        ]
    },

    // Patterns that indicate high-quality definitions
    qualityIndicators: {
        descriptive: [
            /\b(characterized\s+by|consisting\s+of|relating\s+to)\b/i,
            /\b(used\s+(for|to|in)|serving\s+to)\b/i,
            /\b(process\s+of|method\s+of|practice\s+of)\b/i
        ],
        
        educational: [
            /\b(also\s+known\s+as|especially|particularly|typically)\b/i,
            /\b(for\s+example|such\s+as|including)\b/i
        ],

        contextual: [
            /\b(in\s+the\s+context\s+of|within\s+the\s+field\s+of)\b/i,
            /\b(historically|traditionally|commonly)\b/i
        ]
    },

    // Part-of-speech specific rules
    partOfSpeechRules: {
        noun: {
            shouldStartWith: ['A', 'An', 'The'],
            shouldNotStartWith: ['To', 'Being', 'Having'],
            preferredPatterns: [
                /^(A|An|The)\s+\w+/i,
                /^\w+\s+(that|which)\s+/i
            ]
        },
        
        verb: {
            shouldStartWith: ['To', 'The act of', 'The process of'],
            shouldNotStartWith: ['A', 'An'],
            preferredPatterns: [
                /^To\s+\w+/i,
                /^The\s+(act|process)\s+of\s+/i
            ]
        },
        
        adjective: {
            shouldStartWith: ['Having', 'Characterized by', 'Of or relating to'],
            preferredPatterns: [
                /^(Having|Characterized\s+by|Of\s+or\s+relating\s+to)/i,
                /^\w+\s+(in|of)\s+/i
            ]
        }
    },

    // Word categories that need special handling
    specialCategories: {
        // Scientific terms should have context
        scientific: {
            patterns: [/\b(genus|species|family|order|class|phylum)\b/i],
            requirements: ['contextual_information', 'simplified_explanation']
        },

        // Abbreviations should be expanded
        abbreviations: {
            patterns: [/^[A-Z]{2,}\s+(stands\s+for|abbreviation)/i],
            requirements: ['full_expansion', 'usage_context']
        },

        // Historical terms should have context
        historical: {
            patterns: [/\b(ancient|medieval|historical|traditionally)\b/i],
            requirements: ['time_period', 'cultural_context']
        }
    },

    // LLM validation settings
    llmValidation: {
        enabled: true,
        model: 'gpt-3.5-turbo',
        batchSize: 10,
        retryAttempts: 3,
        temperature: 0.1,
        maxTokens: 200,
        
        systemPrompt: `You are a dictionary quality evaluator. Rate word definitions on a scale of 0-100 based on:
        1. Clarity and understandability (25 points)
        2. Accuracy and completeness (25 points) 
        3. Appropriateness for general audience (25 points)
        4. Avoids circular definitions (25 points)
        
        REJECT definitions that:
        - Contain the word being defined
        - Are personal names or surnames
        - Are single letter definitions
        - Are too vague or incomplete
        - Contain inappropriate content
        
        Return JSON: {"score": 0-100, "issues": ["issue1"], "recommendation": "accept/reject", "reason": "explanation"}`
    },

    // Automatic improvement suggestions
    improvementRules: {
        // Common fixes that can be applied automatically
        automaticFixes: {
            removeParenthetical: /^\([^)]+\)\s*/,  // Remove leading parenthetical
            removeTrailingPeriods: /\.+$/,  // Remove multiple trailing periods
            capitalizeFirst: true,  // Ensure first letter is capitalized
            standardizeSpacing: true  // Fix spacing issues
        },

        // Patterns that suggest the definition needs manual review
        reviewRequired: [
            /\b(see\s+also|cf\.|compare)\b/i,  // Cross-references
            /\b(various|multiple|many)\s+meanings?\b/i,  // Multiple meanings
            /\b(etymology|from\s+(Latin|Greek|French))\b/i  // Etymology info
        ]
    },

    // Quality metrics tracking
    metrics: {
        trackRejectionReasons: true,
        trackSourceQuality: true,
        trackImprovementSuccess: true,
        generateQualityReports: true,
        alertThresholds: {
            rejectionRate: 0.3,  // Alert if >30% rejected
            averageScore: 75     // Alert if average score <75
        }
    }
};

// Export individual sections for easier imports
export const LENGTH_RULES = DEFINITION_QUALITY_CONFIG.length;
export const SCORING_RULES = DEFINITION_QUALITY_CONFIG.scoring;
export const REJECTION_PATTERNS = DEFINITION_QUALITY_CONFIG.rejectionPatterns;
export const QUALITY_INDICATORS = DEFINITION_QUALITY_CONFIG.qualityIndicators;
export const POS_RULES = DEFINITION_QUALITY_CONFIG.partOfSpeechRules;
export const LLM_CONFIG = DEFINITION_QUALITY_CONFIG.llmValidation;

// Helper functions for common quality checks
export class DefinitionQualityChecker {
    /**
     * Check if a definition should be automatically rejected
     * @param {string} word - The word being defined
     * @param {string} definition - The definition text
     * @returns {Object} Result with rejection status and reasons
     */
    static checkAutoReject(word, definition) {
        const issues = [];
        const normalizedDef = definition.toLowerCase();
        const normalizedWord = word.toLowerCase();

        // Check length
        if (definition.length < LENGTH_RULES.minimum) {
            issues.push('too_short');
        }
        if (definition.length > LENGTH_RULES.maximum) {
            issues.push('too_long');
        }

        // Check for circular definitions (contains the word)
        if (normalizedDef.includes(normalizedWord)) {
            issues.push('circular_definition');
        }

        // Check all rejection patterns
        for (const [category, patterns] of Object.entries(REJECTION_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(definition)) {
                    issues.push(`rejected_${category}`);
                    break;
                }
            }
        }

        return {
            shouldReject: issues.length > 0,
            issues: issues,
            score: issues.length > 0 ? 0 : 50  // Base score for non-rejected definitions
        };
    }

    /**
     * Calculate quality score based on positive indicators
     * @param {string} definition - The definition text
     * @param {string} partOfSpeech - Part of speech (optional)
     * @returns {number} Quality score (0-100)
     */
    static calculateQualityScore(definition, partOfSpeech = null) {
        let score = 50; // Base score
        
        // Add points for quality indicators
        for (const [category, patterns] of Object.entries(QUALITY_INDICATORS)) {
            for (const pattern of patterns) {
                if (pattern.test(definition)) {
                    score += 10;
                    break; // Only add once per category
                }
            }
        }

        // Check part-of-speech specific rules
        if (partOfSpeech && POS_RULES[partOfSpeech]) {
            const rules = POS_RULES[partOfSpeech];
            for (const pattern of rules.preferredPatterns) {
                if (pattern.test(definition)) {
                    score += 15;
                    break;
                }
            }
        }

        // Length bonus for optimal length
        if (definition.length >= LENGTH_RULES.optimal.min && 
            definition.length <= LENGTH_RULES.optimal.max) {
            score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Get improvement suggestions for a definition
     * @param {string} word - The word being defined
     * @param {string} definition - The definition text
     * @returns {Array} Array of improvement suggestions
     */
    static getImprovementSuggestions(word, definition) {
        const suggestions = [];
        
        // Check for automatic fixes
        const fixes = DEFINITION_QUALITY_CONFIG.improvementRules.automaticFixes;
        
        if (fixes.removeParenthetical.test(definition)) {
            suggestions.push({
                type: 'remove_parenthetical',
                description: 'Remove leading parenthetical information',
                automatic: true
            });
        }

        if (!definition.match(/^[A-Z]/)) {
            suggestions.push({
                type: 'capitalize_first',
                description: 'Capitalize first letter',
                automatic: true
            });
        }

        // Check for manual review requirements
        for (const pattern of DEFINITION_QUALITY_CONFIG.improvementRules.reviewRequired) {
            if (pattern.test(definition)) {
                suggestions.push({
                    type: 'manual_review',
                    description: 'Definition contains references that may need manual review',
                    automatic: false
                });
                break;
            }
        }

        return suggestions;
    }
}

export default DEFINITION_QUALITY_CONFIG;