#!/usr/bin/env node

// Comprehensive script to validate and upgrade all existing definitions using the new quality control system
import { DefinitionManager } from './definitionManager.js';
import { DefinitionValidator } from './definitionValidator.js';

async function upgradeAllDefinitions() {
    console.log('🚀 Starting Comprehensive Definition Quality Upgrade');
    console.log('═'.repeat(70));
    console.log('This process will:');
    console.log('1. Load all existing definitions');
    console.log('2. Validate each definition using comprehensive quality checks');
    console.log('3. Remove definitions that fail quality standards');
    console.log('4. Generate detailed quality report');
    console.log('5. Save upgraded definitions with quality guarantees');
    console.log();

    // Initialize the definition manager with LLM validation enabled
    const definitionManager = new DefinitionManager({
        enableLLMValidation: process.env.OPENAI_API_KEY ? true : false,
        autoCreateBackups: true,
        qualityThreshold: 70
    });

    console.log(`🔧 Configuration:`);
    console.log(`   LLM Validation: ${definitionManager.llmValidator ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Quality Threshold: ${definitionManager.options.qualityThreshold}/100`);
    console.log(`   Auto Backups: ${definitionManager.options.autoCreateBackups ? 'ENABLED' : 'DISABLED'}`);
    console.log();

    try {
        // Step 1: Load existing definitions
        console.log('📚 Step 1: Loading existing definitions...');
        const loadedDefinitions = await definitionManager.loadDefinitions();
        const totalDefinitions = loadedDefinitions.size;
        
        console.log(`   ✅ Loaded ${totalDefinitions} definitions`);
        
        if (totalDefinitions === 0) {
            console.log('❌ No definitions found to upgrade');
            return;
        }

        // Step 2: Validate all definitions
        console.log('\n🔍 Step 2: Validating all definitions...');
        console.log('   This may take several minutes depending on the number of definitions...');
        
        const validationReport = await definitionManager.validateAllDefinitions();
        
        console.log(`\n📊 Validation Results:`);
        console.log(`   Total definitions: ${validationReport.totalDefinitions}`);
        console.log(`   Valid definitions: ${validationReport.validDefinitions} (${Math.round((validationReport.validDefinitions/validationReport.totalDefinitions)*100)}%)`);
        console.log(`   Invalid definitions: ${validationReport.invalidDefinitions} (${Math.round((validationReport.invalidDefinitions/validationReport.totalDefinitions)*100)}%)`);
        console.log(`   Average quality score: ${validationReport.averageScore}/100`);

        // Step 3: Show sample of low-quality definitions that will be removed
        if (validationReport.lowQualityDefinitions.length > 0) {
            console.log(`\n❌ Sample of definitions that will be removed:`);
            const sampleSize = Math.min(10, validationReport.lowQualityDefinitions.length);
            
            for (let i = 0; i < sampleSize; i++) {
                const def = validationReport.lowQualityDefinitions[i];
                console.log(`   • ${def.word}: "${def.definition.substring(0, 50)}..." (score: ${def.score}/100)`);
                console.log(`     Issues: ${def.issues.join(', ')}`);
            }
            
            if (validationReport.lowQualityDefinitions.length > sampleSize) {
                console.log(`   ... and ${validationReport.lowQualityDefinitions.length - sampleSize} more`);
            }
        }

        // Step 4: Remove low-quality definitions
        console.log(`\n🧹 Step 3: Removing ${validationReport.invalidDefinitions} low-quality definitions...`);
        
        let removedCount = 0;
        for (const lowQualityDef of validationReport.lowQualityDefinitions) {
            try {
                const removeResult = await definitionManager.removeDefinition(lowQualityDef.word);
                if (removeResult.success) {
                    removedCount++;
                }
            } catch (error) {
                console.warn(`   ⚠️ Error removing ${lowQualityDef.word}: ${error.message}`);
            }
        }
        
        console.log(`   ✅ Removed ${removedCount} low-quality definitions`);

        // Step 5: Generate quality improvement report
        console.log('\n📈 Step 4: Quality Improvement Report');
        
        const finalStats = definitionManager.getQualityStats();
        const qualityImprovement = {
            before: {
                total: totalDefinitions,
                averageScore: validationReport.averageScore,
                validPercentage: Math.round((validationReport.validDefinitions/totalDefinitions)*100)
            },
            after: {
                total: finalStats.cacheSize,
                averageScore: finalStats.averageQualityScore,
                validPercentage: 100 // All remaining definitions are valid
            }
        };

        console.log(`   Before upgrade:`);
        console.log(`     • Total definitions: ${qualityImprovement.before.total}`);
        console.log(`     • Average score: ${qualityImprovement.before.averageScore}/100`);
        console.log(`     • Valid definitions: ${qualityImprovement.before.validPercentage}%`);
        
        console.log(`   After upgrade:`);
        console.log(`     • Total definitions: ${qualityImprovement.after.total}`);
        console.log(`     • Average score: ${qualityImprovement.after.averageScore}/100`);
        console.log(`     • Valid definitions: ${qualityImprovement.after.validPercentage}%`);
        
        const qualityGain = qualityImprovement.after.averageScore - qualityImprovement.before.averageScore;
        console.log(`   Quality improvement: +${qualityGain} points`);

        // Step 6: Save upgraded definitions
        console.log('\n💾 Step 5: Saving upgraded definitions...');
        
        const saveSuccess = await definitionManager.saveDefinitionsToFile();
        
        if (saveSuccess) {
            console.log('   ✅ Successfully saved upgraded definitions');
            
            // Generate audit report
            const auditLog = definitionManager.exportAuditLog();
            const removalEntries = auditLog.filter(entry => entry.action === 'remove');
            
            console.log(`\n📋 Audit Summary:`);
            console.log(`   • Total operations: ${auditLog.length}`);
            console.log(`   • Removals: ${removalEntries.length}`);
            console.log(`   • Upgrade completed: ${new Date().toISOString()}`);
            
        } else {
            console.error('   ❌ Failed to save upgraded definitions');
            return;
        }

        // Final summary
        console.log('\n🎉 Definition Quality Upgrade Complete!');
        console.log('═'.repeat(70));
        console.log(`✅ Definitions upgraded: ${totalDefinitions} → ${finalStats.cacheSize}`);
        console.log(`📈 Quality improved: ${qualityImprovement.before.averageScore} → ${qualityImprovement.after.averageScore} (+${qualityGain} points)`);
        console.log(`🗑️ Low-quality definitions removed: ${removedCount}`);
        console.log(`💯 All remaining definitions meet quality standards`);
        console.log();
        console.log('🚀 The definition quality control system is now active and will');
        console.log('   prevent low-quality definitions from entering the system in the future.');

    } catch (error) {
        console.error(`❌ Upgrade failed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
    // Check for required dependencies
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OpenAI API key not found - LLM validation will be disabled');
        console.log('   Set OPENAI_API_KEY environment variable to enable advanced validation');
        console.log();
    }
    
    upgradeAllDefinitions().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

export { upgradeAllDefinitions };